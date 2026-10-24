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
import { DocenteService } from './docente.service.js';
import { CreateDocenteDto } from './dto/create-docente.dto.js';
import { UpdateDocenteDto } from './dto/update-docente.dto.js';
import { DocenteQueryDto } from './dto/docente-query.dto.js';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';
import { sendRemovalResponse } from '../common/remove-response.util.js';

@ApiTags('Docentes')
@Controller('docentes')
export class DocenteController {
  constructor(private readonly service: DocenteService) {}

  @Post()
  create(@Body() dto: CreateDocenteDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query() query: DocenteQueryDto) {
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
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateDocenteDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const outcome = await this.service.remove(id);
    sendRemovalResponse(res, outcome);
  }
}
