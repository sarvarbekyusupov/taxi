import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpStatus,
  ParseIntPipe,
} from "@nestjs/common";
import { ClientPaymentCardService } from "./client-payment-card.service";
import { CreateClientPaymentCardDto } from "./dto/create-client-payment-card.dto";
import { UpdateClientPaymentCardDto } from "./dto/update-client-payment-card.dto";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from "@nestjs/swagger";
import { Roles } from "../common/decorators/role.decorator";
import { RoleGuard } from "../auth/role.guard";
import { UserCategoryGuard } from "../auth/user.guard";
import { ClientPaymentCard } from "./entities/client-payment-card.entity";

@ApiTags("Client Payment Cards")
@UseGuards(RoleGuard, UserCategoryGuard)
@Roles("client", "admin")
@Controller("client-payment-card")
export class ClientPaymentCardController {
  constructor(
    private readonly clientPaymentCardService: ClientPaymentCardService
  ) {}

  @Post()
  @ApiOperation({ summary: "Add a new payment card for the client" })
  @ApiBody({ type: CreateClientPaymentCardDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: "Payment card added successfully",
    type: ClientPaymentCard,
  })
  create(@Body() createDto: CreateClientPaymentCardDto) {
    return this.clientPaymentCardService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: "Get all payment cards for the client" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "List of client payment cards",
    type: [ClientPaymentCard],
  })
  findAll() {
    return this.clientPaymentCardService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get payment card by ID" })
  @ApiParam({ name: "id", type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Payment card details",
    type: ClientPaymentCard,
  })
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.clientPaymentCardService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a payment card by ID" })
  @ApiParam({ name: "id", type: Number })
  @ApiBody({ type: UpdateClientPaymentCardDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Payment card updated successfully",
  })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDto: UpdateClientPaymentCardDto
  ) {
    return this.clientPaymentCardService.update(id, updateDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a payment card by ID" })
  @ApiParam({ name: "id", type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Payment card deleted successfully",
  })
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.clientPaymentCardService.remove(id);
  }
}
