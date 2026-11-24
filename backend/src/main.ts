import "dotenv/config";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { resolve } from "node:path";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import type { NextFunction, Request, Response } from "express";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { rawBody: true });
  app.useStaticAssets(resolve(process.cwd(), "uploads"), { prefix: "/uploads/" });
  const storefrontOrigins = (process.env.STOREFRONT_ORIGIN ?? "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.use(helmet());
  app.use(cookieParser());
  app.use((request: Request, response: Response, next: NextFunction) => {
    // Public catalog content is safe to cache briefly. Never cache auth,
    // customer orders, or admin responses because those are user-specific.
    if (
      request.method === "GET" &&
      /^\/api\/v1\/(products|categories|cms)(\/|$)/.test(request.path)
    ) {
      response.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
    } else {
      response.setHeader("Cache-Control", "no-store");
    }
    const origin = request.headers.origin;
    if (origin && !storefrontOrigins.includes(origin)) {
      response.status(403).json({ statusCode: 403, message: "Origin is not allowed" });
      return;
    }
    next();
  });
  app.enableCors({
    origin: storefrontOrigins,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  });
  app.setGlobalPrefix("api/v1");
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  if (process.env.NODE_ENV !== "production") {
    const swaggerConfig = new DocumentBuilder()
      .setTitle("Umber Collection API")
      .setDescription("Versioned API for the Umber Collection storefront and administration.")
      .setVersion("1.0")
      .addCookieAuth("umber_session")
      .build();
    SwaggerModule.setup("api/docs", app, SwaggerModule.createDocument(app, swaggerConfig));
  }

  app.enableShutdownHooks();
  await app.listen(Number(process.env.API_PORT ?? 3001), process.env.API_HOST ?? "127.0.0.1");
}

bootstrap().catch((error: unknown) => {
  console.error("Could not start the Umber Collection API.", error);
  process.exitCode = 1;
});
