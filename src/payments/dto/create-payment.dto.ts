import { ApiProperty } from "@nestjs/swagger";

export class CreatePaymentDto {
  @ApiProperty({ example: 123 })
  ride_id: number;

  @ApiProperty({ example: 15.75 })
  amount: number;

  @ApiProperty({ example: "card" })
  payment_method: string;

  @ApiProperty({ example: 456, required: false })
  payment_card_id?: number;

  @ApiProperty({ example: "completed", required: false })
  status?: string;

  @ApiProperty({ example: "txn_001", required: false })
  transaction_id?: string;

  @ApiProperty({ example: "2025-05-29T08:30:00.000Z", required: false })
  processed_at?: Date;
}
