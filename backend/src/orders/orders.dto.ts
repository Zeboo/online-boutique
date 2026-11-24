import { OrderStatus, PaymentMethod, PaymentStatus } from "@prisma/client";
import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsEnum,
  IsInt,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Matches,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";

export class OrderItemInputDto {
  @IsUUID()
  productId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(20)
  size!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  quantity!: number;
}

export class CreateOrderDto {
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod = PaymentMethod.CASH_ON_DELIVERY;
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(160)
  recipientName!: string;

  @IsString()
  @MinLength(7)
  @MaxLength(40)
  phone!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(240)
  addressLine1!: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  addressLine2?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  city!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  region!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(32)
  postalCode!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(2)
  @Matches(/^[A-Za-z]{2}$/)
  country!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => OrderItemInputDto)
  items!: OrderItemInputDto[];
}

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status!: OrderStatus;
}

export class UpdatePaymentStatusDto {
  @IsEnum(PaymentStatus)
  paymentStatus!: PaymentStatus;
}

export class UpdateTrackingDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  trackingCode?: string;

  @IsOptional()
  @IsIn(["DHL", "FEDEX", "UPS", "USPS", "TCS", "LEOPARDS", "POSTEX", "OTHER"])
  shippingCarrier?: string;
}

export class AdminOrderQueryDto {
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 50;
}
