import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, ManyToOne } from "typeorm";
import { Ride } from "../../rides/entities/ride.entity";
import { ClientPaymentCard } from "../../client-payment-card/entities/client-payment-card.entity";

@Entity("payments")
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;


  @Column("decimal")
  amount: number;

  @Column()
  payment_method: string;

  @Column({ nullable: true })
  payment_card_id?: number;

  @Column({ nullable: true })
  status?: string;

  @Column({ nullable: true })
  transaction_id?: string;

  @Column({ type: "timestamp", nullable: true })
  processed_at?: Date;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  created_at: Date;

  @OneToOne(() => Ride, (ride) => ride.payment)
  @JoinColumn({ name: "ride_id" })
  ride: Ride;

  @ManyToOne(() => ClientPaymentCard, (card) => card.payments)
  @JoinColumn({ name: "payment_card_id" })
  payment_card: ClientPaymentCard;
}
