import { Module } from '@nestjs/common';
import { ChatMessagesService } from './chat-messages.service';
import { ChatMessagesController } from './chat-messages.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatMessage } from './entities/chat-message.entity';
import { Ride } from '../rides/entities/ride.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports:[TypeOrmModule.forFeature([ChatMessage, Ride]), AuthModule],
  controllers: [ChatMessagesController],
  providers: [ChatMessagesService],
})
export class ChatMessagesModule {}
