// import { Injectable } from '@nestjs/common';
// import { SaveCardDto } from './dto/save-card.dto';
// import { ChargeCardDto } from './dto/charge-card.dto';
// import { ClientPaymentCardService } from '../client-payment-card/client-payment-card.service';
// // import { CreateClientPaymentCardDto } from '../client-payment-card/dto/create-client-payment-card.dto';

// // Mock Payme API Client for demonstration purposes
// class MockPaymeApiClient {
//   async tokenizeCard(cardDetails: any): Promise<{ token: string }> {
//     console.log('Mock Payme API: Tokenizing card...', cardDetails);
//     // Simulate a call to Payme API to get a card token
//     return { token: `payme_token_${Date.now()}_${Math.random().toString(36).substring(7)}` };
//   }

//   async chargeCard(token: string, amount: number): Promise<{ success: boolean; transactionId?: string; message?: string }> {
//     console.log(`Mock Payme API: Charging ${amount} using token ${token}...`);
//     // Simulate a call to Payme API to charge the card
//     const success = Math.random() > 0.3; // 70% success rate
//     if (success) {
//       return { success: true, transactionId: `txn_${Date.now()}_${Math.random().toString(36).substring(7)}` };
//     } else {
//       return { success: false, message: 'Payment failed due to mock error.' };
//     }
//   }
// }

// @Injectable()
// export class PaymeService {
//   private paymeApiClient: MockPaymeApiClient;

//   constructor(
//     private readonly clientPaymentCardService: ClientPaymentCardService,
//   ) {
//     this.paymeApiClient = new MockPaymeApiClient();
//   }

//   async saveCard(saveCardDto: SaveCardDto): Promise<any> {
//     console.log('Received save card request:', saveCardDto);

//     // 1. Simulate client-side tokenization (this part would typically happen on the frontend)
//     // For this backend simulation, we assume saveCardDto.cardToken is already the token from Payme
//     const paymeToken = saveCardDto.cardToken;

//     // 2. Prepare data for database persistence
//     const createCardDto: CreateClientPaymentCardDto = {
//       client_id: saveCardDto.userId,
//       card_token: paymeToken,
//       last_four_digits: saveCardDto.lastFourDigits,
//       card_brand: saveCardDto.cardBrand,
//       cardholder_name: saveCardDto.cardholderName,
//       expiry_month: saveCardDto.expiryMonth,
//       expiry_year: saveCardDto.expiryYear,
//       is_default: saveCardDto.isDefault,
//       is_active: saveCardDto.isActive,
//     };

//     // 3. Save card token to the database
//     const savedCard = await this.clientPaymentCardService.create(createCardDto);
//     console.log('Card saved to DB:', savedCard);

//     return { message: 'Card saved successfully', cardId: savedCard.id, cardToken: savedCard.card_token };
//   }

//   async chargeCard(chargeCardDto: ChargeCardDto): Promise<any> {
//     console.log('Received charge card request:', chargeCardDto);

//     // 1. Simulate charging the card using the Payme API client
//     const chargeResult = await this.paymeApiClient.chargeCard(
//       chargeCardDto.cardToken,
//       chargeCardDto.amount,
//     );

//     if (chargeResult.success) {
//       console.log('Payment successful:', chargeResult);
//       return { success: true, message: 'Payment successful', transactionId: chargeResult.transactionId };
//     } else {
//       console.error('Payment failed:', chargeResult.message);
//       return { success: false, message: chargeResult.message || 'Payment failed' };
//     }
//   }
// }
