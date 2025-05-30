import { Module } from '@nestjs/common';
import { TariffService } from './tariff.service';
import { TariffController } from './tariff.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tariff } from './entities/tariff.entity';

@Module({
  imports:[TypeOrmModule.forFeature([Tariff])],
  controllers: [TariffController],
  providers: [TariffService],
})
export class TariffModule {}
