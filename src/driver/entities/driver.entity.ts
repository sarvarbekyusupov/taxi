import { ApiProperty } from "@nestjs/swagger";
import { Column, Entity, PrimaryGeneratedColumn, Unique } from "typeorm";

@Entity("drivers")
export class Driver {
  @PrimaryGeneratedColumn()
  @ApiProperty({ example: 1 })
  id: number;

  @Column()
  @Unique(["phone_number"])
  @ApiProperty({ example: "+1234567890" })
  phone_number: string;

  @Column()
  @ApiProperty({ example: "John" })
  first_name: string;

  @Column()
  @ApiProperty({ example: "Doe" })
  last_name: string;

  @Column({ nullable: true })
  @ApiProperty({ example: "https://example.com/photo.jpg", required: false })
  profile_photo_url?: string;

  @Column()
  @ApiProperty({ example: "DL1234567890" })
  driver_license_number: string;

  @Column({ nullable: true })
  @ApiProperty({ example: "https://example.com/license.jpg", required: false })
  driver_license_url?: string;

  @Column("decimal", { nullable: true })
  @ApiProperty({ example: 125.5, required: false })
  balance?: number;

  @Column("decimal", { nullable: true })
  @ApiProperty({ example: 4.8, required: false })
  rating?: number;

  @Column({ type: "int", nullable: true })
  @ApiProperty({ example: 120, required: false })
  total_rides?: number;

  @Column({ default: false })
  @ApiProperty({ example: true })
  is_online: boolean;

  @Column({ default: true })
  @ApiProperty({ example: true })
  is_available: boolean;

  @Column("decimal", { nullable: true })
  @ApiProperty({ example: 37.7749, required: false })
  current_latitude?: number;

  @Column("decimal", { nullable: true })
  @ApiProperty({ example: -122.4194, required: false })
  current_longitude?: number;

  @Column({ type: "timestamp", nullable: true })
  @ApiProperty({ example: "2024-06-01T12:00:00Z", required: false })
  location_updated_at?: Date;

  @Column({ nullable: true })
  @ApiProperty({ example: "verified", required: false })
  verification_status?: string;

  @Column({ default: true })
  @ApiProperty({ example: true })
  is_active: boolean;
}
