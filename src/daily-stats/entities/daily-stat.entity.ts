import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Unique,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { ServiceArea } from "../../service-areas/entities/service-area.entity";

@Entity("daily_stats")
@Unique(["date", "service_area_id"])
export class DailyStats {
  @PrimaryGeneratedColumn()
  @ApiProperty({ description: "Primary key" })
  id: number;

  @Column({ type: "date" })
  @ApiProperty({ description: "Date of the statistics", example: "2025-05-31" })
  date: string;

  @Column({ type: "int", nullable: true })
  @ApiProperty({
    description: "Total rides on that date",
    example: 120,
    required: false,
  })
  total_rides: number;

  @Column({ type: "int", nullable: true })
  @ApiProperty({
    description: "Completed rides count",
    example: 110,
    required: false,
  })
  completed_rides: number;

  @Column({ type: "int", nullable: true })
  @ApiProperty({
    description: "Cancelled rides count",
    example: 10,
    required: false,
  })
  cancelled_rides: number;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  @ApiProperty({
    description: "Total revenue for that day",
    example: 540.75,
    required: false,
  })
  total_revenue: number;

  @Column({ type: "int", nullable: true })
  @ApiProperty({
    description: "Unique riders count",
    example: 95,
    required: false,
  })
  unique_riders: number;

  @Column({ type: "int", nullable: true })
  @ApiProperty({
    description: "Active drivers count",
    example: 20,
    required: false,
  })
  active_drivers: number;

  @CreateDateColumn({ type: "timestamp" })
  @ApiProperty({
    description: "Record creation timestamp",
    example: "2025-05-31T12:00:00Z",
  })
  created_at: Date;

  @ManyToOne(() => ServiceArea, (area) => area.daily_stats)
  @JoinColumn({ name: "service_area_id" })
  @ApiProperty({ description: "Related service area" })
  service_area: ServiceArea;

  // ✅ Required for @Unique to recognize the column
  @Column({ name: "service_area_id" })
  service_area_id: number;
}
