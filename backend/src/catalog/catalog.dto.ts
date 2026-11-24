import { Audience } from "@prisma/client";
import { PartialType } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  Matches,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

export class CategoryInputDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  slug!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsUrl({ protocols: ["https"], require_protocol: true })
  @MaxLength(2048)
  imageUrl?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class UpdateCategoryDto extends PartialType(CategoryInputDto) {}

export class ProductInputDto {
  @IsEnum(Audience)
  audience!: Audience;

  @IsString()
  @MinLength(2)
  @MaxLength(180)
  name!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(200)
  slug!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(10_000)
  description!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  sku?: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  compareAtPrice?: number;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(3)
  currency?: string;

  @Matches(/^(https:\/\/|\/uploads\/products\/)/, {
    message: "imageUrl must be an HTTPS URL or an uploaded product image",
  })
  @MaxLength(2048)
  imageUrl!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  color?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(10, { each: true })
  sizes?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  stock?: number;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isFeatured?: boolean;

  @IsString()
  @IsUUID()
  categoryId!: string;
}

export class UpdateProductDto extends PartialType(ProductInputDto) {}

export class ProductQueryDto {
  @IsOptional()
  @IsEnum(Audience)
  audience?: Audience;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 48;
}
