import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
} from "typeorm";


import { Driver } from "../../driver/entities/driver.entity";
import { Client } from "../../client/entities/client.entity";
import { Rating } from "../../ratings/entities/rating.entity";
import { Payment } from "../../payments/entities/payment.entity";
import { SupportTicket } from "../../support-tickets/entities/support-ticket.entity";
import { ChatMessage } from "../../chat-messages/entities/chat-message.entity";
import { PromoCodeUsage } from "../../promo-code-usage/entities/promo-code-usage.entity";

export enum RideType {
  STANDARD = "standard",
  OPEN_TRIP = "open_trip",
}

export enum RideStatus {
  PENDING = "pending",
  ACCEPTED = "accepted",
  STARTED = "started",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  PAID = "paid",
}

export enum PaymentMethod {
  CASH = "cash",
  CARD = "card",
  WALLET = "wallet",
}

export enum TariffType {
  ECONOMY = "economy",
  COMFORT = "comfort",
  BUSINESS = "business",
  TIME_BASED = "time_based",
  DELIVERY = "delivery", // ✅ Add this line
}


@Entity("rides")
export class Ride {
  @PrimaryGeneratedColumn("increment")
  id: number;

  @Column({
    type: "enum",
    enum: RideType,
    default: RideType.STANDARD,
  })
  ride_type: RideType;

  @Column({
    type: "enum",
    enum: RideStatus,
    default: RideStatus.PENDING,
  })
  status: RideStatus;

  @ManyToOne(() => Client, (client) => client.rides)
  @JoinColumn({ name: "client_id" })
  client: Client;

  @ManyToOne(() => Driver, (driver) => driver.rides)
  @JoinColumn({ name: "driver_id" })
  driver: Driver;

  @Column("decimal")
  pickup_latitude: number;

  @Column("decimal")
  pickup_longitude: number;

  @Column("text")
  pickup_address: string;

  @Column("decimal", { nullable: true })
  destination_latitude?: number;

  @Column("decimal", { nullable: true })
  destination_longitude?: number;

  @Column("text", { nullable: true })
  destination_address?: string;

  @Column("decimal", { nullable: true })
  estimated_distance?: number;

  @Column("int", { nullable: true })
  estimated_duration_minutes?: number;

  @Column("decimal", { nullable: true })
  estimated_fare?: number;

  @Column("decimal", { nullable: true })
  actual_distance_km?: number;

  @Column("int", { nullable: true })
  actual_duration_minutes?: number;

  @Column("decimal", { nullable: true })
  final_fare?: number;

  @Column({
    type: "enum",
    enum: PaymentMethod,
    default: PaymentMethod.CASH,
  })
  payment_method: PaymentMethod;

  @Column({
    type: "enum",
    enum: TariffType,
  })
  tariff_type: TariffType;

  @Column({ nullable: true })
  promo_code_id?: number;

  @Column("decimal", { nullable: true })
  discount_amount?: number;

  @Column({ default: false })
  created_by_operator: boolean;

  @Column({ type: "timestamp" })
  requested_at: Date;

  @Column({ type: "timestamp", nullable: true })
  accepted_at?: Date;

  @Column({ type: "timestamp", nullable: true })
  started_at?: Date;

  @Column({ type: "timestamp", nullable: true })
  completed_at?: Date;

  @Column({ type: "timestamp", nullable: true })
  cancelled_at?: Date;

  @Column("text", { nullable: true })
  cancellation_reason?: string;

  // One-to-One relationships
  @OneToOne(() => Rating, (rating) => rating.ride)
  rating: Rating;

  @OneToOne(() => Payment, (payment) => payment.ride)
  payment: Payment;

  @OneToOne(() => SupportTicket, (ticket) => ticket.ride)
  support_ticket: SupportTicket;

  @OneToOne(() => PromoCodeUsage, (usage) => usage.ride)
  promo_code_usage: PromoCodeUsage;

  // One-to-Many relationship
  @OneToMany(() => ChatMessage, (message) => message.ride)
  chat_messages: ChatMessage[];
}
