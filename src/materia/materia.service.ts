import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { paginate } from '../common/pagination.util.js';
import { CALIFICACION_INCLUDE } from '../calificacion/calificacion.include.js';
import { removeOrDeactivate } from '../common/soft-delete.util.js';
import { CreateMateriaDto } from './dto/create-materia.dto.js';
import { UpdateMateriaDto } from './dto/update-materia.dto.js';
import { MateriaQueryDto } from './dto/materia-query.dto.js';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';

const SORTABLE_FIELDS = new Set(['id', 'codigo', 'nombre', 'estado']);

@Injectable()
export class MateriaService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateMateriaDto) {
    return this.prisma.materia.create({ data: dto });
  }

  async findAll(query: MateriaQueryDto) {
    const where: Prisma.MateriaWhereInput = {
      estado: query.estado,
      nombre: query.nombre ? { contains: query.nombre } : undefined,
    };

    const sortBy = query.sortBy && SORTABLE_FIELDS.has(query.sortBy) ? query.sortBy : 'id';

    return paginate(this.prisma.materia, {
      where,
      orderBy: { [sortBy]: query.order ?? 'asc' },
      page: query.page,
      limit: query.limit,
    });
  }

  async findOne(id: number) {
    const materia = await this.prisma.materia.findUnique({ where: { id } });
    if (!materia) {
      throw new NotFoundException('Materia no encontrada');
    }
    return materia;
  }

  async update(id: number, dto: UpdateMateriaDto) {
    await this.findOne(id);
    return this.prisma.materia.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);

    return removeOrDeactivate({
      hasDependents: async () =>
        (await this.prisma.calificacion.count({ where: { materiaId: id } })) > 0,
      deactivate: () =>
        this.prisma.materia.update({ where: { id }, data: { estado: 'INACTIVA' } }),
      hardDelete: () => this.prisma.materia.delete({ where: { id } }),
    });
  }

  async findCalificaciones(materiaId: number, query: PaginationQueryDto) {
    await this.findOne(materiaId);

    return paginate(this.prisma.calificacion, {
      where: { materiaId },
      include: CALIFICACION_INCLUDE,
      orderBy: { id: query.order ?? 'asc' },
      page: query.page,
      limit: query.limit,
    });
  }
}
