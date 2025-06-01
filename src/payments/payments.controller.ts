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
import { PaymentsService } from "./payments.service";
import { CreatePaymentDto } from "./dto/create-payment.dto";
import { UpdatePaymentDto } from "./dto/update-payment.dto";
import { Roles } from "src/common/decorators/role.decorator";
import { RoleGuard } from "../auth/role.guard";
import { UserCategoryGuard } from "../auth/user.guard";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";

@ApiTags("Payments")
@ApiBearerAuth()
@Controller("payments")
@UseGuards(RoleGuard, UserCategoryGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @Roles("admin", "super_admin")
  @ApiOperation({ summary: "Create a new payment" })
  create(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentsService.create(createPaymentDto);
  }

  @Get()
  @Roles("admin", "super_admin")
  @ApiOperation({ summary: "Get all payments" })
  findAll() {
    return this.paymentsService.findAll();
  }

  @Get(":id")
  @Roles("admin", "super_admin")
  @ApiOperation({ summary: "Get payment by ID" })
  findOne(@Param("id") id: string) {
    return this.paymentsService.findOne(+id);
  }

  @Patch(":id")
  @Roles("admin", "super_admin")
  @ApiOperation({ summary: "Update a payment by ID" })
  update(@Param("id") id: string, @Body() updatePaymentDto: UpdatePaymentDto) {
    return this.paymentsService.update(+id, updatePaymentDto);
  }

  @Delete(":id")
  @Roles("admin", "super_admin")
  @ApiOperation({ summary: "Delete a payment by ID" })
  remove(@Param("id") id: string) {
    return this.paymentsService.remove(+id);
  }
}
