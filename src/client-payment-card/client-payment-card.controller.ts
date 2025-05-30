import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ClientPaymentCardService } from './client-payment-card.service';
import { CreateClientPaymentCardDto } from './dto/create-client-payment-card.dto';
import { UpdateClientPaymentCardDto } from './dto/update-client-payment-card.dto';

@Controller('client-payment-card')
export class ClientPaymentCardController {
  constructor(private readonly clientPaymentCardService: ClientPaymentCardService) {}

  @Post()
  create(@Body() createClientPaymentCardDto: CreateClientPaymentCardDto) {
    return this.clientPaymentCardService.create(createClientPaymentCardDto);
  }

  @Get()
  findAll() {
    return this.clientPaymentCardService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.clientPaymentCardService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateClientPaymentCardDto: UpdateClientPaymentCardDto) {
    return this.clientPaymentCardService.update(+id, updateClientPaymentCardDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.clientPaymentCardService.remove(+id);
  }
}
