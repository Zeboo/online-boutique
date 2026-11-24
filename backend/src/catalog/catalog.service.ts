import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type { Audience } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import type {
  CategoryInputDto,
  ProductInputDto,
  ProductQueryDto,
  UpdateCategoryDto,
  UpdateProductDto,
} from "./catalog.dto";

const categorySelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  imageUrl: true,
  isActive: true,
  sortOrder: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CategorySelect;

const productInclude = {
  category: { select: categorySelect },
} satisfies Prisma.ProductInclude;

function nullablePrice(price: number | undefined) {
  return price === undefined ? undefined : new Prisma.Decimal(price);
}

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  listCategories(includeInactive = false) {
    return this.prisma.category.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        ...categorySelect,
        _count: { select: { products: { where: { isActive: true } } } },
      },
    });
  }

  async findCategory(slug: string) {
    const category = await this.prisma.category.findFirst({
      where: { slug, isActive: true },
      select: categorySelect,
    });
    if (!category) throw new NotFoundException("Category not found");
    return category;
  }

  listProducts(query: ProductQueryDto, options: { includeInactive?: boolean; featured?: boolean } = {}) {
    const search = query.q?.trim();
    return this.prisma.product.findMany({
      where: {
        ...(options.includeInactive ? {} : { isActive: true }),
        ...(options.featured ? { isFeatured: true } : {}),
        ...(query.audience ? { audience: query.audience } : {}),
        category: { isActive: true },
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
                { sku: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: productInclude,
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      take: query.limit,
    });
  }

  async findProduct(slug: string, includeInactive = false) {
    const product = await this.prisma.product.findFirst({
      where: { slug, ...(includeInactive ? {} : { isActive: true }) },
      include: productInclude,
    });
    if (!product) throw new NotFoundException("Product not found");
    return product;
  }

  createCategory(input: CategoryInputDto) {
    return this.prisma.category.create({ data: input, select: categorySelect });
  }

  async updateCategory(id: string, input: UpdateCategoryDto) {
    const exists = await this.prisma.category.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw new NotFoundException("Category not found");
    return this.prisma.category.update({ where: { id }, data: input, select: categorySelect });
  }

  async archiveCategory(id: string) {
    const exists = await this.prisma.category.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw new NotFoundException("Category not found");
    return this.prisma.category.update({
      where: { id },
      data: { isActive: false },
      select: categorySelect,
    });
  }

  async createProduct(input: ProductInputDto) {
    const category = await this.prisma.category.findFirst({
      where: { id: input.categoryId, isActive: true },
      select: { id: true },
    });
    if (!category) throw new NotFoundException("An active category is required");

    try {
      return await this.prisma.product.create({
        data: {
          ...input,
          price: new Prisma.Decimal(input.price),
          compareAtPrice: nullablePrice(input.compareAtPrice),
        },
        include: productInclude,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const target = Array.isArray(error.meta?.target) ? error.meta.target.join(", ") : "a unique field";
        throw new ConflictException(`A product with this ${target} already exists.`);
      }
      throw error;
    }
  }

  async updateProduct(id: string, input: UpdateProductDto) {
    const exists = await this.prisma.product.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw new NotFoundException("Product not found");
    if (input.categoryId) {
      const category = await this.prisma.category.findFirst({
        where: { id: input.categoryId, isActive: true },
        select: { id: true },
      });
      if (!category) throw new NotFoundException("An active category is required");
    }

    try {
      return await this.prisma.product.update({
        where: { id },
        data: {
          ...input,
          price: nullablePrice(input.price),
          compareAtPrice: nullablePrice(input.compareAtPrice),
        },
        include: productInclude,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const target = Array.isArray(error.meta?.target) ? error.meta.target.join(", ") : "a unique field";
        throw new ConflictException(`A product with this ${target} already exists.`);
      }
      throw error;
    }
  }

  async archiveProduct(id: string) {
    const exists = await this.prisma.product.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw new NotFoundException("Product not found");
    return this.prisma.product.update({
      where: { id },
      data: { isActive: false },
      include: productInclude,
    });
  }

  countByAudience(audience: Audience) {
    return this.prisma.product.count({
      where: { isActive: true, audience },
    });
  }
}
