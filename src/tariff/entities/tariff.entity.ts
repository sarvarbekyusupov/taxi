import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { ServiceArea } from "../../service-areas/entities/service-area.entity";

@Entity("tariffs")
export class Tariff {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ type: () => ServiceArea })
  @ManyToOne(() => ServiceArea, (area) => area.tariffs, {
    cascade: ["insert", "update"],
    onDelete: "CASCADE",
    nullable: false,
  })
  @JoinColumn({ name: "service_area_id" })
  service_area: ServiceArea;

  @ApiProperty({ example: "sedan" })
  @Column()
  car_type: string;

  @ApiProperty({ example: 3.5 })
  @Column("decimal", { precision: 10, scale: 2 })
  base_fare: number;

  @ApiProperty({ example: 1.2 })
  @Column("decimal", { precision: 10, scale: 2 })
  per_km_rate: number;

  @ApiProperty({ example: 0.5 })
  @Column("decimal", { precision: 10, scale: 2 })
  per_minute_rate: number;

  @ApiProperty({ example: 5.0 })
  @Column("decimal", { precision: 10, scale: 2 })
  minimum_fare: number;

  @ApiProperty({ example: 2.0, required: false })
  @Column("decimal", { precision: 10, scale: 2, nullable: true })
  cancellation_fee: number;

  @ApiProperty({ example: true })
  @Column({ default: true })
  is_active: boolean;

  @ApiProperty()
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updated_at: Date;
}
