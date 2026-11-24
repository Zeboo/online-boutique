import { Controller, Get, Param } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { CmsService } from "./cms.service";

@ApiTags("content")
@Controller("cms")
export class CmsController {
  constructor(private readonly cms: CmsService) {}

  @Get("banners")
  getBanners() {
    return this.cms.getPublicBanners();
  }

  @Get("pages")
  getPages() {
    return this.cms.getPublicPages();
  }

  @Get("pages/:slug")
  getPage(@Param("slug") slug: string) {
    return this.cms.getPublicPage(slug);
  }
}
