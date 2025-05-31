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

  @ApiProperty({ example: "Uzbekistan" })
  @Column()
  country: string;

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
