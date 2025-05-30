import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from "typeorm";

@Entity("rides")
export class Ride {
  @PrimaryGeneratedColumn("increment")
  id: number;

  @Column()
  client_id: number;

  @Column({ nullable: true })
  driver_id: number;

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
}
