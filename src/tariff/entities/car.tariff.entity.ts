// car-type.entity.ts

import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
import { ApiProperty } from "@nestjs/swagger";

@Entity("car_types")
export class CarType {
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: "Economy" })
  @Column({ unique: true })
  name: string;

  @ApiProperty({ example: "Arzon va qulay sayohatlar uchun", required: false })
  @Column({ nullable: true })
  description?: string;
}
