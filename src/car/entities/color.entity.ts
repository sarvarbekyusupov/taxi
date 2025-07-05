import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Color {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  hex: string;
}
