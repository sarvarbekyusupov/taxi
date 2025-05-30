import { Entity, PrimaryGeneratedColumn, Column, Index } from "typeorm";

@Entity("promo_code_usage")
@Index(["promo_code_id", "client_id"])
export class PromoCodeUsage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  promo_code_id: number;

  @Column()
  client_id: number;

  @Column()
  ride_id: number;

  @Column("decimal", { precision: 10, scale: 2 })
  discount_amount: number;

  @Column({ type: "timestamp", nullable: true })
  used_at: Date;
}
