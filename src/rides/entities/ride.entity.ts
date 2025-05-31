import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
  OneToOne,
  OneToMany,
} from "typeorm";
import { Driver } from "../../driver/entities/driver.entity";
import { Client } from "../../client/entities/client.entity";
import { Rating } from "../../ratings/entities/rating.entity";
import { Payment } from "../../payments/entities/payment.entity";
import { SupportTicket } from "../../support-tickets/entities/support-ticket.entity";
import { ChatMessage } from "../../chat-messages/entities/chat-message.entity";
import { PromoCodeUsage } from "../../promo-code-usage/entities/promo-code-usage.entity";

@Entity("rides")
export class Ride {
  @PrimaryGeneratedColumn("increment")
  id: number;

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

  @Column("decimal")
  destination_latitude: number;

  @Column("decimal")
  destination_longitude: number;

  @Column("text")
  destination_address: string;

  @Column("decimal", { nullable: true })
  estimated_distance: number;

  @Column("int", { nullable: true })
  estimated_duration_minutes: number;

  @Column("decimal", { nullable: true })
  estimated_fare: number;

  @Column("decimal", { nullable: true })
  actual_distance_km: number;

  @Column("int", { nullable: true })
  actual_duration_minutes: number;

  @Column("decimal", { nullable: true })
  final_fare: number;

  @Column({ nullable: true })
  status: string;

  @Column()
  payment_method: string;

  @Column({ nullable: true })
  promo_code_id: number;

  @Column("decimal", { nullable: true })
  discount_amount: number;

  @Column({ type: "timestamp" })
  requested_at: Date;

  @Column({ type: "timestamp", nullable: true })
  accepted_at: Date;

  @Column({ type: "timestamp", nullable: true })
  started_at: Date;

  @Column({ type: "timestamp", nullable: true })
  completed_at: Date;

  @Column({ type: "timestamp", nullable: true })
  cancelled_at: Date;

  @Column("text", { nullable: true })
  cancellation_reason: string;

  @OneToOne(() => Rating, (rating) => rating.ride)
  rating: Rating;

  //-------------------

  @OneToOne(() => Payment, (payment) => payment.ride)
  payment: Payment;

  @OneToOne(() => SupportTicket, (ticket) => ticket.ride)
  support_ticket: SupportTicket;

  @OneToMany(() => ChatMessage, (message) => message.ride)
  chat_messages: ChatMessage[];

  @OneToOne(() => PromoCodeUsage, (usage) => usage.ride)
  promo_code_usage: PromoCodeUsage;
}
