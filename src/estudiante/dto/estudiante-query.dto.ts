import { ApiPropertyOptional } from '@nestjs/swagger';
import { EstadoEstudiante } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';

export class EstudianteQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: EstadoEstudiante })
  @IsOptional()
  @IsEnum(EstadoEstudiante)
  estado?: EstadoEstudiante;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nombre?: string;
}
