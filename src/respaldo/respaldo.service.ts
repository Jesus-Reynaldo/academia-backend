import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { desempaquetar, empaquetar, RespaldoInvalidoError, TABLAS, type Tabla } from './respaldo.util.js';

/** Filas por inserción al restaurar: lotes chicos para no armar sentencias gigantes. */
const LOTE = 1000;

type Delegado = {
  findMany(args?: object): Promise<Record<string, unknown>[]>;
  count(): Promise<number>;
  deleteMany(): Promise<unknown>;
  createMany(args: { data: Record<string, unknown>[] }): Promise<unknown>;
};

@Injectable()
export class RespaldoService {
  private readonly logger = new Logger(RespaldoService.name);

  constructor(private readonly prisma: PrismaService) {}

  private delegado(cliente: Prisma.TransactionClient | PrismaService, tabla: Tabla): Delegado {
    return cliente[tabla] as unknown as Delegado;
  }

  /** Cuántas filas tiene cada tabla (para mostrar qué incluye el respaldo, sin descargarlo). */
  async resumen() {
    const conteos = await Promise.all(TABLAS.map((t) => this.delegado(this.prisma, t).count()));
    return Object.fromEntries(TABLAS.map((t, i) => [t, conteos[i]])) as Record<Tabla, number>;
  }

  /** Toda la información en un archivo comprimido. Incluye los hash de contraseñas para que las cuentas sigan funcionando. */
  async generar(): Promise<Buffer> {
    const filas = await Promise.all(TABLAS.map((t) => this.delegado(this.prisma, t).findMany({ orderBy: { id: 'asc' } })));
    return empaquetar(Object.fromEntries(TABLAS.map((t, i) => [t, filas[i]])) as Record<Tabla, Record<string, unknown>[]>);
  }

  /**
   * Reemplaza TODA la información por la del archivo, dentro de UNA transacción: si cualquier fila falla
   * (dato inválido, referencia rota), se deshace todo y la base queda exactamente como estaba.
   */
  async restaurar(contenido: Buffer) {
    let archivo;
    try {
      archivo = desempaquetar(contenido);
    } catch (error) {
      if (error instanceof RespaldoInvalidoError) throw new BadRequestException(error.message);
      throw error;
    }

    try {
      await this.prisma.$transaction(
        async (tx) => {
          for (const t of [...TABLAS].reverse()) await this.delegado(tx, t).deleteMany();
          for (const t of TABLAS) {
            const filas = archivo.tablas[t];
            for (let i = 0; i < filas.length; i += LOTE) {
              await this.delegado(tx, t).createMany({ data: filas.slice(i, i + LOTE) });
            }
          }
        },
        // 25 000 notas tardan unos segundos; el límite por defecto (5 s) es muy corto.
        { timeout: 180_000, maxWait: 10_000 },
      );
    } catch (error) {
      this.logger.warn(`Restauración cancelada, no se cambió nada: ${error instanceof Error ? error.message : String(error)}`);
      throw new BadRequestException(
        'No se pudo restaurar: el respaldo tiene datos que no encajan (se deshizo todo, la información actual no cambió).',
      );
    }

    return { restaurado: true, generado: archivo.generado, conteos: archivo.conteos };
  }
}
