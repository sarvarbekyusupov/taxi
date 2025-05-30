import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("driver_sessions")
export class DriverSession {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  driver_id: number;

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
