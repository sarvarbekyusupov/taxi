import { PartialType } from '@nestjs/swagger';
import { CreateDailyStatsDto } from './create-daily-stat.dto';

export class UpdateDailyStatDto extends PartialType(CreateDailyStatsDto) {}
