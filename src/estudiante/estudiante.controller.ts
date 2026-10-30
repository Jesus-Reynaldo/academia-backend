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
import { Roles } from '../auth/roles.decorator.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthUser } from '../auth/auth.types.js';
import { assertEstudianteAccess } from '../auth/access.util.js';

@ApiTags('Estudiantes')
@Controller('estudiantes')
export class EstudianteController {
  constructor(private readonly service: EstudianteService) {}

  @Roles('ADMIN')
  @Post()
  create(@Body() dto: CreateEstudianteDto) {
    return this.service.create(dto);
  }

  @Roles('ADMIN', 'DOCENTE')
  @Get()
  findAll(@Query() query: EstudianteQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    assertEstudianteAccess(user, id);
    return this.service.findOne(id);
  }

  @Get(':id/inscripciones')
  findInscripciones(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: PaginationQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    assertEstudianteAccess(user, id);
    return this.service.findInscripciones(id, query);
  }

  @Get(':id/calificaciones')
  findCalificaciones(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: PaginationQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    assertEstudianteAccess(user, id);
    return this.service.findCalificaciones(id, query);
  }

  @Get(':id/historial-academico')
  getHistorialAcademico(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    assertEstudianteAccess(user, id);
    return this.service.getHistorialAcademico(id);
  }

  @Roles('ADMIN')
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEstudianteDto,
  ) {
    return this.service.update(id, dto);
  }

  @Roles('ADMIN')
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const outcome = await this.service.remove(id);
    sendRemovalResponse(res, outcome);
  }
}
