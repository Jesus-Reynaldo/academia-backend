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
import { InscripcionService } from './inscripcion.service.js';
import { CreateInscripcionDto } from './dto/create-inscripcion.dto.js';
import { UpdateInscripcionDto } from './dto/update-inscripcion.dto.js';
import { InscripcionQueryDto } from './dto/inscripcion-query.dto.js';
import { Roles } from '../auth/roles.decorator.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthUser } from '../auth/auth.types.js';
import { assertEstudianteAccess } from '../auth/access.util.js';

@ApiTags('Inscripciones')
@Controller('inscripciones')
export class InscripcionController {
  constructor(private readonly service: InscripcionService) {}

  @Roles('ADMIN')
  @Post()
  create(@Body() dto: CreateInscripcionDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query() query: InscripcionQueryDto, @CurrentUser() user: AuthUser) {
    if (user.rol === 'ESTUDIANTE') {
      // Students only ever see their own enrollments, whatever filter they send.
      query.estudianteId = user.estudianteId ?? -1;
    }
    return this.service.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    const inscripcion = await this.service.findOne(id);
    assertEstudianteAccess(user, inscripcion.estudianteId);
    return inscripcion;
  }

  @Roles('ADMIN')
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateInscripcionDto,
  ) {
    return this.service.update(id, dto);
  }

  @Roles('ADMIN')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
