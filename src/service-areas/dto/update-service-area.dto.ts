import { PartialType } from '@nestjs/swagger';
import { CreateServiceAreaDto } from './create-service-area.dto';

export class UpdateServiceAreaDto extends PartialType(CreateServiceAreaDto) {}
