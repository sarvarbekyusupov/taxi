import { Controller, Post, Body } from "@nestjs/common";
import { SupportTicketService } from "./support-tickets.service";
import { CreateSupportTicketDto } from "./dto/create-support-ticket.dto";
import { ApiTags, ApiOperation, ApiBody } from "@nestjs/swagger";

@ApiTags("Support Tickets - Public")
@Controller("support-tickets/public")
export class PublicSupportTicketsController {
  constructor(private readonly supportTicketsService: SupportTicketService) {}

  @Post()
  @ApiOperation({ summary: "Create support ticket (user-facing)" })
  @ApiBody({ type: CreateSupportTicketDto })
  create(@Body() dto: CreateSupportTicketDto) {
    return this.supportTicketsService.create(dto);
  }
}
