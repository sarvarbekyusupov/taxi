
import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("otp")
export class Otp {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  phone_number: string;

  @Column({ length: 6 })
  code: string;

  @Column()
  user_type: string;

  @Column()
  purpose: string;

  @Column({ default: false })
  is_used: boolean;

  @Column({ type: "timestamp" })
  expires_at: Date;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  created_at: Date;
}
