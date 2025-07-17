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
import { CarType } from "../../car-type/entities/car-type.entity";

@Entity("tariffs")
export class Tariff {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    example: "Economy",
    description: "The unique name for the tariff.",
  })
  @Column({ unique: true }) // A name for a tariff should be a string.
  name: string;

  @ApiProperty({ type: () => ServiceArea })
  @ManyToOne(() => ServiceArea, (area) => area.tariffs, {
    onDelete: "CASCADE", // If a service area is deleted, its tariffs are deleted too.
    nullable: false, // A tariff MUST belong to a service area.
  })
  @JoinColumn({ name: "service_area_id" })
  service_area: ServiceArea;

  @ApiProperty({ type: () => CarType })
  @ManyToOne(() => CarType, { nullable: true })
  @JoinColumn({ name: "car_type_id" })
  car_type: CarType;

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
