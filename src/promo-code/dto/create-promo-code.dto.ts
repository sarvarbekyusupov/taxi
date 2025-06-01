import { ApiProperty } from "@nestjs/swagger";
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  Min,
} from "class-validator";

enum DiscountType {
  PERCENTAGE = "percentage",
  FLAT = "flat",
}

export class CreatePromoCodeDto {
  @ApiProperty({
    example: "WELCOME50",
    description: "Unique promo code identifier",
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    example: "Get 50% off for your first ride",
    description: "Description of the promo code",
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: "percentage",
    enum: DiscountType,
    description: 'Discount type: either "percentage" or "flat"',
  })
  @IsEnum(DiscountType)
  discount_type: DiscountType;

  @ApiProperty({
    example: 50,
    description: "Discount value - percentage or flat amount depending on type",
  })
  @IsNumber()
  @IsPositive()
  discount_value: number;

  @ApiProperty({
    example: 20,
    description: "Maximum discount amount (only for percentage type)",
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  max_discount_amount?: number;

  @ApiProperty({
    example: 10,
    description: "Minimum ride fare required to apply the promo code",
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  min_ride_amount?: number;

  @ApiProperty({
    example: 100,
    description: "Total number of times this promo code can be used",
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  usage_limit?: number;

  @ApiProperty({
    example: true,
    description: "Whether the promo code is currently active",
  })
  @IsBoolean()
  is_active: boolean;

  @ApiProperty({
    example: "2025-06-01T00:00:00Z",
    description: "Start date of promo code validity",
    required: false,
  })
  @IsOptional()
  @IsDateString()
  valid_from?: Date;

  @ApiProperty({
    example: "2025-06-30T23:59:59Z",
    description: "End date of promo code validity",
    required: false,
  })
  @IsOptional()
  @IsDateString()
  valid_until?: Date;
}
