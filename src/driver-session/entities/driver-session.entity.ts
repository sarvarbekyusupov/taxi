import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Driver } from "../../driver/entities/driver.entity";

@Entity("driver_sessions")
export class DriverSession {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Driver, (driver) => driver.sessions)
  @JoinColumn({ name: "driver_id" })
  driver: Driver;

  @Column()
  refresh_token: string;

  @Column({ nullable: true })
  device_id?: string;

  @Column({ nullable: true })
  device_type?: string;

  @Column({ nullable: true })
  fcm_token?: string;

  @Column({ default: true })
  is_active: boolean;

  @Column({ type: "timestamp" })
  expires_at: Date;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  created_at: Date;
}
