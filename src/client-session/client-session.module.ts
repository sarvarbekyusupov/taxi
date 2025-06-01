import { Module } from '@nestjs/common';
import { ClientSessionService } from './client-session.service';
import { ClientSessionController } from './client-session.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientSession } from './entities/client-session.entity';
import { Client } from '../client/entities/client.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([ClientSession, Client]), AuthModule],
  controllers: [ClientSessionController],
  providers: [ClientSessionService],
})
export class ClientSessionModule {}
