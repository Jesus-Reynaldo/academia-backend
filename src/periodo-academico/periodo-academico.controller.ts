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
import { PeriodoAcademicoService } from './periodo-academico.service.js';
import { CreatePeriodoAcademicoDto } from './dto/create-periodo-academico.dto.js';
import { UpdatePeriodoAcademicoDto } from './dto/update-periodo-academico.dto.js';
import { PeriodoAcademicoQueryDto } from './dto/periodo-academico-query.dto.js';

@ApiTags('Periodos Academicos')
@Controller('periodos-academicos')
export class PeriodoAcademicoController {
  constructor(private readonly service: PeriodoAcademicoService) {}

  @Post()
  create(@Body() dto: CreatePeriodoAcademicoDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query() query: PeriodoAcademicoQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePeriodoAcademicoDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
