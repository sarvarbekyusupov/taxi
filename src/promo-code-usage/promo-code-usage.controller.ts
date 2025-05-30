import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PromoCodeUsageService } from './promo-code-usage.service';
import { CreatePromoCodeUsageDto } from './dto/create-promo-code-usage.dto';
import { UpdatePromoCodeUsageDto } from './dto/update-promo-code-usage.dto';

@Controller('promo-code-usage')
export class PromoCodeUsageController {
  constructor(private readonly promoCodeUsageService: PromoCodeUsageService) {}

  @Post()
  create(@Body() createPromoCodeUsageDto: CreatePromoCodeUsageDto) {
    return this.promoCodeUsageService.create(createPromoCodeUsageDto);
  }

  @Get()
  findAll() {
    return this.promoCodeUsageService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.promoCodeUsageService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePromoCodeUsageDto: UpdatePromoCodeUsageDto) {
    return this.promoCodeUsageService.update(+id, updatePromoCodeUsageDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.promoCodeUsageService.remove(+id);
  }
}
