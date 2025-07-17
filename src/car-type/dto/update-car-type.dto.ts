import { PartialType } from '@nestjs/swagger';
import { CreateCarTypeDto } from './create-car-type.dto';

export class UpdateCarTypeDto extends PartialType(CreateCarTypeDto) {}
