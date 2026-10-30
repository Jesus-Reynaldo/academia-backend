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
import { CursoService } from './curso.service.js';
import { CreateCursoDto } from './dto/create-curso.dto.js';
import { UpdateCursoDto } from './dto/update-curso.dto.js';
import { CursoQueryDto } from './dto/curso-query.dto.js';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';
import { sendRemovalResponse } from '../common/remove-response.util.js';
import { Roles } from '../auth/roles.decorator.js';

@ApiTags('Cursos')
@Controller('cursos')
export class CursoController {
  constructor(private readonly service: CursoService) {}

  @Roles('ADMIN')
  @Post()
  create(@Body() dto: CreateCursoDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query() query: CursoQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Roles('ADMIN', 'DOCENTE')
  @Get(':id/estudiantes')
  findEstudiantes(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: PaginationQueryDto,
  ) {
    return this.service.findEstudiantes(id, query);
  }

  @Get(':id/materias')
  findMaterias(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: PaginationQueryDto,
  ) {
    return this.service.findMaterias(id, query);
  }

  @Roles('ADMIN')
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCursoDto) {
    return this.service.update(id, dto);
  }

  @Roles('ADMIN')
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const outcome = await this.service.remove(id);
    sendRemovalResponse(res, outcome);
  }
}
