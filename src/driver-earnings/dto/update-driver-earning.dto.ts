import { PartialType } from '@nestjs/swagger';
import { CreateDriverEarningDto } from './create-driver-earning.dto';

export class UpdateDriverEarningDto extends PartialType(CreateDriverEarningDto) {}
