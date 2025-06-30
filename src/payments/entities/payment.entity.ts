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
import { PaymentMethod, PaymentStatus } from "../enums/enum";

@Entity("payments")
export class Payment {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 25.5 })
  @Column("decimal", { precision: 10, scale: 2 })
  amount: number;

  @ApiProperty({ enum: PaymentMethod })
  @Column({ type: "enum", enum: PaymentMethod })
  payment_method: PaymentMethod;

  @ApiProperty({ enum: PaymentStatus, required: false })
  @Column({ type: "enum", enum: PaymentStatus, nullable: true })
  status?: PaymentStatus;

  @ApiProperty({ example: "txn_123456789", required: false })
  @Column({ nullable: true })
  transaction_id?: string;

  @ApiProperty({ required: false })
  @Column({ type: "timestamp", nullable: true })
  processed_at?: Date;

  @ApiProperty()
  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  created_at: Date;

  @ApiProperty({ type: () => Ride })
  @OneToOne(() => Ride, (ride) => ride.payment)
  @JoinColumn({ name: "ride_id" })
  ride: Ride;

  @ApiProperty({ type: () => ClientPaymentCard, required: false })
  @ManyToOne(() => ClientPaymentCard, (card) => card.payments, {
    nullable: true,
  })
  @JoinColumn({ name: "payment_card_id" })
  payment_card?: ClientPaymentCard;
}
