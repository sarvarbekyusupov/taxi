// entities/client-payment.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from "typeorm";
import { Client } from "../../client/entities/client.entity";
import { Ride } from "../../rides/entities/ride.entity";

@Entity("client_payments")
export class ClientPayment {
  @PrimaryGeneratedColumn()
  id: number;

//   @ManyToOne(() => Client, (client) => client.payments)
  client: Client;

//   @ManyToOne(() => Ride, (ride) => ride.payments)
  ride: Ride;

  @Column()
  transaction_id: string;

  @Column()
  amount: number;

  @Column()
  card_token: string;

  @Column()
  state: number;

  @Column({ nullable: true })
  performed_at: Date;
}
