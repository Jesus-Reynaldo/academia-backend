import { ApiPropertyOptional } from '@nestjs/swagger';
import { EstadoDocente } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';

export class DocenteQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: EstadoDocente })
  @IsOptional()
  @IsEnum(EstadoDocente)
  estado?: EstadoDocente;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nombre?: string;
}
