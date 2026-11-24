import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type {
  BannerInputDto,
  ContentPageInputDto,
  UpdateBannerDto,
  UpdateContentPageDto,
} from "./cms.dto";

@Injectable()
export class CmsService {
  constructor(private readonly prisma: PrismaService) {}

  getPublicBanners() {
    return this.prisma.banner.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });
  }

  getPublicPages() {
    return this.prisma.contentPage.findMany({
      where: { isPublished: true },
      select: {
        slug: true,
        title: true,
        metaTitle: true,
        metaDescription: true,
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  async getPublicPage(slug: string) {
    const page = await this.prisma.contentPage.findFirst({
      where: { slug, isPublished: true },
    });
    if (!page) throw new NotFoundException("Page not found");
    return page;
  }

  listBanners() {
    return this.prisma.banner.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });
  }

  createBanner(input: BannerInputDto) {
    return this.prisma.banner.create({ data: input });
  }

  async updateBanner(id: string, input: UpdateBannerDto) {
    const exists = await this.prisma.banner.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw new NotFoundException("Banner not found");
    return this.prisma.banner.update({ where: { id }, data: input });
  }

  async archiveBanner(id: string) {
    const exists = await this.prisma.banner.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw new NotFoundException("Banner not found");
    return this.prisma.banner.update({
      where: { id },
      data: { isActive: false },
    });
  }

  listPages() {
    return this.prisma.contentPage.findMany({ orderBy: { updatedAt: "desc" } });
  }

  createPage(input: ContentPageInputDto) {
    return this.prisma.contentPage.create({ data: input });
  }

  async updatePage(id: string, input: UpdateContentPageDto) {
    const exists = await this.prisma.contentPage.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw new NotFoundException("Content page not found");
    return this.prisma.contentPage.update({ where: { id }, data: input });
  }

  async archivePage(id: string) {
    const exists = await this.prisma.contentPage.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw new NotFoundException("Content page not found");
    return this.prisma.contentPage.update({
      where: { id },
      data: { isPublished: false },
    });
  }
}
