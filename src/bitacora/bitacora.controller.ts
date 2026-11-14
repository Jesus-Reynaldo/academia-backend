import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/roles.decorator.js';
import { BitacoraService } from './bitacora.service.js';
import { BitacoraQueryDto } from './dto/bitacora-query.dto.js';

@ApiTags('Bitácora')
@Controller('bitacora')
export class BitacoraController {
  constructor(private readonly service: BitacoraService) {}

  /** Quién creó, modificó, desactivó o eliminó qué y cuándo. Solo ADMIN. Más reciente primero. */
  @Roles('ADMIN')
  @Get()
  findAll(@Query() query: BitacoraQueryDto) {
    return this.service.findAll(query);
  }
}
