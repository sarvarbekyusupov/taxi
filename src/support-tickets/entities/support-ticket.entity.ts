import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  JoinColumn,
  OneToOne,
} from "typeorm";
import { Ride } from "../../rides/entities/ride.entity";

@Entity("support_tickets")
export class SupportTicket {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  ticket_number: string;

  @Column()
  user_id: number;

  @Column()
  user_type: string;

  @Column({ nullable: true })
  ride_id: number;

  @Column()
  category: string;

  @Column()
  status: string;

  @Column()
  subject: string;

  @Column("text")
  description: string;

  @CreateDateColumn()
  created_at: Date;

  @OneToOne(() => Ride)
  @JoinColumn({ name: "ride_id" })
  ride: Ride;
}
