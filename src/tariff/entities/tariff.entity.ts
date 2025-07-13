import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { ServiceArea } from "../../service-areas/entities/service-area.entity";
import { CarType } from "./car.tariff.entity";

@Entity("tariffs")
export class Tariff {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ type: () => ServiceArea })
  @ManyToOne(() => ServiceArea, (area) => area.tariffs, {
    onDelete: "CASCADE",
    nullable: false,
  })
  @JoinColumn({ name: "service_area_id" })
  service_area: ServiceArea;

  @ApiProperty({ example: "Economy" })
  @Column()
  car_type: string;

  // @ApiProperty({ type: () => CarType })
  // @ManyToOne(() => CarType, { nullable: false })
  // @JoinColumn({ name: "car_type_id" })
  // car_type: CarType;

  @ApiProperty()
  @Column("decimal", { precision: 10, scale: 2 })
  base_fare: number;

  @ApiProperty()
  @Column("decimal", { precision: 10, scale: 2 })
  per_km_rate: number;

  @ApiProperty()
  @Column("decimal", { precision: 10, scale: 2 })
  per_minute_rate: number;

  @ApiProperty()
  @Column("decimal", { precision: 10, scale: 2 })
  minimum_fare: number;

  @ApiProperty()
  @Column("decimal", { precision: 10, scale: 2 })
  cancellation_fee: number;

  @ApiProperty()
  @Column({ default: true })
  is_active: boolean;

  @ApiProperty()
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updated_at: Date;
}
