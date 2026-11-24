import { config } from "dotenv";
import { resolve } from "node:path";
import { UserRole } from "@prisma/client";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../auth/password";

config({ path: resolve(process.cwd(), ".env"), override: true });
config({ path: resolve(__dirname, "../.env"), override: true });

async function createFirstAdmin() {
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  if (!email || !password || password.length < 16) {
    throw new Error(
      "Set BOOTSTRAP_ADMIN_EMAIL and a BOOTSTRAP_ADMIN_PASSWORD of at least 16 characters in backend/.env",
    );
  }

  const prisma = new PrismaClient();
  try {
    const existingAdmin = await prisma.user.findFirst({
      where: { role: UserRole.ADMIN },
      select: { id: true },
    });
    if (existingAdmin) throw new Error("An administrator already exists; bootstrap is disabled");

    const existingUser = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existingUser) throw new Error("That email already belongs to an account");

    await prisma.user.create({
      data: {
        name: "Umber Administrator",
        email,
        passwordHash: await hashPassword(password),
        role: UserRole.ADMIN,
      },
    });
    console.info(`Created the initial administrator account for ${email}.`);
  } finally {
    await prisma.$disconnect();
  }
}

createFirstAdmin().catch((error: unknown) => {
  console.error("Could not create the initial administrator.", error);
  process.exitCode = 1;
});
