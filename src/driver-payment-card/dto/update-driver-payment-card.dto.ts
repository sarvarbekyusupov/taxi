import { PartialType } from '@nestjs/swagger';
import { CreateDriverPaymentCardDto } from './create-driver-payment-card.dto';

export class UpdateDriverPaymentCardDto extends PartialType(CreateDriverPaymentCardDto) {}
