import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { Tariff } from "../../tariff/entities/tariff.entity";
import { DailyStats } from "../../daily-stats/entities/daily-stat.entity";

@Entity("service_areas")
export class ServiceArea {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: "Downtown" })
  @Column()
  name: string;

  @ApiProperty({ example: "Tashkent" })
  @Column()
  city: string;


  // Option 1: Circular area (simpler for MVP)
  @ApiProperty({ example: 41.2995, description: "Center latitude" })
  @Column({ type: "decimal", precision: 10, scale: 8, nullable: true })
  center_lat: number;

  @ApiProperty({ example: 69.2401, description: "Center longitude" })
  @Column({ type: "decimal", precision: 11, scale: 8, nullable: true })
  center_lng: number;

  @ApiProperty({ example: 5.0, description: "Radius in kilometers" })
  @Column({ type: "decimal", precision: 8, scale: 2, nullable: true })
  radius_km: number;

  @ApiProperty({ example: true })
  @Column({ default: true })
  is_active: boolean;

  @ApiProperty()
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty({ type: () => [Tariff], required: false })
  @OneToMany(() => Tariff, (tariff) => tariff.service_area, {
    cascade: true,
  })
  tariffs: Tariff[];

  @ApiProperty({ type: () => [DailyStats], required: false })
  @OneToMany(() => DailyStats, (stat) => stat.service_area, {
    cascade: true,
  })
  daily_stats: DailyStats[];
}
