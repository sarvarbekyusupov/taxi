import { Module } from '@nestjs/common';
import { PromoCodeUsageService } from './promo-code-usage.service';
import { PromoCodeUsageController } from './promo-code-usage.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PromoCodeUsage } from './entities/promo-code-usage.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports:[TypeOrmModule.forFeature([PromoCodeUsage]), AuthModule],
  controllers: [PromoCodeUsageController],
  providers: [PromoCodeUsageService],
})
export class PromoCodeUsageModule {}
