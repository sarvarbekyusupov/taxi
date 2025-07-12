import { Module } from '@nestjs/common';
import { DriverService } from './driver.service';
import { DriverController } from './driver.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Driver } from './entities/driver.entity';
import { OtpModule } from '../otp/otp.module';
import { AuthModule } from '../auth/auth.module';
import { TelegramModule } from '../telegram/telegram.module';

@Module({
  imports:[TypeOrmModule.forFeature([Driver]),OtpModule, AuthModule, TelegramModule],
  controllers: [DriverController],
  providers: [DriverService],
  exports: [DriverService],
})
export class DriverModule {}
