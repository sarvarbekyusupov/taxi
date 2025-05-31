import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from "typeorm";
import { PromoCode } from "../../promo-code/entities/promo-code.entity";
import { Client } from "../../client/entities/client.entity";
import { Ride } from "../../rides/entities/ride.entity";

@Entity("promo_code_usage")
@Index(["promo_code", "client"])
export class PromoCodeUsage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("decimal", { precision: 10, scale: 2 })
  discount_amount: number;

  @Column({ type: "timestamp", nullable: true })
  used_at: Date;

  @ManyToOne(() => PromoCode, (promo) => promo.usages)
  @JoinColumn({ name: "promo_code_id" })
  promo_code: PromoCode;

  @ManyToOne(() => Client, (client) => client.promo_code_usages)
  @JoinColumn({ name: "client_id" })
  client: Client;

  @OneToOne(() => Ride)
  @JoinColumn({ name: "ride_id" })
  ride: Ride;
}
