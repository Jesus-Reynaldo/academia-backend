import { PartialType } from '@nestjs/swagger';
import { CreateMateriaDto } from './create-materia.dto.js';

export class UpdateMateriaDto extends PartialType(CreateMateriaDto) {}
