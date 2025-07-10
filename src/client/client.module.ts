import { Module } from '@nestjs/common';
import { ClientService } from './client.service';
import { ClientController } from './client.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Client } from './entities/client.entity';
import { OtpModule } from '../otp/otp.module';
import { AuthModule } from '../auth/auth.module';
import { TelegramModule } from '../telegram/telegram.module';

@Module({
  imports:[TypeOrmModule.forFeature([Client]), OtpModule, AuthModule, TelegramModule],
  controllers: [ClientController],
  providers: [ClientService],
})
export class ClientModule {}
