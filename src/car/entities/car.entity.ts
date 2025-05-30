import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
import { ApiProperty } from "@nestjs/swagger";

@Entity("cars")
export class Car {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 101 })
  @Column()
  driver_id: number;

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
  @Column()
  license_plate: string;

  @ApiProperty({ example: "Red", required: false })
  @Column({ nullable: true })
  color?: string;

  @ApiProperty({ example: "sedan", required: false })
  @Column({ nullable: true })
  car_type?: string;

  @ApiProperty({ example: "https://example.com/doc1.pdf", required: false })
  @Column({ type: "text", nullable: true })
  registration_document_url?: string;

  @ApiProperty({ example: "https://example.com/doc2.pdf", required: false })
  @Column({ type: "text", nullable: true })
  insurance_document_url?: string;

  @ApiProperty({ example: true, required: false })
  @Column({ type: "boolean", default: true })
  is_active?: boolean;
}
