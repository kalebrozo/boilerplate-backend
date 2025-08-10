import { PartialType } from '@nestjs/swagger';
import { CreateTesteGeralDto } from './create-teste-geral.dto';

export class UpdateTesteGeralDto extends PartialType(CreateTesteGeralDto) {}