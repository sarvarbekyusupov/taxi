import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("payments")
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  ride_id: number;

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
}
