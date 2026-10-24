import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EstadoCurso } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateCursoDto {
  @ApiProperty({ example: '1ro Secundaria A' })
  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @ApiProperty({ example: 'Secundaria' })
  @IsString()
  @IsNotEmpty()
  nivel!: string;

  @ApiPropertyOptional({ example: 'A' })
  @IsOptional()
  @IsString()
  paralelo?: string;

  @ApiPropertyOptional({ example: 30, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  capacidad?: number;

  @ApiPropertyOptional({ enum: EstadoCurso, default: EstadoCurso.ACTIVO })
  @IsOptional()
  @IsEnum(EstadoCurso)
  estado?: EstadoCurso;
}
