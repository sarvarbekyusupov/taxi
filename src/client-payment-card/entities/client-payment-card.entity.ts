
import { ApiProperty } from "@nestjs/swagger";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Client } from "../../client/entities/client.entity";
import { Payment } from "../../payments/entities/payment.entity";

@Entity("client_payment_cards")
export class ClientPaymentCard {
  @PrimaryGeneratedColumn()
  @ApiProperty({ example: 1 })
  id: number;

  @ManyToOne(() => Client, (client) => client.payment_cards)
  @JoinColumn({ name: "client_id" })
  client: Client;

  // @Column()
  // @ApiProperty({ example: 1001 })
  // client_id: number;

  @Column()
  @ApiProperty({ example: "tok_1Hh12345ABCDE" })
  card_token: string;

  @Column({ length: 4 })
  @ApiProperty({ example: "4242" })
  last_four_digits: string;

  @Column({ nullable: true })
  @ApiProperty({ example: "Visa", required: false })
  card_brand?: string;

  @Column({ nullable: true })
  @ApiProperty({ example: "John Doe", required: false })
  cardholder_name?: string;

  @Column({ type: "int", nullable: true })
  @ApiProperty({ example: 12, required: false })
  expiry_month?: number;

  @Column({ type: "int", nullable: true })
  @ApiProperty({ example: 2027, required: false })
  expiry_year?: number;

  @Column({ default: false })
  @ApiProperty({ example: true })
  is_default: boolean;

  @Column({ default: true })
  @ApiProperty({ example: true })
  is_active: boolean;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  @ApiProperty({ example: "2025-05-29T12:00:00Z" })
  created_at: Date;



  @OneToMany(() => Payment, (payment) => payment.payment_card)
  payments: Payment[];
}
