import { PartialType } from '@nestjs/swagger';
import { CreateDocenteDto } from './create-docente.dto.js';

export class UpdateDocenteDto extends PartialType(CreateDocenteDto) {}
