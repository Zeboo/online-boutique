import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { CatalogService } from "./catalog.service";
import { ProductQueryDto } from "./catalog.dto";

@ApiTags("catalog")
@Controller()
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get("categories")
  getCategories() {
    return this.catalog.listCategories();
  }

  @Get("categories/:slug")
  getCategory(@Param("slug") slug: string) {
    return this.catalog.findCategory(slug);
  }

  @Get("products/featured")
  getFeaturedProducts(@Query() query: ProductQueryDto) {
    return this.catalog.listProducts(query, { featured: true });
  }

  @Get("products")
  getProducts(@Query() query: ProductQueryDto) {
    return this.catalog.listProducts(query);
  }

  @Get("products/:slug")
  getProduct(@Param("slug") slug: string) {
    return this.catalog.findProduct(slug);
  }
}
