import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { paginate } from '../common/pagination.util.js';
import { CALIFICACION_INCLUDE } from '../calificacion/calificacion.include.js';
import { removeOrDeactivate } from '../common/soft-delete.util.js';
import { CreateDocenteDto } from './dto/create-docente.dto.js';
import { UpdateDocenteDto } from './dto/update-docente.dto.js';
import { DocenteQueryDto } from './dto/docente-query.dto.js';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';

const SORTABLE_FIELDS = new Set(['id', 'codigo', 'nombres', 'apellidos', 'estado']);

@Injectable()
export class DocenteService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDocenteDto) {
    return this.prisma.docente.create({ data: dto });
  }

  async findAll(query: DocenteQueryDto) {
    const where: Prisma.DocenteWhereInput = {
      estado: query.estado,
      OR: query.nombre
        ? [
            { nombres: { contains: query.nombre } },
            { apellidos: { contains: query.nombre } },
          ]
        : undefined,
    };

    const sortBy = query.sortBy && SORTABLE_FIELDS.has(query.sortBy) ? query.sortBy : 'id';

    return paginate(this.prisma.docente, {
      where,
      orderBy: { [sortBy]: query.order ?? 'asc' },
      page: query.page,
      limit: query.limit,
    });
  }

  async findOne(id: number) {
    const docente = await this.prisma.docente.findUnique({ where: { id } });
    if (!docente) {
      throw new NotFoundException('Docente no encontrado');
    }
    return docente;
  }

  async update(id: number, dto: UpdateDocenteDto) {
    await this.findOne(id);
    return this.prisma.docente.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);

    return removeOrDeactivate({
      hasDependents: async () =>
        (await this.prisma.calificacion.count({ where: { docenteId: id } })) > 0,
      deactivate: () =>
        this.prisma.docente.update({ where: { id }, data: { estado: 'INACTIVO' } }),
      hardDelete: () => this.prisma.docente.delete({ where: { id } }),
    });
  }

  async findCalificaciones(docenteId: number, query: PaginationQueryDto) {
    await this.findOne(docenteId);

    return paginate(this.prisma.calificacion, {
      where: { docenteId },
      include: CALIFICACION_INCLUDE,
      orderBy: { id: query.order ?? 'asc' },
      page: query.page,
      limit: query.limit,
    });
  }
}
