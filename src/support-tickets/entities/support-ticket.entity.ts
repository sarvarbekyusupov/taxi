import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
} from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { Ride } from "../../rides/entities/ride.entity";

@Entity("support_tickets")
export class SupportTicket {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: "TCK-20240531001" })
  @Column({ unique: true })
  ticket_number: string;

  @ApiProperty({ example: 42 })
  @Column()
  user_id: number;

  @ApiProperty({ example: "passenger" }) 
  @Column()
  user_type: string;

  @ApiProperty({ example: "ride-related", required: false })
  @Column({ nullable: true })
  category: string;

  @ApiProperty({ example: "open" })
  @Column()
  status: string;

  @ApiProperty({ example: "Lost item in vehicle" })
  @Column()
  subject: string;

  @ApiProperty({ example: "I left my bag in the car after the ride." })
  @Column("text")
  description: string;

  @ApiProperty()
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty({ type: () => Ride, required: true })
  @OneToOne(() => Ride, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "ride_id" })
  ride: Ride;
}
