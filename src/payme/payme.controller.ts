// import { Controller, Post, Body } from '@nestjs/common';
// import { PaymeService } from './payme.service';
// import { SaveCardDto } from './dto/save-card.dto';
// import { ChargeCardDto } from './dto/charge-card.dto';
// import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

// @ApiTags('Payme')
// @Controller('payme')
// export class PaymeController {
//   constructor(private readonly paymeService: PaymeService) {}

//   @Post('save-card')
//   @ApiOperation({ summary: 'Save a new card with Payme tokenization' })
//   @ApiResponse({ status: 201, description: 'Card saved successfully.' })
//   @ApiResponse({ status: 400, description: 'Bad Request.' })
//   @ApiBody({ type: SaveCardDto })
//   async saveCard(@Body() saveCardDto: SaveCardDto) {
//     return this.paymeService.saveCard(saveCardDto);
//   }

//   @Post('charge-card')
//   @ApiOperation({ summary: 'Charge a saved card using its token' })
//   @ApiResponse({ status: 201, description: 'Card charged successfully.' })
//   @ApiResponse({ status: 400, description: 'Bad Request.' })
//   @ApiBody({ type: ChargeCardDto })
//   async chargeCard(@Body() chargeCardDto: ChargeCardDto) {
//     return this.paymeService.chargeCard(chargeCardDto);
//   }
// }
