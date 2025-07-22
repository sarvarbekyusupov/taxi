import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, ManyToMany, JoinTable } from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { Driver } from "../../driver/entities/driver.entity";
import { Tariff } from "../../tariff/entities/tariff.entity";

@Entity("cars")
export class Car {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ type: () => Driver })
  @ManyToOne(() => Driver, (driver) => driver.cars, {
    cascade: ["insert", "update"],
    onDelete: "SET NULL",
    nullable: true,
  })
  @JoinColumn({ name: "driver_id" })
  driver: Driver;

  @ApiProperty({ example: "Toyota" })
  @Column()
  brand: string;

  @ApiProperty({ example: "Corolla" })
  @Column()
  model: string;

  @ApiProperty({ example: 2022 })
  @Column("int")
  year: number;

  @ApiProperty({ example: "ABC1234" })
  @Column({ unique: true })
  license_plate: string;

  @ApiProperty({ example: "Red", required: false })
  @Column({ nullable: true })
  color?: string;

  @ApiProperty({ example: "https://example.com/doc1.pdf", required: false })
  @Column({ type: "text", nullable: true })
  registration_document_url?: string;

  @ApiProperty({ example: "https://example.com/doc2.pdf", required: false })
  @Column({ type: "text", nullable: true })
  insurance_document_url?: string;

  @ApiProperty({ example: true, required: false })
  @Column({ type: "boolean", default: true })
  is_active?: boolean;

  @ManyToMany(() => Tariff, (tariff) => tariff.eligible_cars)
  @JoinTable({
    name: "car_tariffs", // Bog'lovchi jadval nomi
    joinColumn: { name: "car_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "tariff_id", referencedColumnName: "id" },
  })
  eligible_tariffs: Tariff[];
}
