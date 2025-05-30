import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { DriverPayoutService } from './driver-payouts.service';
import { CreateDriverPayoutDto } from './dto/create-driver-payout.dto';
import { UpdateDriverPayoutDto } from './dto/update-driver-payout.dto';

@Controller('driver-payouts')
export class DriverPayoutsController {
  constructor(private readonly driverPayoutsService: DriverPayoutService) {}

  @Post()
  create(@Body() createDriverPayoutDto: CreateDriverPayoutDto) {
    return this.driverPayoutsService.create(createDriverPayoutDto);
  }

  @Get()
  findAll() {
    return this.driverPayoutsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.driverPayoutsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDriverPayoutDto: UpdateDriverPayoutDto) {
    return this.driverPayoutsService.update(+id, updateDriverPayoutDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.driverPayoutsService.remove(+id);
  }
}
