import { Module } from '@nestjs/common';
import { PromoCodeService } from './promo-code.service';
import { PromoCodeController } from './promo-code.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PromoCode } from './entities/promo-code.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports:[TypeOrmModule.forFeature([PromoCode]), AuthModule],
  controllers: [PromoCodeController],
  providers: [PromoCodeService],
})
export class PromoCodeModule {}
