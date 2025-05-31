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
import { ServiceArea } from "../../service-areas/entities/service-area.entity";

@Entity()
export class Tariff {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => ServiceArea, (area) => area.tariffs)
  @JoinColumn({ name: "service_area_id" })
  service_area: ServiceArea;

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
