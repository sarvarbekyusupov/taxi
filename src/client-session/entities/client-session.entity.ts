import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { Client } from "../../client/entities/client.entity";

@Entity("client_sessions")
export class ClientSession {
  @PrimaryGeneratedColumn()
  @ApiProperty({ example: 1, description: "Unique identifier for the session" })
  id: number;

  @ManyToOne(() => Client, (client) => client.sessions, { onDelete: "CASCADE" })
  @JoinColumn({ name: "client_id" })
  @ApiProperty({ example: 42, description: "ID of the associated client" })
  client: Client;

  @Column({ type: "text" })
  @ApiProperty({
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    description: "Refresh token for session renewal",
  })
  refresh_token: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  @ApiProperty({
    example: "device-uuid-123",
    required: false,
    description: "Device unique identifier",
  })
  device_id?: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  @ApiProperty({
    example: "ios",
    required: false,
    description: "Device type (e.g., ios, android)",
  })
  device_type?: string;

  @Column({ type: "varchar", length: 512, nullable: true })
  @ApiProperty({
    example: "fcm_token_abc123",
    required: false,
    description: "Firebase Cloud Messaging token",
  })
  fcm_token?: string;

  @Column({ type: "boolean", default: true })
  @ApiProperty({
    example: true,
    description: "Whether the session is currently active",
  })
  is_active: boolean;

  @Column({ type: "timestamp" })
  @ApiProperty({
    example: "2025-07-01T12:00:00Z",
    description: "Session expiration timestamp",
  })
  expires_at: Date;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  @ApiProperty({
    example: "2025-05-29T12:00:00Z",
    description: "Timestamp when the session was created",
  })
  created_at: Date;
}
