import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ServiceAreaService } from './service-areas.service';
import { CreateServiceAreaDto } from './dto/create-service-area.dto';
import { UpdateServiceAreaDto } from './dto/update-service-area.dto';

@Controller('service-areas')
export class ServiceAreasController {
  constructor(private readonly serviceAreasService: ServiceAreaService) {}

  @Post()
  create(@Body() createServiceAreaDto: CreateServiceAreaDto) {
    return this.serviceAreasService.create(createServiceAreaDto);
  }

  @Get()
  findAll() {
    return this.serviceAreasService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.serviceAreasService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateServiceAreaDto: UpdateServiceAreaDto) {
    return this.serviceAreasService.update(+id, updateServiceAreaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.serviceAreasService.remove(+id);
  }
}
