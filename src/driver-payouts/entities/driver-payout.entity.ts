import { ApiProperty } from "@nestjs/swagger";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("driver_payouts")
export class DriverPayout {
  @ApiProperty({ description: "Unique identifier for the payout" })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: "ID of the driver receiving the payout" })
  @Column()
  driver_id: number;

  @ApiProperty({ description: "Amount paid to the driver" })
  @Column("decimal", { precision: 10, scale: 2 })
  amount: number;

  @ApiProperty({
    description: "ID of the payment card used (optional)",
    required: false,
  })
  @Column({ type: "bigint", nullable: true })
  payment_card_id?: number;

  @ApiProperty({
    description: "Status of the payout (e.g., pending, completed)",
    required: false,
  })
  @Column({ nullable: true })
  status?: string;

  @ApiProperty({
    description: "Transaction ID from the payment gateway (optional)",
    required: false,
  })
  @Column({ nullable: true })
  transaction_id?: string;

  @ApiProperty({
    description: "Timestamp when payout was requested",
    required: false,
  })
  @Column({ type: "timestamp", nullable: true })
  requested_at?: Date;

  @ApiProperty({
    description: "Timestamp when payout was processed",
    required: false,
  })
  @Column({ type: "timestamp", nullable: true })
  processed_at?: Date;
}
