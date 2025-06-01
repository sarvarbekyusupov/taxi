import { Module } from '@nestjs/common';
import { ServiceAreaService } from './service-areas.service';
import { ServiceAreasController } from './service-areas.controller';
import { ServiceArea } from './entities/service-area.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports:[TypeOrmModule.forFeature([ServiceArea]), AuthModule],
  controllers: [ServiceAreasController],
  providers: [ServiceAreaService],
})
export class ServiceAreasModule {}
