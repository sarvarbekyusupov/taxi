import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { IsOptional } from "class-validator";
import { Ride } from "../../rides/entities/ride.entity";
import { ClientPaymentCard } from "../../client-payment-card/entities/client-payment-card.entity";
import { ClientSession } from "../../client-session/entities/client-session.entity";
import { PromoCodeUsage } from "../../promo-code-usage/entities/promo-code-usage.entity";
import { Rating } from "../../ratings/entities/rating.entity";

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

  @OneToMany(() => Ride, (ride) => ride.client)
  rides: Ride[];

  @OneToMany(() => ClientPaymentCard, (card) => card.client)
  payment_cards: ClientPaymentCard[];

  @OneToMany(() => ClientSession, (session) => session.client)
  sessions: ClientSession[];  

  @OneToMany(() => PromoCodeUsage, (usage) => usage.client)
  promo_code_usages: PromoCodeUsage[];

  @OneToMany(() => Rating, (rating) => rating.client_id)
  ratings: Rating[];
}
