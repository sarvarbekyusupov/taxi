import { ApiProperty } from "@nestjs/swagger";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Driver } from "../../driver/entities/driver.entity";

@Entity("driver_payment_cards")
export class DriverPaymentCard {
  @ApiProperty({ description: "Unique identifier for the payment card" })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: "ID of the driver who owns the card" })
  @ManyToOne(() => Driver, (driver) => driver.payment_cards)
  @JoinColumn({ name: "driver_id" })
  driver: Driver;

  @ApiProperty({
    description:
      "Token representing the saved card (e.g., from payment provider)",
  })
  @Column()
  card_token: string;

  @ApiProperty({ description: "Last four digits of the card number" })
  @Column({ length: 4 })
  last_four_digits: string;

  @ApiProperty({
    description: "Brand of the card (e.g., Visa, MasterCard)",
    required: false,
  })
  @Column({ nullable: true })
  card_brand?: string;

  @ApiProperty({ description: "Name of the cardholder", required: false })
  @Column({ nullable: true })
  cardholder_name?: string;

  @ApiProperty({
    description: "Indicates if this card is the default for the driver",
    required: false,
  })
  @Column({ type: "boolean", nullable: true })
  is_default?: boolean;

  @ApiProperty({
    description: "Whether the card is currently active",
    required: false,
  })
  @Column({ type: "boolean", nullable: true })
  is_active?: boolean;

  @ApiProperty({
    description: "Timestamp when the card was added",
    required: false,
  })
  @Column({ type: "timestamp", nullable: true })
  created_at?: Date;
}
