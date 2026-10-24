import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TipoEvaluacion } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export const NOTA_MIN = 0;
export const NOTA_MAX = 100;

export class CreateCalificacionDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  inscripcionId!: number;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  materiaId!: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  docenteId?: number;

  @ApiProperty({ example: 85, minimum: NOTA_MIN, maximum: NOTA_MAX })
  @Type(() => Number)
  @IsNumber()
  @Min(NOTA_MIN)
  @Max(NOTA_MAX)
  nota!: number;

  @ApiProperty({ enum: TipoEvaluacion })
  @IsEnum(TipoEvaluacion)
  tipo!: TipoEvaluacion;

  @ApiPropertyOptional({ example: '2026-06-15' })
  @IsOptional()
  @IsDateString()
  fecha?: string;

  @ApiPropertyOptional({ example: 'Entregado con retraso' })
  @IsOptional()
  @IsString()
  observacion?: string;
}
