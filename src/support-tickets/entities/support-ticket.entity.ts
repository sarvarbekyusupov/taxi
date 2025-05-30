import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from "typeorm";

@Entity("support_tickets")
export class SupportTicket {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({unique: true })
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
}
