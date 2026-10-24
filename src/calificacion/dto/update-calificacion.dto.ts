import { PartialType, PickType } from '@nestjs/swagger';
import { CreateCalificacionDto } from './create-calificacion.dto.js';

export class UpdateCalificacionDto extends PartialType(
  PickType(CreateCalificacionDto, ['nota', 'tipo', 'fecha', 'observacion', 'docenteId'] as const),
) {}
