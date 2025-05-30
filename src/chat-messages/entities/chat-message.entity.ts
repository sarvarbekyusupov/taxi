import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
import { ApiProperty } from "@nestjs/swagger";

@Entity("chat_messages")
export class ChatMessage {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 101 })
  @Column()
  ride_id: number;

  @ApiProperty({ example: "client" })
  @Column()
  sender_type: string;

  @ApiProperty({ example: 55 })
  @Column()
  sender_id: number;

  @ApiProperty({ example: "Where are you?" })
  @Column("text")
  message: string;

  @ApiProperty({ example: "text", required: false })
  @Column({ type: "varchar", nullable: true })
  message_type?: string;

  @ApiProperty({ example: false, required: false })
  @Column({ type: "boolean", default: false })
  is_read?: boolean;

  @ApiProperty({ example: "2025-05-29T13:45:00Z", required: false })
  @Column({ type: "timestamp", nullable: true })
  sent_at?: Date;
}
