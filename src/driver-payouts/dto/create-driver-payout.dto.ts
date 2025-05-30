import { ApiProperty } from "@nestjs/swagger";

export class CreateDriverPayoutDto {
  @ApiProperty({ example: 42 })
  driver_id: number;

  @ApiProperty({ example: 150.75 })
  amount: number;

  @ApiProperty({ example: 12, required: false })
  payment_card_id?: number;

  @ApiProperty({ example: "pending", required: false })
  status?: string;

  @ApiProperty({ example: "txn_abc123", required: false })
  transaction_id?: string;

  @ApiProperty({ example: "2025-06-01T10:00:00Z" })
  requested_at: Date;

  @ApiProperty({ example: "2025-06-01T10:05:00Z", required: false })
  processed_at?: Date;
}
