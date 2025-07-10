import { PartialType } from '@nestjs/swagger';
import { CreatePaymeDto } from './create-payme.dto';

export class UpdatePaymeDto extends PartialType(CreatePaymeDto) {}
