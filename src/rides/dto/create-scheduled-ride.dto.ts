import { CreateRideDto } from "./create-ride.dto";
import { IsDateString } from "class-validator";

export class CreateScheduledRideDto extends CreateRideDto {
  @IsDateString()
  scheduled_for_at: string;
}
