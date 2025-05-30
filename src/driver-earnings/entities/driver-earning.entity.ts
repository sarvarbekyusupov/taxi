import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { ApiProperty } from "@nestjs/swagger";

@Entity("driver_earnings")
export class DriverEarning {
  @PrimaryGeneratedColumn()
  @ApiProperty({ example: 1 })
  id: number;

  @Column()
  @ApiProperty({ example: 10 })
  driver_id: number;

  @Column()
  @ApiProperty({ example: 101 })
  ride_id: number;

  @Column("decimal")
  @ApiProperty({ example: "120.50" })
  gross_amount: string;

  @Column("decimal")
  @ApiProperty({ example: "0.15" })
  commission_rate: string;

  @Column("decimal")
  @ApiProperty({ example: "18.08" })
  commission_amount: string;

  @Column("decimal")
  @ApiProperty({ example: "102.42" })
  net_amount: string;

  @Column({ type: "timestamp", nullable: true })
  @ApiProperty({ example: "2025-05-29T12:00:00Z", required: false })
  processed_at?: Date;
}
