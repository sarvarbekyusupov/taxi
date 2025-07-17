
import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { CreateRideChatDto } from './dto/create-ride-chat.dto';
import { RideChatService } from './ride-chat.service';

@WebSocketGateway({ cors: true })
export class RideChatGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly rideChatService: RideChatService) {}

  @SubscribeMessage('joinRideChat')
  handleJoinRoom(
    @MessageBody() rideId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(rideId);
  }

  @SubscribeMessage('leaveRideChat')
  handleLeaveRoom(
    @MessageBody() rideId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(rideId);
  }

  @SubscribeMessage('sendRideChatMessage')
  async handleMessage(@MessageBody() createRideChatDto: CreateRideChatDto) {
    const message = await this.rideChatService.create(createRideChatDto);
    this.server.to(createRideChatDto.rideId).emit('newRideChatMessage', message);
    return message;
  }
}
