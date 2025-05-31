import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { ApiProperty } from "@nestjs/swagger";

export enum AdminRole {
  ADMIN = "ADMIN",
  SUPERADMIN = "SUPERADMIN",
}

@Entity("admins")
export class Admin {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: "admin@example.com" })
  @Column({ unique: true })
  email: string;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  password_hash: string;

  @ApiProperty({ enum: AdminRole, default: AdminRole.ADMIN })
  @Column({ type: "enum", enum: AdminRole, default: AdminRole.ADMIN })
  role: AdminRole;

  @ApiProperty({ example: "John" })
  @Column()
  first_name: string;

  @ApiProperty({ example: "Doe" })
  @Column()
  last_name: string;

  @ApiProperty({ required: false, example: "+998901234567" })
  @Column({ nullable: true })
  phone_number: string;

  @ApiProperty({ default: false })
  @Column({ default: false })
  is_active: boolean;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  activation_link: string;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  activation_link_expires_at: Date;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  password_set_at: Date;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  refresh_token: string;

  @ApiProperty()
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updated_at: Date;

}
