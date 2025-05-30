import { PartialType } from '@nestjs/swagger';
import { CreateClientPaymentCardDto } from './create-client-payment-card.dto';

export class UpdateClientPaymentCardDto extends PartialType(CreateClientPaymentCardDto) {}
