import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Driver } from "../../driver/entities/driver.entity";
import { ApiProperty } from "@nestjs/swagger";

@Entity("driver_sessions")
export class DriverSession {
  @ApiProperty({
    example: 1,
    description: "Unique identifier for the driver session",
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    type: () => Driver,
    description: "Driver associated with this session",
  })
  @ManyToOne(() => Driver, (driver) => driver.sessions)
  @JoinColumn({ name: "driver_id" })
  driver: Driver;

  @ApiProperty({
    example: "refresh_token_example",
    description: "Refresh token for session authentication",
  })
  @Column()
  refresh_token: string;

  @ApiProperty({
    example: "device-12345",
    description: "Unique device identifier",
    required: false,
  })
  @Column({ nullable: true })
  device_id?: string;

  @ApiProperty({
    example: "android",
    description: "Type of device (e.g., android, ios)",
    required: false,
  })
  @Column({ nullable: true })
  device_type?: string;

  @ApiProperty({
    example: "fcm_token_example",
    description: "Firebase Cloud Messaging token for push notifications",
    required: false,
  })
  @Column({ nullable: true })
  fcm_token?: string;

  @ApiProperty({
    example: true,
    description: "Indicates whether the session is currently active",
  })
  @Column({ default: true })
  is_active: boolean;

  @ApiProperty({
    example: "2025-06-01T10:00:00Z",
    description: "Expiration timestamp of the refresh token",
  })
  @Column({ type: "timestamp" })
  expires_at: Date;

  @ApiProperty({
    example: "2025-05-31T09:00:00Z",
    description: "Timestamp when the session was created",
  })
  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  created_at: Date;
}
