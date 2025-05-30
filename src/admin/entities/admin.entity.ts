import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { Exclude } from "@nestjs/class-transformer";

export enum AdminRole {
  ADMIN = "ADMIN",
  SUPERADMIN = "SUPERADMIN",
}

@Entity()
export class Admin {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Exclude()
  @Column({ nullable: true })
  password_hash: string;

  @Column({
    type: "enum",
    enum: AdminRole,
    default: AdminRole.ADMIN,
  })
  role: AdminRole;

  @Column()
  first_name: string;

  @Column()
  last_name: string;

  @Column({ nullable: true })
  phone_number: string;

  @Column({ default: false })
  is_active: boolean;

  @Column({ nullable: true })
  activation_link: string;

  @Column({ nullable: true })
  activation_link_expires_at: Date;

  @Column({ nullable: true })
  password_set_at: Date;

  @Column({ nullable: true })
  refresh_token: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
