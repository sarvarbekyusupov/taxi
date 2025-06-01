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
import { PromoCodeUsageService } from "./promo-code-usage.service";
import { CreatePromoCodeUsageDto } from "./dto/create-promo-code-usage.dto";
import { UpdatePromoCodeUsageDto } from "./dto/update-promo-code-usage.dto";
import { Roles } from "src/common/decorators/role.decorator";
import { RoleGuard } from "../auth/role.guard";
import { UserCategoryGuard } from "../auth/user.guard";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";

@ApiTags("Promo Code Usage")
@ApiBearerAuth()
@Controller("promo-code-usage")
@UseGuards(RoleGuard, UserCategoryGuard)
export class PromoCodeUsageController {
  constructor(private readonly promoCodeUsageService: PromoCodeUsageService) {}

  @Post()
  @Roles("admin", "super_admin")
  @ApiOperation({ summary: "Create a promo code usage record" })
  create(@Body() createPromoCodeUsageDto: CreatePromoCodeUsageDto) {
    return this.promoCodeUsageService.create(createPromoCodeUsageDto);
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
  findOne(@Param("id") id: string) {
    return this.promoCodeUsageService.findOne(+id);
  }

  @Patch(":id")
  @Roles("admin", "super_admin")
  @ApiOperation({ summary: "Update a promo code usage record by ID" })
  update(
    @Param("id") id: string,
    @Body() updatePromoCodeUsageDto: UpdatePromoCodeUsageDto
  ) {
    return this.promoCodeUsageService.update(+id, updatePromoCodeUsageDto);
  }

  @Delete(":id")
  @Roles("admin", "super_admin")
  @ApiOperation({ summary: "Delete a promo code usage record by ID" })
  remove(@Param("id") id: string) {
    return this.promoCodeUsageService.remove(+id);
  }
}
