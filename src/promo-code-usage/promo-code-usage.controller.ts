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
import { PromoCodeUsageService } from "./promo-code-usage.service";
import { CreatePromoCodeUsageDto } from "./dto/create-promo-code-usage.dto";
import { UpdatePromoCodeUsageDto } from "./dto/update-promo-code-usage.dto";
import { Roles } from "src/common/decorators/role.decorator";
import { RoleGuard } from "../auth/role.guard";
import { UserCategoryGuard } from "../auth/user.guard";
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiBody,
} from "@nestjs/swagger";

@ApiTags("Promo Code Usage")
@ApiBearerAuth()
@UseGuards(RoleGuard, UserCategoryGuard)
@Controller("promo-code-usage")
export class PromoCodeUsageController {
  constructor(private readonly promoCodeUsageService: PromoCodeUsageService) {}

  @Post()
  @Roles("admin", "super_admin")
  @ApiOperation({ summary: "Create a promo code usage record" })
  @ApiBody({ type: CreatePromoCodeUsageDto })
  create(@Body() createDto: CreatePromoCodeUsageDto) {
    return this.promoCodeUsageService.create(createDto);
  }

  @Get()
  @Roles("admin", "super_admin")
  @ApiOperation({ summary: "Get all promo code usage records" })
  findAll() {
    return this.promoCodeUsageService.findAll();
  }

  @Get(":id")
  @Roles("admin", "super_admin")
  @ApiOperation({ summary: "Get a promo code usage record by ID" })
  @ApiParam({ name: "id", type: Number, required: true })
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.promoCodeUsageService.findOne(id);
  }

  @Patch(":id")
  @Roles("admin", "super_admin")
  @ApiOperation({ summary: "Update a promo code usage record by ID" })
  @ApiParam({ name: "id", type: Number, required: true })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDto: UpdatePromoCodeUsageDto
  ) {
    return this.promoCodeUsageService.update(id, updateDto);
  }

  @Delete(":id")
  @Roles("admin", "super_admin")
  @ApiOperation({ summary: "Delete a promo code usage record by ID" })
  @ApiParam({ name: "id", type: Number, required: true })
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.promoCodeUsageService.remove(id);
  }
}
