import { PartialType } from '@nestjs/swagger';
import { CreateDriverPayoutDto } from './create-driver-payout.dto';

export class UpdateDriverPayoutDto extends PartialType(CreateDriverPayoutDto) {}
