import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { IsOptional } from "class-validator";

@Entity("clients")
export class Client {
  @PrimaryGeneratedColumn()
  @ApiProperty({ example: 1 })
  id: number;

  @Column()
  @ApiProperty({ example: "+1234567890" })
  phone_number: string;

  @Column()
  @ApiProperty({ example: "John Doe" })
  name: string;

  @Column({ type: "text", nullable: true })
  @ApiProperty({ example: "https://example.com/photo.jpg", required: false })
  profile_photo_url?: string;

  @Column({ type: "int", nullable: true })
  @ApiProperty({ example: 25, required: false })
  total_rides?: number;

  @Column({ default: true })
  @ApiProperty({ example: true })
  is_active: boolean;

  @Column({ default: false })
  @ApiProperty({ example: false })
  is_verified: boolean;

  @Column({ type: "text", nullable: true })
  refresh_token: string | null;

  @Column({ default: null })
  @ApiProperty({ example: 7892 })
  @IsOptional()
  client_otp: number;
}
