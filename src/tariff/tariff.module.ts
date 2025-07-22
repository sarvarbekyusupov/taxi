import { Module } from '@nestjs/common';
import { TariffService } from './tariff.service';
import { TariffController } from './tariff.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tariff } from './entities/tariff.entity';
import { ServiceArea } from '../service-areas/entities/service-area.entity';
import { AuthModule } from '../auth/auth.module';
import { ServiceAreasModule } from '../service-areas/service-areas.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tariff, ServiceArea]),
    AuthModule,
    ServiceAreasModule,
  ],
  controllers: [TariffController],
  providers: [TariffService],
})
export class TariffModule {}
