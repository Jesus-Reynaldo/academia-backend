import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Patch,
  Post,
  Put,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { Public } from '../auth/public.decorator.js';
import { Roles } from '../auth/roles.decorator.js';
import { ConfiguracionService, MAXIMO_LOGO } from './configuracion.service.js';
import { DespertadorService } from './despertador.service.js';
import { CambiarDespertadorDto } from './dto/cambiar-despertador.dto.js';
import { UpdateConfiguracionDto } from './dto/update-configuracion.dto.js';

@ApiTags('Configuración')
@Controller('configuracion')
export class ConfiguracionController {
  constructor(
    private readonly service: ConfiguracionService,
    private readonly despertador: DespertadorService,
  ) {}

  /** Nombre, sigla y si hay logotipo. Público: el login lo muestra antes de iniciar sesión. */
  @Public()
  @Get()
  publica() {
    return this.service.publica();
  }

  /**
   * El logotipo como imagen. Público y con caché larga: la URL lleva ?v=<versión>, así un logo nuevo
   * cambia la URL y el navegador nunca muestra uno viejo.
   */
  @Public()
  @Get('logo')
  async logo(@Res() res: Response) {
    const logo = await this.service.logo();
    if (!logo) throw new NotFoundException('No hay logotipo cargado');
    res
      .status(200)
      .set({
        'Content-Type': logo.tipo,
        'Content-Length': String(logo.datos.length),
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      })
      .send(logo.datos);
  }

  @Roles('ADMIN')
  @Patch()
  actualizar(@Body() dto: UpdateConfiguracionDto) {
    return this.service.actualizar(dto);
  }

  /** Sube o reemplaza el logotipo (campo «logo»: PNG, JPG o WEBP de hasta 1 MB). */
  @Roles('ADMIN')
  @Put('logo')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { logo: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(
    FileInterceptor('logo', {
      limits: { fileSize: MAXIMO_LOGO + 1, files: 1 },
    }),
  )
  guardarLogo(@UploadedFile() archivo: { buffer: Buffer } | undefined) {
    return this.service.guardarLogo(archivo?.buffer);
  }

  @Roles('ADMIN')
  @Delete('logo')
  quitarLogo() {
    return this.service.quitarLogo();
  }

  /** Despertador: si está encendido, la URL que visita cada 10 min y la última visita. */
  @Roles('ADMIN')
  @Get('despertador')
  estadoDespertador() {
    return this.despertador.estado();
  }

  /** Enciende o apaga el Despertador (al encenderlo hace una visita de prueba al instante). */
  @Roles('ADMIN')
  @Patch('despertador')
  cambiarDespertador(@Body() dto: CambiarDespertadorDto) {
    return this.despertador.cambiar(dto.activo);
  }

  /** Hace una visita ahora mismo y devuelve el resultado. */
  @Roles('ADMIN')
  @Post('despertador/probar')
  async probarDespertador() {
    await this.despertador.visitar();
    return this.despertador.estado();
  }
}
