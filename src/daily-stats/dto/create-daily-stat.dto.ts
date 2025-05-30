import { ApiProperty } from "@nestjs/swagger";

export class CreateDailyStatsDto {
  @ApiProperty({ description: "Date of the statistics" })
  date: string;

  @ApiProperty({ description: "Service area ID", required: false })
  service_area_id?: number;

  @ApiProperty({ description: "Total rides on that date", required: false })
  total_rides?: number;

  @ApiProperty({ description: "Completed rides count", required: false })
  completed_rides?: number;

  @ApiProperty({ description: "Cancelled rides count", required: false })
  cancelled_rides?: number;

  @ApiProperty({ description: "Total revenue for that day", required: false })
  total_revenue?: number;

  @ApiProperty({ description: "Unique riders count", required: false })
  unique_riders?: number;

  @ApiProperty({ description: "Active drivers count", required: false })
  active_drivers?: number;
}

