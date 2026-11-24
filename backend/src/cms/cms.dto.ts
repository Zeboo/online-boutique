import { PartialType } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Matches,
  Min,
  MinLength,
} from "class-validator";

export class BannerInputDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  eyebrow!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(180)
  heading!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(500)
  body!: string;

  @Matches(/^(?:https:\/\/[^\s]+|\/uploads\/banners\/[a-f0-9-]+\.(?:png|webp|jpg|avif|mp4|webm))$/i, {
    message: "imageUrl must be an HTTPS URL or an uploaded banner image or video",
  })
  @MaxLength(2048)
  imageUrl!: string;

  @IsString()
  @MaxLength(500)
  @Matches(/^\/(?:|shop|contact|content\/[a-z0-9]+(?:-[a-z0-9]+)*)$/)
  href = "/shop";

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10000)
  sortOrder?: number;
}

export class UpdateBannerDto extends PartialType(BannerInputDto) {}

export class ContentPageInputDto {
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  slug!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(180)
  title!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50000)
  content!: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  metaTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(320)
  metaDescription?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isPublished?: boolean;
}

export class UpdateContentPageDto extends PartialType(ContentPageInputDto) {}
