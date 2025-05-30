import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Unique,
} from "typeorm";
import { ApiProperty } from "@nestjs/swagger";

@Entity("daily_stats")
@Unique(["date", "service_area_id"])
export class DailyStats {
  @PrimaryGeneratedColumn()
  @ApiProperty({ description: "Primary key" })
  id: number;

  @Column({ type: "date" })
  @ApiProperty({ description: "Date of the statistics" })
  date: string;

  @Column({ type: "bigint", nullable: true })
  @ApiProperty({ description: "Service area ID", required: false })
  service_area_id: number;

  @Column({ type: "int", nullable: true })
  @ApiProperty({ description: "Total rides on that date", required: false })
  total_rides: number;

  @Column({ type: "int", nullable: true })
  @ApiProperty({ description: "Completed rides count", required: false })
  completed_rides: number;

  @Column({ type: "int", nullable: true })
  @ApiProperty({ description: "Cancelled rides count", required: false })
  cancelled_rides: number;

  @Column({ type: "decimal", nullable: true })
  @ApiProperty({ description: "Total revenue for that day", required: false })
  total_revenue: number;

  @Column({ type: "int", nullable: true })
  @ApiProperty({ description: "Unique riders count", required: false })
  unique_riders: number;

  @Column({ type: "int", nullable: true })
  @ApiProperty({ description: "Active drivers count", required: false })
  active_drivers: number;

  @CreateDateColumn({ type: "timestamp" })
  @ApiProperty({ description: "Record creation timestamp" })
  created_at: Date;
}
