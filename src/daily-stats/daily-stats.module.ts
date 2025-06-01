import { Module } from '@nestjs/common';
import { DailyStatsService } from './daily-stats.service';
import { DailyStatsController } from './daily-stats.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DailyStats } from './entities/daily-stat.entity';
import { ServiceArea } from '../service-areas/entities/service-area.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([DailyStats, ServiceArea]), AuthModule],
  controllers: [DailyStatsController],
  providers: [DailyStatsService],
})
export class DailyStatsModule {}
