import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
} from "@nestjs/common";
import { SupportTicketService } from "./support-tickets.service";
import { CreateSupportTicketDto } from "./dto/create-support-ticket.dto";
import { UpdateSupportTicketDto } from "./dto/update-support-ticket.dto";
import { Roles } from "../common/decorators/role.decorator";
import { RoleGuard } from "../auth/role.guard";
import { UserCategoryGuard } from "../auth/user.guard";
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiBody,
} from "@nestjs/swagger";

@ApiTags("Support Tickets")
@ApiBearerAuth()
@UseGuards(RoleGuard, UserCategoryGuard)
@Roles("admin", "super_admin")
@Controller("support-tickets")
export class SupportTicketsController {
  constructor(private readonly supportTicketsService: SupportTicketService) {}

  @Post()
  @ApiOperation({ summary: "Create a new support ticket" })
  @ApiBody({
    type: CreateSupportTicketDto,
    examples: {
      lostItem: {
        summary: "Lost item in vehicle",
        value: {
          user_id: 102,
          user_type: "passenger",
          ride_id: 5011,
          category: "ride-related",
          status: "open",
          subject: "Lost wallet",
          description: "I left my wallet in the back seat after the ride.",
        },
      },
    },
  })
  create(@Body() dto: CreateSupportTicketDto) {
    return this.supportTicketsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: "Retrieve all support tickets" })
  findAll() {
    return this.supportTicketsService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a support ticket by ID" })
  @ApiParam({ name: "id", type: Number })
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.supportTicketsService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a support ticket by ID" })
  @ApiParam({ name: "id", type: Number })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateSupportTicketDto
  ) {
    return this.supportTicketsService.update(id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a support ticket by ID" })
  @ApiParam({ name: "id", type: Number })
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.supportTicketsService.remove(id);
  }
}
