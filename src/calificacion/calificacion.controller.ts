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

@ApiTags('Calificaciones')
@Controller('calificaciones')
export class CalificacionController {
  constructor(private readonly service: CalificacionService) {}

  @Post()
  create(@Body() dto: CreateCalificacionDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query() query: CalificacionQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCalificacionDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
