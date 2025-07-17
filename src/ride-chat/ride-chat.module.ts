
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RideChatService } from './ride-chat.service';
import { RideChatGateway } from './ride-chat.gateway';
import { RideChat } from './entities/ride-chat.entity';
import { RideChatGatewayDocsController } from './ride-chat.controller';

@Module({
  imports: [TypeOrmModule.forFeature([RideChat])],
  controllers: [RideChatGatewayDocsController],
  providers: [RideChatGateway, RideChatService],
})
export class RideChatModule {}
