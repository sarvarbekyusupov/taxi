import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ClientSessionService } from './client-session.service';
import { CreateClientSessionDto } from './dto/create-client-session.dto';
import { UpdateClientSessionDto } from './dto/update-client-session.dto';

@Controller('client-session')
export class ClientSessionController {
  constructor(private readonly clientSessionService: ClientSessionService) {}

  @Post()
  create(@Body() createClientSessionDto: CreateClientSessionDto) {
    return this.clientSessionService.create(createClientSessionDto);
  }

  @Get()
  findAll() {
    return this.clientSessionService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.clientSessionService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateClientSessionDto: UpdateClientSessionDto) {
    return this.clientSessionService.update(+id, updateClientSessionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.clientSessionService.remove(+id);
  }
}
