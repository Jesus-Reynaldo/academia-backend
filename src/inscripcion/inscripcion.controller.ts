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

@ApiTags('Inscripciones')
@Controller('inscripciones')
export class InscripcionController {
  constructor(private readonly service: InscripcionService) {}

  @Post()
  create(@Body() dto: CreateInscripcionDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query() query: InscripcionQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateInscripcionDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
