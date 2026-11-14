import {
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

/** Render (plan gratis) duerme el servicio tras ~15 min sin visitas: cada 10 min llega antes. */
export const INTERVALO_MS = 10 * 60 * 1000;

export interface ResultadoPing {
  fecha: string;
  ok: boolean;
  detalle: string;
}

/**
 * URL pública a la que se visita el propio servidor. Render define RENDER_EXTERNAL_URL en los servicios web;
 * si no estuviera, se puede poner URL_PUBLICA a mano en Render → Environment. Sin ninguna (en la PC),
 * se usa localhost: sirve para probar, pero no evita que Render se duerma.
 */
export function urlPublica(env: NodeJS.ProcessEnv = process.env): {
  url: string;
  publica: boolean;
} {
  const base = env.RENDER_EXTERNAL_URL || env.URL_PUBLICA;
  if (base) return { url: base.replace(/\/+$/, ''), publica: true };
  return { url: `http://localhost:${env.PORT ?? 3000}`, publica: false };
}

/**
 * Despertador: si está encendido en Configuración, cada 10 minutos hace una petición HTTP REAL a su propia URL
 * pública (/api/v1/salud, que consulta la base). Solo el tráfico que entra por la URL pública cuenta para Render.
 * No puede despertar un servidor ya dormido: para eso, la primera visita (o un monitor externo).
 */
@Injectable()
export class DespertadorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DespertadorService.name);
  private temporizador: NodeJS.Timeout | undefined;
  private ultimo: ResultadoPing | null = null;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    // En las pruebas automáticas no hace falta; unref: no impide que el proceso termine.
    if (process.env.NODE_ENV === 'test') return;
    this.temporizador = setInterval(() => void this.tic(), INTERVALO_MS);
    this.temporizador.unref();
  }

  onModuleDestroy() {
    clearInterval(this.temporizador);
  }

  private async activo(): Promise<boolean> {
    const c = await this.prisma.configuracion.findUnique({
      where: { id: 1 },
      select: { despertadorActivo: true },
    });
    return c?.despertadorActivo ?? false;
  }

  private async tic() {
    try {
      if (await this.activo()) await this.visitar();
    } catch (error) {
      this.logger.warn(
        `Despertador: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /** Una visita real a /api/v1/salud. Devuelve y recuerda el resultado (para mostrarlo en la pantalla). */
  async visitar(): Promise<ResultadoPing> {
    const { url } = urlPublica();
    const inicio = Date.now();
    let resultado: ResultadoPing;
    try {
      const r = await fetch(`${url}/api/v1/salud`, {
        signal: AbortSignal.timeout(30_000),
      });
      const cuerpo = (await r.json().catch(() => null)) as {
        baseDatos?: boolean;
      } | null;
      const ms = Date.now() - inicio;
      resultado = r.ok
        ? {
            fecha: new Date().toISOString(),
            ok: cuerpo?.baseDatos !== false,
            detalle:
              cuerpo?.baseDatos === false
                ? `Servidor OK pero la base no respondió (${ms} ms)`
                : `OK en ${ms} ms`,
          }
        : {
            fecha: new Date().toISOString(),
            ok: false,
            detalle: `Respondió ${r.status}`,
          };
    } catch (error) {
      resultado = {
        fecha: new Date().toISOString(),
        ok: false,
        detalle: error instanceof Error ? error.message : String(error),
      };
    }
    this.ultimo = resultado;
    this.logger.log(
      `Despertador: ${resultado.ok ? 'visita OK' : 'falló'} (${resultado.detalle})`,
    );
    return resultado;
  }

  async estado() {
    const { url, publica } = urlPublica();
    return {
      activo: await this.activo(),
      url: `${url}/api/v1/salud`,
      urlPublica: publica,
      intervaloMinutos: INTERVALO_MS / 60_000,
      ultimo: this.ultimo,
    };
  }

  async cambiar(activo: boolean) {
    await this.prisma.configuracion.upsert({
      where: { id: 1 },
      update: { despertadorActivo: activo },
      create: {
        id: 1,
        nombreInstitucion: 'Sistema Académico',
        despertadorActivo: activo,
      },
    });
    // Al encenderlo se visita al instante: el administrador ve enseguida si funciona.
    if (activo) await this.visitar();
    return this.estado();
  }
}
