import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { DriverPaymentCardService } from './driver-payment-card.service';
import { CreateDriverPaymentCardDto } from './dto/create-driver-payment-card.dto';
import { UpdateDriverPaymentCardDto } from './dto/update-driver-payment-card.dto';

@Controller('driver-payment-card')
export class DriverPaymentCardController {
  constructor(private readonly driverPaymentCardService: DriverPaymentCardService) {}

  @Post()
  create(@Body() createDriverPaymentCardDto: CreateDriverPaymentCardDto) {
    return this.driverPaymentCardService.create(createDriverPaymentCardDto);
  }

  @Get()
  findAll() {
    return this.driverPaymentCardService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.driverPaymentCardService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDriverPaymentCardDto: UpdateDriverPaymentCardDto) {
    return this.driverPaymentCardService.update(+id, updateDriverPaymentCardDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.driverPaymentCardService.remove(+id);
  }
}
