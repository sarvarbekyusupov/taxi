// entities/user-card.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from "typeorm";
import { Client } from "../../client/entities/client.entity";

@Entity("user_cards")
export class UserCard {
  @PrimaryGeneratedColumn()
  id: number;

//   @ManyToOne(() => Client, (user) => user.cards)
  user: Client;

  @Column()
  card_token: string;

  @Column()
  card_mask: string;

  @Column()
  expire_date: string;

  @Column({ default: false })
  is_primary: boolean;
}
