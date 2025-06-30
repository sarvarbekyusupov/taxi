// ride-location.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from "typeorm";
import { Ride } from "./ride.entity";

@Entity()
export class RideLocation {
  @PrimaryGeneratedColumn()
  id: number;

//   @ManyToOne(() => Ride, (ride) => ride.locations, { onDelete: "CASCADE" })
  ride: Ride;

  @Column("float")
  latitude: number;

  @Column("float")
  longitude: number;

  @CreateDateColumn()
  recorded_at: Date;
}
