import { PartialType } from '@nestjs/swagger';
import { CreatePromoCodeUsageDto } from './create-promo-code-usage.dto';

export class UpdatePromoCodeUsageDto extends PartialType(CreatePromoCodeUsageDto) {}
