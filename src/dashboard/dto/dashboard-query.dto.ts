import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';

export class PeriodoQueryDto {
  @ApiPropertyOptional({ description: 'Por defecto, el período académico ACTIVO' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  periodoAcademicoId?: number;
}

export class DistribucionNotasQueryDto extends PeriodoQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  materiaId?: number;
}

export class EstudiantesEnRiesgoQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Por defecto, el período académico ACTIVO' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  periodoAcademicoId?: number;

  @ApiPropertyOptional({
    minimum: 0,
    maximum: 100,
    description: 'Promedio por debajo del cual se considera en riesgo. Por defecto NOTA_APROBACION',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  umbral?: number;
}
