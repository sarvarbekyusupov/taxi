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

  @ApiProperty({ description: "One-time password sent to the user" })
  @Column()
  otp: string;

  @ApiProperty({ description: "Timestamp when the OTP was created" })
  @Column()
  createdAt: Date;
}
