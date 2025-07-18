import { ApiProperty } from "@nestjs/swagger";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn, Unique } from "typeorm";
import { Car } from "../../car/entities/car.entity";
import { Ride } from "../../rides/entities/ride.entity";
import { DriverPaymentCard } from "../../driver-payment-card/entities/driver-payment-card.entity";
import { DriverEarning } from "../../driver-earnings/entities/driver-earning.entity";
import { DriverPayout } from "../../driver-payouts/entities/driver-payout.entity";
import { DriverSession } from "../../driver-session/entities/driver-session.entity";
import { Rating } from "../../ratings/entities/rating.entity";
import { IsOptional } from "class-validator";

@Entity("drivers")
export class Driver {
  @PrimaryGeneratedColumn()
  @ApiProperty({ example: 1 })
  id: number;

  @Column()
  @Unique(["phone_number"])
  @ApiProperty({ example: "+1234567890" })
  phone_number: string;

  @Column({ nullable: true })
  @ApiProperty({ example: "John" })
  first_name: string;

  @Column({ nullable: true })
  @ApiProperty({ example: "Doe" })
  last_name: string;

  @Column({ nullable: true })
  @ApiProperty({ example: "https://example.com/photo.jpg", required: false })
  profile_photo_url?: string;

  @Column({ nullable: true })
  @ApiProperty({ example: "DL1234567890" })
  driver_license_number: string;

  @Column({ nullable: true })
  @ApiProperty({ example: "https://example.com/license.jpg", required: false })
  driver_license_url?: string;

  @Column({ name: "passport_url", type: "varchar", nullable: true })
  passport_url?: string;

  @Column({
    name: "vehicle_technical_passport_url",
    type: "varchar",
    nullable: true,
  })
  vehicle_technical_passport_url?: string;

  @Column({ name: "passenger_license_url", type: "varchar", nullable: true })
  passenger_license_url?: string;

  @Column({
    name: "self_employment_certificate_url",
    type: "varchar",
    nullable: true,
  })
  self_employment_certificate_url?: string;

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

  @Column({ default: true })
  @ApiProperty({ example: true })
  is_active: boolean;

  @Column({ default: false })
  @ApiProperty({ example: false })
  is_verified: boolean;

  @Column({ type: "text", nullable: true })
  refresh_token: string | null;

  @Column({ nullable: true })
  currentRideId: number; // null if not in a ride

  @ApiProperty({ type: () => [Car] }) // ✅ Add this for Swagger
  @OneToMany(() => Car, (car) => car.driver)
  cars: Car[];

  @OneToMany(() => Ride, (ride) => ride.driver)
  rides: Ride[];

  @OneToMany(() => DriverPaymentCard, (card) => card.driver)
  payment_cards: DriverPaymentCard[];

  @OneToMany(() => DriverEarning, (earning) => earning.driver)
  earnings: DriverEarning[];

  @OneToMany(() => DriverPayout, (payout) => payout.driver)
  payouts: DriverPayout[];

  @OneToMany(() => DriverSession, (session) => session.driver)
  sessions: DriverSession[];

  @OneToMany(() => Rating, (rating) => rating.driver)
  ratings: Rating[];
}
