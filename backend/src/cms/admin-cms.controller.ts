import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { BadRequestException, Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiConsumes, ApiTags } from "@nestjs/swagger";
import { UserRole } from "@prisma/client";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { SessionGuard } from "../auth/session.guard";
import { BannerInputDto, ContentPageInputDto, UpdateBannerDto, UpdateContentPageDto } from "./cms.dto";
import { CmsService } from "./cms.service";

@ApiTags("admin content")
@Controller("admin/cms")
@UseGuards(SessionGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CONTENT_MANAGER)
export class AdminCmsController {
  constructor(private readonly cms: CmsService) {}

  @Get("banners")
  listBanners() {
    return this.cms.listBanners();
  }

  @Post("uploads/banner-media")
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(FileInterceptor("media", { limits: { fileSize: 50 * 1024 * 1024 } }))
  async uploadBannerMedia(@UploadedFile() file?: { originalname: string; mimetype: string; buffer: Buffer }) {
    if (!file) throw new BadRequestException("Choose an image or video to upload");
    const extensions: Record<string, string> = {
      "image/png": ".png",
      "image/webp": ".webp",
      "image/jpeg": ".jpg",
      "image/avif": ".avif",
      "video/mp4": ".mp4",
      "video/webm": ".webm",
    };
    const extension = extensions[file.mimetype];
    if (!extension) throw new BadRequestException("Use a PNG, WebP, JPEG, or AVIF image, or an MP4 or WebM video");
    const suppliedExtension = extname(file.originalname).toLowerCase();
    if (suppliedExtension && suppliedExtension !== extension && !(extension === ".jpg" && suppliedExtension === ".jpeg")) {
      throw new BadRequestException("The media filename does not match its file type");
    }
    const directory = resolve(process.cwd(), "uploads", "banners");
    await mkdir(directory, { recursive: true });
    const filename = `${randomUUID()}${extension}`;
    await writeFile(resolve(directory, filename), file.buffer, { flag: "wx" });
    return { imageUrl: `/uploads/banners/${filename}`, mediaType: file.mimetype.startsWith("video/") ? "video" : "image" };
  }

  @Post("banners")
  createBanner(@Body() input: BannerInputDto) {
    return this.cms.createBanner(input);
  }

  @Patch("banners/:id")
  updateBanner(@Param("id", new ParseUUIDPipe()) id: string, @Body() input: UpdateBannerDto) {
    return this.cms.updateBanner(id, input);
  }

  @Delete("banners/:id")
  archiveBanner(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.cms.archiveBanner(id);
  }

  @Get("pages")
  listPages() {
    return this.cms.listPages();
  }

  @Post("pages")
  createPage(@Body() input: ContentPageInputDto) {
    return this.cms.createPage(input);
  }

  @Patch("pages/:id")
  updatePage(@Param("id", new ParseUUIDPipe()) id: string, @Body() input: UpdateContentPageDto) {
    return this.cms.updatePage(id, input);
  }

  @Delete("pages/:id")
  archivePage(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.cms.archivePage(id);
  }
}
