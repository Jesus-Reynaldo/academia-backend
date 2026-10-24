import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EstadoEstudiante } from '@prisma/client';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateEstudianteDto {
  @ApiProperty({ example: 'EST-0001' })
  @IsString()
  @IsNotEmpty()
  codigo!: string;

  @ApiProperty({ example: 'Juan' })
  @IsString()
  @IsNotEmpty()
  nombres!: string;

  @ApiProperty({ example: 'Pérez' })
  @IsString()
  @IsNotEmpty()
  apellidos!: string;

  @ApiProperty({ example: '12345678' })
  @IsString()
  @IsNotEmpty()
  documento!: string;

  @ApiPropertyOptional({ example: 'juan.perez@colegio.edu' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '70000000' })
  @IsOptional()
  @IsString()
  telefono?: string;

  @ApiPropertyOptional({ example: '2010-05-14' })
  @IsOptional()
  @IsDateString()
  fechaNacimiento?: string;

  @ApiPropertyOptional({ enum: EstadoEstudiante, default: EstadoEstudiante.ACTIVO })
  @IsOptional()
  @IsEnum(EstadoEstudiante)
  estado?: EstadoEstudiante;
}
