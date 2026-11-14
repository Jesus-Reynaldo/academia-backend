import { BadRequestException, Controller, Get, Post, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { Roles } from '../auth/roles.decorator.js';
import { RespaldoService } from './respaldo.service.js';
import { nombreArchivo } from './respaldo.util.js';

/** Tamaño máximo del archivo a restaurar (un respaldo comprimido real pesa ~1 MB). */
const MAXIMO = 50 * 1024 * 1024;

@ApiTags('Respaldo')
@Roles('ADMIN')
@Controller('respaldo')
export class RespaldoController {
  constructor(private readonly service: RespaldoService) {}

  /** Cuántos registros tiene cada tabla. */
  @Get('resumen')
  resumen() {
    return this.service.resumen();
  }

  /** Descarga toda la información como archivo .json.gz. */
  @Get()
  async descargar(@Res() res: Response) {
    const archivo = await this.service.generar();
    res
      .status(200)
      .set({
        'Content-Type': 'application/gzip',
        'Content-Disposition': `attachment; filename="${nombreArchivo()}"`,
        'Content-Length': String(archivo.length),
        'Cache-Control': 'no-store',
      })
      .send(archivo);
  }

  /** Reemplaza toda la información por la del archivo subido (campo «archivo»). */
  @Post('restaurar')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { archivo: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(FileInterceptor('archivo', { limits: { fileSize: MAXIMO, files: 1 } }))
  restaurar(@UploadedFile() archivo: { buffer: Buffer } | undefined) {
    if (!archivo?.buffer?.length) throw new BadRequestException('Elige un archivo de respaldo.');
    return this.service.restaurar(archivo.buffer);
  }
}
