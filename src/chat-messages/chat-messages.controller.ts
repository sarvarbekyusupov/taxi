import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from "@nestjs/common";
import { ChatMessagesService } from "./chat-messages.service";
import { CreateChatMessageDto } from "./dto/create-chat-message.dto";
import { UpdateChatMessageDto } from "./dto/update-chat-message.dto";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { RoleGuard } from "../auth/role.guard";
import { UserCategoryGuard } from "../auth/user.guard";
import { Roles } from "../common/decorators/role.decorator";

@ApiTags("Chat Messages")
@UseGuards(RoleGuard, UserCategoryGuard)
@Roles("admin") 

@Controller("chat-messages")
export class ChatMessagesController {
  constructor(private readonly chatMessagesService: ChatMessagesService) {}

  @Post()
  @ApiOperation({ summary: "Create a chat message" })
  @ApiResponse({ status: 201, description: "Message created successfully" })
  create(@Body() createChatMessageDto: CreateChatMessageDto) {
    return this.chatMessagesService.create(createChatMessageDto);
  }

  @Get()
  @ApiOperation({ summary: "Get all chat messages" })
  @ApiResponse({ status: 200, description: "List of chat messages" })
  findAll() {
    return this.chatMessagesService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a single chat message by ID" })
  @ApiResponse({ status: 200, description: "Chat message found" })
  findOne(@Param("id") id: string) {
    return this.chatMessagesService.findOne(+id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a chat message" })
  @ApiResponse({ status: 200, description: "Message updated successfully" })
  update(
    @Param("id") id: string,
    @Body() updateChatMessageDto: UpdateChatMessageDto
  ) {
    return this.chatMessagesService.update(+id, updateChatMessageDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a chat message" })
  @ApiResponse({ status: 200, description: "Message deleted successfully" })
  remove(@Param("id") id: string) {
    return this.chatMessagesService.remove(+id);
  }
}
