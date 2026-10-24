import { PartialType } from '@nestjs/swagger';
import { CreateCursoDto } from './create-curso.dto.js';

export class UpdateCursoDto extends PartialType(CreateCursoDto) {}
