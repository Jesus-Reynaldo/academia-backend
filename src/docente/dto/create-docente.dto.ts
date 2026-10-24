import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EstadoDocente } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateDocenteDto {
  @ApiProperty({ example: 'DOC-001' })
  @IsString()
  @IsNotEmpty()
  codigo!: string;

  @ApiProperty({ example: 'Ana' })
  @IsString()
  @IsNotEmpty()
  nombres!: string;

  @ApiProperty({ example: 'García' })
  @IsString()
  @IsNotEmpty()
  apellidos!: string;

  @ApiPropertyOptional({ example: 'ana.garcia@colegio.edu' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '70000000' })
  @IsOptional()
  @IsString()
  telefono?: string;

  @ApiPropertyOptional({ enum: EstadoDocente, default: EstadoDocente.ACTIVO })
  @IsOptional()
  @IsEnum(EstadoDocente)
  estado?: EstadoDocente;
}
