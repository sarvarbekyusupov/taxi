import { IsBoolean, IsInt, IsOptional, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SaveCardDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  userId: number;

  @ApiProperty({ example: "tok_1Hh12345ABCDE" })
  @IsString()
  cardToken: string;

  @ApiProperty({ example: "4242" })
  @IsString()
  @Length(4, 4)
  lastFourDigits: string;

  @ApiProperty({ example: "Visa", required: false })
  @IsOptional()
  @IsString()
  cardBrand?: string;

  @ApiProperty({ example: "John Doe", required: false })
  @IsOptional()
  @IsString()
  cardholderName?: string;

  @ApiProperty({ example: 12, required: false })
  @IsOptional()
  @IsInt()
  expiryMonth?: number;

  @ApiProperty({ example: 2027, required: false })
  @IsOptional()
  @IsInt()
  expiryYear?: number;

  @ApiProperty({ example: true })
  @IsBoolean()
  isDefault: boolean;

  @ApiProperty({ example: true })
  @IsBoolean()
  isActive: boolean;
}
