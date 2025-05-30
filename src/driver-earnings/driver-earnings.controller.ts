import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { DriverEarningService } from './driver-earnings.service';
import { CreateDriverEarningDto } from './dto/create-driver-earning.dto';
import { UpdateDriverEarningDto } from './dto/update-driver-earning.dto';

@Controller('driver-earnings')
export class DriverEarningsController {
  constructor(private readonly driverEarningsService: DriverEarningService) {}

  @Post()
  create(@Body() createDriverEarningDto: CreateDriverEarningDto) {
    return this.driverEarningsService.create(createDriverEarningDto);
  }

  @Get()
  findAll() {
    return this.driverEarningsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.driverEarningsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDriverEarningDto: UpdateDriverEarningDto) {
    return this.driverEarningsService.update(+id, updateDriverEarningDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.driverEarningsService.remove(+id);
  }
}
