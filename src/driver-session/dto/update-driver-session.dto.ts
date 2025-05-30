import { PartialType } from '@nestjs/swagger';
import { CreateDriverSessionDto } from './create-driver-session.dto';

export class UpdateDriverSessionDto extends PartialType(CreateDriverSessionDto) {}
