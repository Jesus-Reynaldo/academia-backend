import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EstadoMateria } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateMateriaDto {
  @ApiProperty({ example: 'MAT-001' })
  @IsString()
  @IsNotEmpty()
  codigo!: string;

  @ApiProperty({ example: 'Matemática' })
  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @ApiPropertyOptional({ example: 'Álgebra y geometría básica' })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiPropertyOptional({ example: 5, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  horasSemanales?: number;

  @ApiPropertyOptional({ enum: EstadoMateria, default: EstadoMateria.ACTIVA })
  @IsOptional()
  @IsEnum(EstadoMateria)
  estado?: EstadoMateria;
}
