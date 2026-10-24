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
import { EstudianteService } from './estudiante.service.js';
import { CreateEstudianteDto } from './dto/create-estudiante.dto.js';
import { UpdateEstudianteDto } from './dto/update-estudiante.dto.js';
import { EstudianteQueryDto } from './dto/estudiante-query.dto.js';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';
import { sendRemovalResponse } from '../common/remove-response.util.js';

@ApiTags('Estudiantes')
@Controller('estudiantes')
export class EstudianteController {
  constructor(private readonly service: EstudianteService) {}

  @Post()
  create(@Body() dto: CreateEstudianteDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query() query: EstudianteQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Get(':id/inscripciones')
  findInscripciones(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: PaginationQueryDto,
  ) {
    return this.service.findInscripciones(id, query);
  }

  @Get(':id/calificaciones')
  findCalificaciones(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: PaginationQueryDto,
  ) {
    return this.service.findCalificaciones(id, query);
  }

  @Get(':id/historial-academico')
  getHistorialAcademico(@Param('id', ParseIntPipe) id: number) {
    return this.service.getHistorialAcademico(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEstudianteDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const outcome = await this.service.remove(id);
    sendRemovalResponse(res, outcome);
  }
}
