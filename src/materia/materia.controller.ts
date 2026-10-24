import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { MateriaService } from './materia.service.js';
import { CreateMateriaDto } from './dto/create-materia.dto.js';
import { UpdateMateriaDto } from './dto/update-materia.dto.js';
import { MateriaQueryDto } from './dto/materia-query.dto.js';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';
import { sendRemovalResponse } from '../common/remove-response.util.js';

@ApiTags('Materias')
@Controller('materias')
export class MateriaController {
  constructor(private readonly service: MateriaService) {}

  @Post()
  create(@Body() dto: CreateMateriaDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query() query: MateriaQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Get(':id/calificaciones')
  findCalificaciones(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: PaginationQueryDto,
  ) {
    return this.service.findCalificaciones(id, query);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMateriaDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const outcome = await this.service.remove(id);
    sendRemovalResponse(res, outcome);
  }
}
