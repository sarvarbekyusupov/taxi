import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
import { ApiProperty } from "@nestjs/swagger";

@Entity("client_sessions")
export class ClientSession {
  @PrimaryGeneratedColumn()
  @ApiProperty({ example: 1, description: "Unique identifier for the session" })
  id: number;

  @Column()
  @ApiProperty({ example: 42, description: "ID of the associated client" })
  client_id: number;

  @Column()
  @ApiProperty({
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    description: "Refresh token for session renewal",
  })
  refresh_token: string;

  @Column({ nullable: true })
  @ApiProperty({
    example: "device-uuid-123",
    required: false,
    description: "Device unique identifier",
  })
  device_id?: string;

  @Column({ nullable: true })
  @ApiProperty({
    example: "ios",
    required: false,
    description: "Device type (e.g., ios, android)",
  })
  device_type?: string;

  @Column({ nullable: true })
  @ApiProperty({
    example: "fcm_token_abc123",
    required: false,
    description: "Firebase Cloud Messaging token",
  })
  fcm_token?: string;

  @Column({ default: true })
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
