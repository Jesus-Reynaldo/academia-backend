import { ApiPropertyOptional } from '@nestjs/swagger';
import { EstadoCurso } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';

export class CursoQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: EstadoCurso })
  @IsOptional()
  @IsEnum(EstadoCurso)
  estado?: EstadoCurso;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nivel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nombre?: string;
}
