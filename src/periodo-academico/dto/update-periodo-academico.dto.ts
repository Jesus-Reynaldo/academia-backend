import { PartialType } from '@nestjs/swagger';
import { CreatePeriodoAcademicoDto } from './create-periodo-academico.dto.js';

export class UpdatePeriodoAcademicoDto extends PartialType(
  CreatePeriodoAcademicoDto,
) {}
