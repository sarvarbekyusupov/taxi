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
import { ClientPaymentCardService } from "./client-payment-card.service";
import { CreateClientPaymentCardDto } from "./dto/create-client-payment-card.dto";
import { UpdateClientPaymentCardDto } from "./dto/update-client-payment-card.dto";
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
} from "@nestjs/swagger";
import { Roles } from "../common/decorators/role.decorator";
import { RoleGuard } from "../auth/role.guard";
import { UserCategoryGuard } from "../auth/user.guard";

@ApiTags("Client Payment Cards")
@ApiBearerAuth()
@UseGuards(RoleGuard, UserCategoryGuard)
@Roles("client", "admin") 
@Controller("client-payment-card")
export class ClientPaymentCardController {
  constructor(
    private readonly clientPaymentCardService: ClientPaymentCardService
  ) {}

  @Post()
  @ApiOperation({ summary: "Add a new payment card for the client" })
  @ApiResponse({ status: 201, description: "Payment card added successfully" })
  create(@Body() createClientPaymentCardDto: CreateClientPaymentCardDto) {
    return this.clientPaymentCardService.create(createClientPaymentCardDto);
  }

  @Get()
  @ApiOperation({ summary: "Get all payment cards for the client" })
  @ApiResponse({ status: 200, description: "List of client payment cards" })
  findAll() {
    return this.clientPaymentCardService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get payment card by ID" })
  @ApiResponse({ status: 200, description: "Payment card details" })
  findOne(@Param("id") id: string) {
    return this.clientPaymentCardService.findOne(+id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a payment card by ID" })
  @ApiResponse({
    status: 200,
    description: "Payment card updated successfully",
  })
  update(
    @Param("id") id: string,
    @Body() updateClientPaymentCardDto: UpdateClientPaymentCardDto
  ) {
    return this.clientPaymentCardService.update(
      +id,
      updateClientPaymentCardDto
    );
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a payment card by ID" })
  @ApiResponse({
    status: 200,
    description: "Payment card deleted successfully",
  })
  remove(@Param("id") id: string) {
    return this.clientPaymentCardService.remove(+id);
  }
}
