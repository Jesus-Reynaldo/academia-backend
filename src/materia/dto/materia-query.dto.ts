import { ApiPropertyOptional } from '@nestjs/swagger';
import { EstadoMateria } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';

export class MateriaQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: EstadoMateria })
  @IsOptional()
  @IsEnum(EstadoMateria)
  estado?: EstadoMateria;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nombre?: string;
}
