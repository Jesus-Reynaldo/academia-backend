import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { UpdateConfiguracionDto } from './dto/update-configuracion.dto.js';

/** Formatos permitidos. SVG queda fuera: puede llevar código. */
export const TIPOS_LOGO = ['image/png', 'image/jpeg', 'image/webp'] as const;
export const MAXIMO_LOGO = 1024 * 1024;

/** Firmas binarias de cada formato: no se confía en el tipo que declara el navegador. */
function tipoReal(buffer: Buffer): (typeof TIPOS_LOGO)[number] | null {
  if (
    buffer
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  )
    return 'image/png';
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff)
    return 'image/jpeg';
  if (
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  )
    return 'image/webp';
  return null;
}

const ID = 1;
const NOMBRE_POR_DEFECTO = 'Sistema Académico';

@Injectable()
export class ConfiguracionService {
  constructor(private readonly prisma: PrismaService) {}

  /** La fila única; si faltara (base sin la migración de datos), se crea con el nombre por defecto. */
  private obtener() {
    return this.prisma.configuracion.upsert({
      where: { id: ID },
      update: {},
      create: { id: ID, nombreInstitucion: NOMBRE_POR_DEFECTO },
    });
  }

  /** Lo que ve cualquiera (también el login): sin el logo en sí, solo si existe y su versión para la caché. */
  async publica() {
    const c = await this.obtener();
    return {
      nombreInstitucion: c.nombreInstitucion,
      sigla: c.sigla,
      tieneLogo: c.logo !== null,
      version: c.updatedAt.getTime(),
      updatedAt: c.updatedAt,
    };
  }

  async logo() {
    const c = await this.obtener();
    return c.logo && c.logoTipo
      ? {
          datos: Buffer.from(c.logo),
          tipo: c.logoTipo,
          version: c.updatedAt.getTime(),
        }
      : null;
  }

  async actualizar(dto: UpdateConfiguracionDto) {
    await this.obtener();
    await this.prisma.configuracion.update({
      where: { id: ID },
      data: {
        nombreInstitucion: dto.nombreInstitucion,
        sigla: dto.sigla === undefined ? undefined : dto.sigla || null,
      },
    });
    return this.publica();
  }

  async guardarLogo(buffer: Buffer | undefined) {
    if (!buffer?.length)
      throw new BadRequestException('Elige una imagen para el logotipo.');
    if (buffer.length > MAXIMO_LOGO)
      throw new BadRequestException('El logotipo no puede pesar más de 1 MB.');
    const tipo = tipoReal(buffer);
    if (!tipo)
      throw new BadRequestException(
        'El logotipo debe ser una imagen PNG, JPG o WEBP.',
      );
    await this.obtener();
    await this.prisma.configuracion.update({
      where: { id: ID },
      data: { logo: new Uint8Array(buffer), logoTipo: tipo },
    });
    return this.publica();
  }

  async quitarLogo() {
    await this.obtener();
    await this.prisma.configuracion.update({
      where: { id: ID },
      data: { logo: null, logoTipo: null },
    });
    return this.publica();
  }
}
