import { ApiProperty } from "@nestjs/swagger";
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Driver } from "../../driver/entities/driver.entity";

@Entity("driver_payouts")
export class DriverPayout {
  @ApiProperty({ description: "Unique identifier for the payout", example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: "Driver receiving the payout" })
  @ManyToOne(() => Driver, (driver) => driver.payouts)
  @JoinColumn({ name: "driver_id" })
  driver: Driver;

  @ApiProperty({ description: "Amount paid to the driver", example: 150.75 })
  @Column("decimal", { precision: 10, scale: 2 })
  amount: number;

  @ApiProperty({
    description: "ID of the payment card used (optional)",
    required: false,
    example: 1234567890,
  })
  @Column({ type: "bigint", nullable: true })
  payment_card_id?: number;

  @ApiProperty({
    description: "Status of the payout (e.g., pending, completed)",
    required: false,
    example: "completed",
  })
  @Column({ nullable: true })
  status?: string;

  @ApiProperty({
    description: "Transaction ID from the payment gateway (optional)",
    required: false,
    example: "txn_abc123xyz",
  })
  @Column({ nullable: true })
  transaction_id?: string;

  @ApiProperty({
    description: "Timestamp when payout was requested",
    required: false,
    example: "2025-05-30T15:30:00Z",
  })
  @Column({ type: "timestamp", nullable: true })
  requested_at?: Date;

  @ApiProperty({
    description: "Timestamp when payout was processed",
    required: false,
    example: "2025-05-31T10:00:00Z",
  })
  @Column({ type: "timestamp", nullable: true })
  processed_at?: Date;
}
