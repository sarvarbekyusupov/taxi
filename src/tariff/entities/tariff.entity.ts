import { IsOptional } from "class-validator";
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";

@Entity()
export class Tariff {
  @PrimaryGeneratedColumn()
  id: number;

  // Relation example — optional
  // @ManyToOne(() => ServiceArea, { nullable: false })
  // @JoinColumn({ name: "service_area_id" })
  @Column()
  service_area_id: number;

  @Column()
  car_type: string;

  @Column("decimal", { precision: 10, scale: 2 })
  base_fare: number;

  @Column("decimal", { precision: 10, scale: 2 })
  per_km_rate: number;

  @Column("decimal", { precision: 10, scale: 2 })
  per_minute_rate: number;

  @Column("decimal", { precision: 10, scale: 2 })
  minimum_fare: number;

  @IsOptional()
  @Column("decimal", { precision: 10, scale: 2 })
  cancellation_fee: number;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
