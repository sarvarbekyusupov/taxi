import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
import { ApiProperty } from "@nestjs/swagger";

@Entity("otp")
export class Otp {
  @ApiProperty({ description: "Unique identifier for the OTP entry" })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: "Phone number associated with the OTP" })
  @Column()
  phone_number: string;

  @ApiProperty({ description: "Hashed one-time password" })
  @Column({ length: 255 })
  otp: string;

  @ApiProperty({ description: "Timestamp when the OTP was created" })
  @Column()
  createdAt: Date;
}
