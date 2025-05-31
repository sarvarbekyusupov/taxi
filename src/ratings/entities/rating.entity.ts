import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
  ManyToOne,
} from "typeorm";
import { Ride } from "../../rides/entities/ride.entity";
import { Client } from "../../client/entities/client.entity";
import { Driver } from "../../driver/entities/driver.entity";

@Entity("ratings")
export class Rating {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Ride, (ride) => ride.rating)
  @JoinColumn({ name: "ride_id" })
  ride: Ride;

  @Column()
  client_id: number;

  @Column()
  driver_id: number;

  @Column({ type: "int", nullable: true })
  client_rating?: number;

  @Column({ type: "int", nullable: true })
  driver_rating?: number;

  @Column({ type: "text", nullable: true })
  client_comment?: string;

  @CreateDateColumn()
  created_at: Date;



  @ManyToOne(() => Client, (client) => client.ratings)
  @JoinColumn({ name: "client_id" })
  client: Client;

  @ManyToOne(() => Driver, (driver) => driver.ratings)
  @JoinColumn({ name: "driver_id" })
  driver: Driver;
}
