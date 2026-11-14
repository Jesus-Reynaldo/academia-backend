import { Injectable, Logger } from '@nestjs/common';
import type { AccionBitacora, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { paginate } from '../common/pagination.util.js';
import type { BitacoraQueryDto } from './dto/bitacora-query.dto.js';

export interface NuevoRegistroBitacora {
  usuarioId: number | null;
  accion: AccionBitacora;
  recurso: string;
  recursoId: number | null;
  descripcion: string;
}

@Injectable()
export class BitacoraService {
  private readonly logger = new Logger(BitacoraService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Guarda un registro sin bloquear la respuesta: si falla, solo se avisa en el log
   * (la bitácora nunca debe romper la operación que el usuario sí hizo).
   */
  registrar(datos: NuevoRegistroBitacora): void {
    this.prisma.bitacora.create({ data: datos }).catch((error: unknown) => {
      this.logger.warn(`No se pudo registrar en la bitácora: ${error instanceof Error ? error.message : String(error)}`);
    });
  }

  findAll(query: BitacoraQueryDto) {
    const where: Prisma.BitacoraWhereInput = {
      recurso: query.recurso,
      accion: query.accion,
      usuarioId: query.usuarioId,
      fecha: query.desde || query.hasta ? { gte: query.desde ? new Date(query.desde) : undefined, lte: query.hasta ? new Date(query.hasta) : undefined } : undefined,
    };
    return paginate(this.prisma.bitacora, {
      where,
      orderBy: [{ fecha: 'desc' }, { id: 'desc' }],
      include: { usuario: { select: { id: true, email: true, rol: true } } },
      page: query.page,
      limit: query.limit,
    });
  }
}
