import { Module } from '@nestjs/common';
import { ClientSessionService } from './client-session.service';
import { ClientSessionController } from './client-session.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientSession } from './entities/client-session.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ClientSession])],
  controllers: [ClientSessionController],
  providers: [ClientSessionService],
})
export class ClientSessionModule {}
