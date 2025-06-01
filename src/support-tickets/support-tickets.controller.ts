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
import { CreateSupportTicketDto } from "./dto/create-support-ticket.dto";
import { UpdateSupportTicketDto } from "./dto/update-support-ticket.dto";
import { SupportTicketService } from "./support-tickets.service";
import { Roles } from "../common/decorators/role.decorator";
import { RoleGuard } from "../auth/role.guard";
import { UserCategoryGuard } from "../auth/user.guard";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";

@ApiTags("Support Tickets")
@ApiBearerAuth()
@Controller("support-tickets")
@UseGuards(RoleGuard, UserCategoryGuard)
@Roles("admin", "super_admin")
export class SupportTicketsController {
  constructor(private readonly supportTicketsService: SupportTicketService) {}

  @Post()
  @ApiOperation({ summary: "Create a new support ticket" })
  create(@Body() createSupportTicketDto: CreateSupportTicketDto) {
    return this.supportTicketsService.create(createSupportTicketDto);
  }

  @Get()
  @ApiOperation({ summary: "Retrieve all support tickets" })
  findAll() {
    return this.supportTicketsService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a support ticket by ID" })
  findOne(@Param("id") id: string) {
    return this.supportTicketsService.findOne(+id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a support ticket by ID" })
  update(
    @Param("id") id: string,
    @Body() updateSupportTicketDto: UpdateSupportTicketDto
  ) {
    return this.supportTicketsService.update(+id, updateSupportTicketDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a support ticket by ID" })
  remove(@Param("id") id: string) {
    return this.supportTicketsService.remove(+id);
  }
}
