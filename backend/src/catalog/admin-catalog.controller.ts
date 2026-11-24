import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { BadRequestException, Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiConsumes, ApiTags } from "@nestjs/swagger";
import { UserRole } from "@prisma/client";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { SessionGuard } from "../auth/session.guard";
import { CatalogService } from "./catalog.service";
import {
  CategoryInputDto,
  ProductInputDto,
  ProductQueryDto,
  UpdateCategoryDto,
  UpdateProductDto,
} from "./catalog.dto";

@ApiTags("admin catalog")
@Controller("admin/catalog")
@UseGuards(SessionGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MANAGER)
export class AdminCatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get("categories")
  getCategories() {
    return this.catalog.listCategories(true);
  }

  @Post("categories")
  createCategory(@Body() input: CategoryInputDto) {
    return this.catalog.createCategory(input);
  }

  @Patch("categories/:id")
  updateCategory(@Param("id", new ParseUUIDPipe()) id: string, @Body() input: UpdateCategoryDto) {
    return this.catalog.updateCategory(id, input);
  }

  @Delete("categories/:id")
  archiveCategory(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.catalog.archiveCategory(id);
  }

  @Get("products")
  getProducts(@Query() query: ProductQueryDto) {
    return this.catalog.listProducts(query, { includeInactive: true });
  }

  @Post("products")
  createProduct(@Body() input: ProductInputDto) {
    return this.catalog.createProduct(input);
  }

  @Post("uploads/product-image")
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(FileInterceptor("image", { limits: { fileSize: 5 * 1024 * 1024 } }))
  async uploadProductImage(@UploadedFile() file?: { originalname: string; mimetype: string; buffer: Buffer }) {
    if (!file) throw new BadRequestException("Choose an image to upload");
    const extensions: Record<string, string> = { "image/png": ".png", "image/webp": ".webp", "image/jpeg": ".jpg" };
    const extension = extensions[file.mimetype];
    if (!extension) throw new BadRequestException("Use a PNG, WebP, or JPEG image");
    const suppliedExtension = extname(file.originalname).toLowerCase();
    if (suppliedExtension && ![".png", ".webp", ".jpg", ".jpeg"].includes(suppliedExtension)) {
      throw new BadRequestException("The image filename is not supported");
    }
    const directory = resolve(process.cwd(), "uploads", "products");
    await mkdir(directory, { recursive: true });
    const filename = `${randomUUID()}${extension}`;
    await writeFile(resolve(directory, filename), file.buffer, { flag: "wx" });
    return { imageUrl: `/uploads/products/${filename}` };
  }

  @Patch("products/:id")
  updateProduct(@Param("id", new ParseUUIDPipe()) id: string, @Body() input: UpdateProductDto) {
    return this.catalog.updateProduct(id, input);
  }

  @Delete("products/:id")
  archiveProduct(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.catalog.archiveProduct(id);
  }
}
