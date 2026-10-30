import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { paginate } from '../common/pagination.util.js';
import { removeOrDeactivate } from '../common/soft-delete.util.js';
import { CreateCursoDto } from './dto/create-curso.dto.js';
import { UpdateCursoDto } from './dto/update-curso.dto.js';
import { CursoQueryDto } from './dto/curso-query.dto.js';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';

const SORTABLE_FIELDS = new Set(['id', 'nombre', 'nivel', 'paralelo', 'capacidad', 'estado', 'createdAt']);

// Occupancy is measured against the running period, where `capacidad` applies.
const INSCRITOS_ACTIVOS = {
  _count: {
    select: {
      inscripciones: { where: { estado: 'ACTIVA', periodoAcademico: { estado: 'ACTIVO' } } },
    },
  },
} satisfies Prisma.CursoInclude;

type CursoConConteo = Prisma.CursoGetPayload<{ include: typeof INSCRITOS_ACTIVOS }>;

function withInscritosActivos({ _count, ...curso }: CursoConConteo) {
  return { ...curso, inscritosActivos: _count.inscripciones };
}

@Injectable()
export class CursoService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCursoDto) {
    return this.prisma.curso.create({ data: dto });
  }

  async findAll(query: CursoQueryDto) {
    const where: Prisma.CursoWhereInput = {
      estado: query.estado,
      nivel: query.nivel,
      nombre: query.nombre ? { contains: query.nombre } : undefined,
    };

    const sortBy = query.sortBy && SORTABLE_FIELDS.has(query.sortBy) ? query.sortBy : 'id';

    const result = await paginate(this.prisma.curso, {
      where,
      orderBy: { [sortBy]: query.order ?? 'asc' },
      include: INSCRITOS_ACTIVOS,
      page: query.page,
      limit: query.limit,
    });
    // `paginate` is generic over the delegate and does not carry the `include` into its type.
    return { ...result, data: (result.data as CursoConConteo[]).map(withInscritosActivos) };
  }

  async findOne(id: number) {
    const curso = await this.prisma.curso.findUnique({
      where: { id },
      include: INSCRITOS_ACTIVOS,
    });
    if (!curso) {
      throw new NotFoundException('Curso no encontrado');
    }
    return withInscritosActivos(curso);
  }

  async update(id: number, dto: UpdateCursoDto) {
    await this.assertExists(id);
    return this.prisma.curso.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.assertExists(id);

    return removeOrDeactivate({
      hasDependents: async () =>
        (await this.prisma.inscripcion.count({ where: { cursoId: id } })) > 0,
      deactivate: () =>
        this.prisma.curso.update({ where: { id }, data: { estado: 'INACTIVO' } }),
      hardDelete: () => this.prisma.curso.delete({ where: { id } }),
    });
  }

  async findEstudiantes(cursoId: number, query: PaginationQueryDto) {
    await this.assertExists(cursoId);

    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 20;
    const where: Prisma.InscripcionWhereInput = { cursoId };

    const [inscripciones, total] = await Promise.all([
      this.prisma.inscripcion.findMany({
        where,
        orderBy: { id: query.order ?? 'asc' },
        include: { estudiante: true },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.inscripcion.count({ where }),
    ]);

    return {
      data: inscripciones.map((inscripcion) => inscripcion.estudiante),
      meta: { page, limit, total, totalPages: total === 0 ? 0 : Math.ceil(total / limit) },
    };
  }

  async findMaterias(cursoId: number, query: PaginationQueryDto) {
    await this.assertExists(cursoId);

    const where: Prisma.MateriaWhereInput = {
      calificaciones: { some: { inscripcion: { cursoId } } },
    };

    return paginate(this.prisma.materia, {
      where,
      orderBy: { id: query.order ?? 'asc' },
      page: query.page,
      limit: query.limit,
    });
  }

  private async assertExists(id: number) {
    const curso = await this.prisma.curso.findUnique({ where: { id } });
    if (!curso) {
      throw new NotFoundException('Curso no encontrado');
    }
  }
}
