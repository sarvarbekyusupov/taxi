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
import { PromoCodeService } from "./promo-code.service";
import { CreatePromoCodeDto } from "./dto/create-promo-code.dto";
import { UpdatePromoCodeDto } from "./dto/update-promo-code.dto";
import { UserCategoryGuard } from "../auth/user.guard";
import { RoleGuard } from "../auth/role.guard";
import { Roles } from "../common/decorators/role.decorator";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";

@ApiTags("Promo Code")
@ApiBearerAuth()
@Roles("admin", "super_admin")
@UseGuards(RoleGuard, UserCategoryGuard)
@Controller("promo-code")
export class PromoCodeController {
  constructor(private readonly promoCodeService: PromoCodeService) {}

  @Post()
  create(@Body() createPromoCodeDto: CreatePromoCodeDto) {
    return this.promoCodeService.create(createPromoCodeDto);
  }

  @Get()
  findAll() {
    return this.promoCodeService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.promoCodeService.findOne(+id);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() updatePromoCodeDto: UpdatePromoCodeDto
  ) {
    return this.promoCodeService.update(+id, updatePromoCodeDto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.promoCodeService.remove(+id);
  }
}
