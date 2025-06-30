import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { ApiProperty } from "@nestjs/swagger";

export enum AdminRole {
  ADMIN = "ADMIN",
  SUPERADMIN = "SUPERADMIN",
}

@Entity("admins")
export class Admin {
  @ApiProperty({
    example: 1,
    description: "Unique identifier of the admin",
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    example: "admin@example.com",
    description: "Admin's email address, must be unique",
  })
  @Column({ unique: true })
  email: string;

  @ApiProperty({
    required: false,
    description: "Hashed password of the admin (not exposed in responses)",
  })
  @Column({ nullable: true, select: false })
  password_hash: string;

  @ApiProperty({
    enum: AdminRole,
    default: AdminRole.ADMIN,
    description: "Role of the admin, either ADMIN or SUPERADMIN",
  })
  @Column({ type: "enum", enum: AdminRole, default: AdminRole.ADMIN })
  role: AdminRole;

  @ApiProperty({
    example: "John",
    description: "First name of the admin",
  })
  @Column()
  first_name: string;

  @ApiProperty({
    example: "Doe",
    description: "Last name of the admin",
  })
  @Column()
  last_name: string;

  @ApiProperty({
    required: false,
    example: "+998901234567",
    description: "Phone number of the admin",
  })
  @Column({ nullable: true })
  phone_number: string;

  @ApiProperty({
    example: false,
    description: "Indicates if the admin has activated their account",
  })
  @Column({ default: false })
  is_active: boolean;

  @ApiProperty({
    required: false,
    example: "a1b2c3d4-uuid-activation-link",
    description: "Unique activation link sent via email",
  })
  @Column({ nullable: true })
  activation_link: string;

  @ApiProperty({
    required: false,
    example: "2025-06-27T12:00:00Z",
    description: "Datetime when the activation link expires",
  })
  @Column({ nullable: true })
  activation_link_expires_at: Date;

  @ApiProperty({
    required: false,
    example: "2025-06-26T15:00:00Z",
    description: "Datetime when password was set",
  })
  @Column({ nullable: true })
  password_set_at: Date;

  @ApiProperty({
    required: false,
    description: "Hashed refresh token (not exposed in responses)",
  })
  @Column({ nullable: true, select: false })
  refresh_token: string;

  @ApiProperty({
    example: "2025-06-26T15:00:00Z",
    description: "Datetime when admin was created",
  })
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty({
    example: "2025-06-26T16:00:00Z",
    description: "Datetime when admin was last updated",
  })
  @UpdateDateColumn()
  updated_at: Date;
}
