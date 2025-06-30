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
import { PromoCodeService } from "./promo-code.service";
import { CreatePromoCodeDto } from "./dto/create-promo-code.dto";
import { UpdatePromoCodeDto } from "./dto/update-promo-code.dto";
import { UserCategoryGuard } from "../auth/user.guard";
import { RoleGuard } from "../auth/role.guard";
import { Roles } from "../common/decorators/role.decorator";
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiBody,
} from "@nestjs/swagger";

@ApiTags("Promo Codes")
@ApiBearerAuth()
@Roles("admin", "super_admin")
@UseGuards(RoleGuard, UserCategoryGuard)
@Controller("promo-code")
export class PromoCodeController {
  constructor(private readonly promoCodeService: PromoCodeService) {}

  @Post()
  @ApiOperation({ summary: "Create a new promo code" })
  @ApiBody({ type: CreatePromoCodeDto })
  @ApiResponse({ status: 201, description: "Promo code created successfully" })
  create(@Body() dto: CreatePromoCodeDto) {
    return this.promoCodeService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: "Get all promo codes" })
  findAll() {
    return this.promoCodeService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get promo code by ID" })
  @ApiParam({ name: "id", type: Number })
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.promoCodeService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update promo code by ID" })
  @ApiParam({ name: "id", type: Number })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdatePromoCodeDto
  ) {
    return this.promoCodeService.update(id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete promo code by ID" })
  @ApiParam({ name: "id", type: Number })
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.promoCodeService.remove(id);
  }
}
