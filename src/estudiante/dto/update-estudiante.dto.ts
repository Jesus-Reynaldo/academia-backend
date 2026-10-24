import { PartialType } from '@nestjs/swagger';
import { CreateEstudianteDto } from './create-estudiante.dto.js';

export class UpdateEstudianteDto extends PartialType(CreateEstudianteDto) {}
