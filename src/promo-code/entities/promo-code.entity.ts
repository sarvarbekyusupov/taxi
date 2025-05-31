import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { PromoCodeUsage } from "../../promo-code-usage/entities/promo-code-usage.entity";

@Entity()
export class PromoCode {
  @ApiProperty({
    example: 1,
    description: "Unique identifier of the promo code",
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: "SAVE20", description: "Unique promo code string" })
  @Column({ unique: true })
  code: string;

  @ApiProperty({
    example: "20% off on all rides",
    description: "Description of the promo code",
    nullable: true,
  })
  @Column({ type: "text", nullable: true })
  description?: string;

  @ApiProperty({
    example: "percentage",
    description: "Type of discount: 'percentage' or 'flat'",
  })
  @Column()
  discount_type: string;

  @ApiProperty({ example: 20, description: "Discount value, e.g., 20 for 20%" })
  @Column("decimal", { precision: 10, scale: 2 })
  discount_value: number;

  @ApiProperty({
    example: 50,
    description: "Maximum discount amount allowed",
    nullable: true,
  })
  @Column("decimal", { precision: 10, scale: 2, nullable: true })
  max_discount_amount?: number;

  @ApiProperty({
    example: 100,
    description: "Minimum ride amount required to apply promo",
    nullable: true,
  })
  @Column("decimal", { precision: 10, scale: 2, nullable: true })
  min_ride_amount?: number;

  @ApiProperty({
    example: 1000,
    description: "Maximum usage limit of this promo code",
    nullable: true,
  })
  @Column({ type: "int", nullable: true })
  usage_limit?: number;

  @ApiProperty({
    example: 200,
    description: "Current used count of this promo code",
    nullable: true,
  })
  @Column({ type: "int", nullable: true })
  used_count?: number;

  @ApiProperty({
    example: true,
    description: "Indicates if the promo code is active",
  })
  @Column({ default: true })
  is_active: boolean;

  @ApiProperty({
    example: "2025-01-01T00:00:00Z",
    description: "Date from which promo code is valid",
    nullable: true,
  })
  @Column({ type: "timestamp", nullable: true })
  valid_from?: Date;

  @ApiProperty({
    example: "2025-12-31T23:59:59Z",
    description: "Date until which promo code is valid",
    nullable: true,
  })
  @Column({ type: "timestamp", nullable: true })
  valid_until?: Date;

  @ApiProperty({
    example: "2024-05-31T12:00:00Z",
    description: "Creation timestamp of the promo code",
  })
  @CreateDateColumn({ type: "timestamp" })
  created_at: Date;

  @ApiProperty({
    type: () => [PromoCodeUsage],
    description: "List of promo code usages",
  })
  @OneToMany(() => PromoCodeUsage, (usage) => usage.promo_code)
  usages: PromoCodeUsage[];
}
