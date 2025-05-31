import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { PromoCode } from "../../promo-code/entities/promo-code.entity";
import { Client } from "../../client/entities/client.entity";
import { Ride } from "../../rides/entities/ride.entity";

@Entity("promo_code_usage")
@Index(["promo_code", "client"])
export class PromoCodeUsage {
  @ApiProperty({
    example: 1,
    description: "Unique identifier of promo code usage",
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 15.5, description: "Discount amount applied" })
  @Column("decimal", { precision: 10, scale: 2 })
  discount_amount: number;

  @ApiProperty({
    example: "2025-05-31T12:34:56Z",
    description: "Timestamp when the promo code was used",
    nullable: true,
  })
  @Column({ type: "timestamp", nullable: true })
  used_at: Date;

  @ApiProperty({ description: "Promo code applied", type: () => PromoCode })
  @ManyToOne(() => PromoCode, (promo) => promo.usages)
  @JoinColumn({ name: "promo_code_id" })
  promo_code: PromoCode;

  @ApiProperty({
    description: "Client who used the promo code",
    type: () => Client,
  })
  @ManyToOne(() => Client, (client) => client.promo_code_usages)
  @JoinColumn({ name: "client_id" })
  client: Client;

  @ApiProperty({
    description: "Ride associated with the promo code usage",
    type: () => Ride,
  })
  @OneToOne(() => Ride)
  @JoinColumn({ name: "ride_id" })
  ride: Ride;
}
