import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ChatMessage } from "./entities/chat-message.entity";
import { CreateChatMessageDto } from "./dto/create-chat-message.dto";
import { UpdateChatMessageDto } from "./dto/update-chat-message.dto";
import { Ride } from "../rides/entities/ride.entity";

@Injectable()
export class ChatMessagesService {
  constructor(
    @InjectRepository(ChatMessage)
    private readonly chatMessages: Repository<ChatMessage>,

    @InjectRepository(Ride)
    private readonly rideRepository: Repository<Ride>
  ) {}

  async create(dto: CreateChatMessageDto): Promise<ChatMessage> {
    const {
      ride_id,
      sender_type,
      sender_id,
      message,
      message_type,
      is_read,
      sent_at,
    } = dto;

    const ride = await this.rideRepository.findOne({ where: { id: ride_id } });
    if (!ride) {
      throw new NotFoundException("Ride not found");
    }

    const chatMessage = this.chatMessages.create({
      ride,
      ride_id,
      sender_type,
      sender_id,
      message,
      message_type,
      is_read,
      sent_at,
    });

    return this.chatMessages.save(chatMessage);
  }

  findAll() {
    return this.chatMessages.find();
  }

  async findOne(id: number): Promise<ChatMessage> {
    const message = await this.chatMessages.findOneBy({ id });
    if (!message) throw new NotFoundException("Chat message not found");
    return message;
  }

  async update(id: number, dto: UpdateChatMessageDto) {
    const message = await this.chatMessages.findOneBy({ id });
    if (!message) throw new NotFoundException("Chat message not found");
    return this.chatMessages.update({ id }, dto);
  }

  async remove(id: number) {
    const message = await this.chatMessages.findOneBy({ id });
    if (!message) throw new NotFoundException("Chat message not found");
    return this.chatMessages.delete({ id });
  }
}
