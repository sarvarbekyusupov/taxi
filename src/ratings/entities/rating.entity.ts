import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";

@Entity("ratings")
export class Rating {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  ride_id: number;

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
}
