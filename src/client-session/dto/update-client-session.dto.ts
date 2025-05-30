import { PartialType } from '@nestjs/swagger';
import { CreateClientSessionDto } from './create-client-session.dto';

export class UpdateClientSessionDto extends PartialType(CreateClientSessionDto) {}
