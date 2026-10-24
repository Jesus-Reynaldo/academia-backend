import { ApiPropertyOptional, PartialType, PickType } from '@nestjs/swagger';
import { EstadoInscripcion } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateInscripcionDto } from './create-inscripcion.dto.js';

export class UpdateInscripcionDto extends PartialType(
  PickType(CreateInscripcionDto, ['fechaInscripcion'] as const),
) {
  @ApiPropertyOptional({ enum: EstadoInscripcion })
  @IsOptional()
  @IsEnum(EstadoInscripcion)
  estado?: EstadoInscripcion;
}
