import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ChatMessage } from "./entities/chat-message.entity";
import { CreateChatMessageDto } from "./dto/create-chat-message.dto";
import { UpdateChatMessageDto } from "./dto/update-chat-message.dto";

@Injectable()
export class ChatMessagesService {
  constructor(
    @InjectRepository(ChatMessage)
    private readonly chatMessages: Repository<ChatMessage>
  ) {}

  create(dto: CreateChatMessageDto) {
    const entry = this.chatMessages.create(dto);
    return this.chatMessages.save(entry);
  }

  findAll() {
    return this.chatMessages.find();
  }

  findOne(id: number) {
    return this.chatMessages.findOneBy({ id });
  }

  update(id: number, dto: UpdateChatMessageDto) {
    return this.chatMessages.update({ id }, dto);
  }

  remove(id: number) {
    return this.chatMessages.delete({ id });
  }
}
