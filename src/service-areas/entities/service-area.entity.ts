import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from "typeorm";
import { Tariff } from "../../tariff/entities/tariff.entity";
import { DailyStats } from "../../daily-stats/entities/daily-stat.entity";

@Entity("service_areas")
export class ServiceArea {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  city: string;

  @Column()
  country: string;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @OneToMany(() => Tariff, (tariff) => tariff.service_area)
  tariffs: Tariff[];

  @OneToMany(() => DailyStats, (stat) => stat.service_area)
  daily_stats: DailyStats[];
}
