import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  ManyToOne,
} from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { Ride } from "../../rides/entities/ride.entity";
import { ClientPaymentCard } from "../../client-payment-card/entities/client-payment-card.entity";

@Entity("payments")
export class Payment {
  @ApiProperty({ example: 1, description: "Unique identifier for the payment" })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 25.5, description: "Amount paid" })
  @Column("decimal")
  amount: number;

  @ApiProperty({ example: "credit_card", description: "Method of payment" })
  @Column()
  payment_method: string;

  @ApiProperty({
    example: 10,
    description: "ID of the payment card used, if applicable",
    nullable: true,
  })
  @Column({ nullable: true })
  payment_card_id?: number;

  @ApiProperty({
    example: "completed",
    description: "Payment status",
    nullable: true,
  })
  @Column({ nullable: true })
  status?: string;

  @ApiProperty({
    example: "txn_123456789",
    description: "Transaction identifier from payment gateway",
    nullable: true,
  })
  @Column({ nullable: true })
  transaction_id?: string;

  @ApiProperty({
    example: "2025-05-31T12:00:00Z",
    description: "Timestamp when payment was processed",
    nullable: true,
  })
  @Column({ type: "timestamp", nullable: true })
  processed_at?: Date;

  @ApiProperty({
    example: "2025-05-31T11:59:59Z",
    description: "Timestamp when payment record was created",
  })
  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  created_at: Date;

  @ApiProperty({
    type: () => Ride,
    description: "The ride associated with this payment",
  })
  @OneToOne(() => Ride, (ride) => ride.payment)
  @JoinColumn({ name: "ride_id" })
  ride: Ride;

  @ApiProperty({
    type: () => ClientPaymentCard,
    description: "Payment card used for the payment",
    nullable: true,
  })
  @ManyToOne(() => ClientPaymentCard, (card) => card.payments)
  @JoinColumn({ name: "payment_card_id" })
  payment_card: ClientPaymentCard;
}
