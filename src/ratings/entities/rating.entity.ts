import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
  ManyToOne,
} from "typeorm";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Ride } from "../../rides/entities/ride.entity";
import { Client } from "../../client/entities/client.entity";
import { Driver } from "../../driver/entities/driver.entity";

@Entity("ratings")
export class Rating {
  @ApiProperty({ example: 1, description: "Unique identifier of the rating" })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: "Associated ride", type: () => Ride })
  @OneToOne(() => Ride, (ride) => ride.rating)
  @JoinColumn({ name: "ride_id" })
  ride: Ride;

  @ApiProperty({
    example: 10,
    description: "ID of the client who gave the rating",
  })
  @Column()
  client_id: number;

  @ApiProperty({ example: 20, description: "ID of the driver who was rated" })
  @Column()
  driver_id: number;

  @ApiPropertyOptional({
    example: 4,
    description: "Rating given by the client to the driver (1-5)",
  })
  @Column({ type: "int", nullable: true })
  client_rating?: number;

  @ApiPropertyOptional({
    example: 5,
    description: "Rating given by the driver to the client (1-5)",
  })
  @Column({ type: "int", nullable: true })
  driver_rating?: number;

  @ApiPropertyOptional({
    example: "Friendly and punctual driver",
    description: "Optional comment from the client",
  })
  @Column({ type: "text", nullable: true })
  client_comment?: string;

  @ApiProperty({ description: "Timestamp when the rating was created" })
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty({
    description: "Client who gave the rating",
    type: () => Client,
  })
  @ManyToOne(() => Client, (client) => client.ratings)
  @JoinColumn({ name: "client_id" })
  client: Client;

  @ApiProperty({ description: "Driver who was rated", type: () => Driver })
  @ManyToOne(() => Driver, (driver) => driver.ratings)
  @JoinColumn({ name: "driver_id" })
  driver: Driver;
}
