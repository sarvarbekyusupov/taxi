import { Module } from '@nestjs/common';
import { DailyStatsService } from './daily-stats.service';
import { DailyStatsController } from './daily-stats.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DailyStats } from './entities/daily-stat.entity';

@Module({
  imports:[TypeOrmModule.forFeature([DailyStats])],
  controllers: [DailyStatsController],
  providers: [DailyStatsService],
})
export class DailyStatsModule {}
