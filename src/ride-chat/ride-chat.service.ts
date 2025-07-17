
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateRideChatDto } from './dto/create-ride-chat.dto';
import { RideChat } from './entities/ride-chat.entity';

@Injectable()
export class RideChatService {
  constructor(
    @InjectRepository(RideChat)
    private readonly rideChatRepository: Repository<RideChat>,
  ) {}

  async create(createRideChatDto: CreateRideChatDto): Promise<RideChat> {
    const newMessage = this.rideChatRepository.create(createRideChatDto);
    return this.rideChatRepository.save(newMessage);
  }
}
