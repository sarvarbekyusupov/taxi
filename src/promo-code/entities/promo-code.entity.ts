import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";

@Entity()
export class PromoCode {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  code: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column()
  discount_type: string; // e.g., 'percentage' or 'flat'

  @Column("decimal", { precision: 10, scale: 2 })
  discount_value: number;

  @Column("decimal", { precision: 10, scale: 2, nullable: true })
  max_discount_amount?: number;

  @Column("decimal", { precision: 10, scale: 2, nullable: true })
  min_ride_amount?: number;

  @Column({ type: "int", nullable: true })
  usage_limit?: number;

  @Column({ type: "int", nullable: true })
  used_count?: number;

  @Column({ default: true })
  is_active: boolean;

  @Column({ type: "timestamp", nullable: true })
  valid_from?: Date;

  @Column({ type: "timestamp", nullable: true })
  valid_until?: Date;

  @CreateDateColumn({ type: "timestamp" })
  created_at: Date;
}
