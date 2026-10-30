import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CalificacionService } from './calificacion.service.js';
import { CreateCalificacionDto } from './dto/create-calificacion.dto.js';
import { UpdateCalificacionDto } from './dto/update-calificacion.dto.js';
import { CalificacionQueryDto } from './dto/calificacion-query.dto.js';
import { ForbiddenException } from '@nestjs/common';
import { Roles } from '../auth/roles.decorator.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthUser } from '../auth/auth.types.js';

const NOT_YOURS = 'Solo puede acceder a sus propias calificaciones';

@ApiTags('Calificaciones')
@Controller('calificaciones')
export class CalificacionController {
  constructor(private readonly service: CalificacionService) {}

  @Roles('ADMIN', 'DOCENTE')
  @Post()
  create(@Body() dto: CreateCalificacionDto, @CurrentUser() user: AuthUser) {
    if (user.rol === 'DOCENTE') {
      this.assertOwnDocente(user, dto.docenteId);
      dto.docenteId = user.docenteId ?? undefined;
    }
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query() query: CalificacionQueryDto, @CurrentUser() user: AuthUser) {
    // Whatever filter the client sends, each role only lists what it may see.
    if (user.rol === 'ESTUDIANTE') {
      query.estudianteId = user.estudianteId ?? -1;
    } else if (user.rol === 'DOCENTE') {
      query.docenteId = user.docenteId ?? -1;
    }
    return this.service.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    const calificacion = await this.service.findOne(id);
    if (
      (user.rol === 'ESTUDIANTE' &&
        calificacion.inscripcion.estudianteId !== user.estudianteId) ||
      (user.rol === 'DOCENTE' && calificacion.docenteId !== user.docenteId)
    ) {
      throw new ForbiddenException(NOT_YOURS);
    }
    return calificacion;
  }

  @Roles('ADMIN', 'DOCENTE')
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCalificacionDto,
    @CurrentUser() user: AuthUser,
  ) {
    if (user.rol === 'DOCENTE') {
      const calificacion = await this.service.findOne(id);
      if (calificacion.docenteId !== user.docenteId) {
        throw new ForbiddenException(NOT_YOURS);
      }
      this.assertOwnDocente(user, dto.docenteId);
    }
    return this.service.update(id, dto);
  }

  @Roles('ADMIN')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }

  private assertOwnDocente(user: AuthUser, docenteId: number | undefined) {
    if (docenteId != null && docenteId !== user.docenteId) {
      throw new ForbiddenException('No puede registrar calificaciones a nombre de otro docente');
    }
  }
}
