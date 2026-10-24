import { ApiPropertyOptional } from '@nestjs/swagger';
import { EstadoPeriodo } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';

export class PeriodoAcademicoQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: EstadoPeriodo })
  @IsOptional()
  @IsEnum(EstadoPeriodo)
  estado?: EstadoPeriodo;
}
