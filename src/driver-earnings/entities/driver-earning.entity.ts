import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { Driver } from "../../driver/entities/driver.entity";
import { Ride } from "../../rides/entities/ride.entity";

@Entity("driver_earnings")
export class DriverEarning {
  @PrimaryGeneratedColumn()
  @ApiProperty({ example: 1 })
  id: number;

  @ManyToOne(() => Driver, (driver) => driver.earnings)
  @JoinColumn({ name: "driver_id" })
  driver: Driver;

  @OneToOne(() => Ride)
  @JoinColumn({ name: "ride_id" })
  @ApiProperty({ type: () => Ride })
  ride: Ride;

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
