import { ApiPropertyOptional } from '@nestjs/swagger';
import { TipoEvaluacion } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';

export class CalificacionQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  materiaId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  docenteId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  inscripcionId?: number;

  @ApiPropertyOptional({ enum: TipoEvaluacion })
  @IsOptional()
  @IsEnum(TipoEvaluacion)
  tipo?: TipoEvaluacion;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  estudianteId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  periodoAcademicoId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  cursoId?: number;

  @ApiPropertyOptional({ description: 'Fecha mínima (ISO 8601), inclusive' })
  @IsOptional()
  @IsDateString()
  fechaDesde?: string;

  @ApiPropertyOptional({ description: 'Fecha máxima (ISO 8601), inclusive' })
  @IsOptional()
  @IsDateString()
  fechaHasta?: string;
}
