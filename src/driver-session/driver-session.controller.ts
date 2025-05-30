import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { DriverSessionService } from './driver-session.service';
import { CreateDriverSessionDto } from './dto/create-driver-session.dto';
import { UpdateDriverSessionDto } from './dto/update-driver-session.dto';

@Controller('driver-session')
export class DriverSessionController {
  constructor(private readonly driverSessionService: DriverSessionService) {}

  @Post()
  create(@Body() createDriverSessionDto: CreateDriverSessionDto) {
    return this.driverSessionService.create(createDriverSessionDto);
  }

  @Get()
  findAll() {
    return this.driverSessionService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.driverSessionService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDriverSessionDto: UpdateDriverSessionDto) {
    return this.driverSessionService.update(+id, updateDriverSessionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.driverSessionService.remove(+id);
  }
}
