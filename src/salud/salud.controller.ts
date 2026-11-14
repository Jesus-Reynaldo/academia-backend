import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from '../auth/public.decorator.js';
import { PrismaService } from '../prisma/prisma.service.js';

/**
 * Estado del servicio. Público y sin límite de frecuencia: lo usan el Despertador, el login (para avisar que el
 * servidor está despertando) y monitores externos (UptimeRobot, cron-job.org). Consulta la base a propósito:
 * así cada visita mantiene activos tanto el servidor (Render) como la base de datos (Aiven).
 */
@ApiTags('Salud')
@Controller('salud')
export class SaludController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @SkipThrottle()
  @Get()
  async estado() {
    let baseDatos = false;
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      baseDatos = true;
    } catch {
      // Se informa en la respuesta; el servidor sí está despierto.
    }
    return { estado: 'ok', baseDatos, hora: new Date().toISOString() };
  }
}
