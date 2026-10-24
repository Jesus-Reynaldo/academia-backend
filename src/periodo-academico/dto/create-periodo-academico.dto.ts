import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EstadoPeriodo } from '@prisma/client';
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePeriodoAcademicoDto {
  @ApiProperty({ example: 'Gestión 2026' })
  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @ApiProperty({ example: '2026-02-01' })
  @IsDateString()
  fechaInicio!: string;

  @ApiProperty({ example: '2026-11-30' })
  @IsDateString()
  fechaFin!: string;

  @ApiPropertyOptional({ enum: EstadoPeriodo, default: EstadoPeriodo.PLANIFICADO })
  @IsOptional()
  @IsEnum(EstadoPeriodo)
  estado?: EstadoPeriodo;
}
