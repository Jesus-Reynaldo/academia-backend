import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { paginate } from '../common/pagination.util.js';
import { removeOrDeactivate } from '../common/soft-delete.util.js';
import { groupBy } from '../common/array.util.js';
import { CreateEstudianteDto } from './dto/create-estudiante.dto.js';
import { UpdateEstudianteDto } from './dto/update-estudiante.dto.js';
import { EstudianteQueryDto } from './dto/estudiante-query.dto.js';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';

const SORTABLE_FIELDS = new Set(['id', 'codigo', 'nombres', 'apellidos', 'estado']);

@Injectable()
export class EstudianteService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateEstudianteDto) {
    return this.prisma.estudiante.create({
      data: {
        ...dto,
        fechaNacimiento: dto.fechaNacimiento ? new Date(dto.fechaNacimiento) : undefined,
      },
    });
  }

  async findAll(query: EstudianteQueryDto) {
    const where: Prisma.EstudianteWhereInput = {
      estado: query.estado,
      OR: query.nombre
        ? [
            { nombres: { contains: query.nombre } },
            { apellidos: { contains: query.nombre } },
          ]
        : undefined,
    };

    const sortBy = query.sortBy && SORTABLE_FIELDS.has(query.sortBy) ? query.sortBy : 'id';

    return paginate(this.prisma.estudiante, {
      where,
      orderBy: { [sortBy]: query.order ?? 'asc' },
      page: query.page,
      limit: query.limit,
    });
  }

  async findOne(id: number) {
    const estudiante = await this.prisma.estudiante.findUnique({ where: { id } });
    if (!estudiante) {
      throw new NotFoundException('Estudiante no encontrado');
    }
    return estudiante;
  }

  async update(id: number, dto: UpdateEstudianteDto) {
    await this.findOne(id);
    return this.prisma.estudiante.update({
      where: { id },
      data: {
        ...dto,
        fechaNacimiento: dto.fechaNacimiento ? new Date(dto.fechaNacimiento) : undefined,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    return removeOrDeactivate({
      hasDependents: async () =>
        (await this.prisma.inscripcion.count({ where: { estudianteId: id } })) > 0,
      deactivate: () =>
        this.prisma.estudiante.update({ where: { id }, data: { estado: 'INACTIVO' } }),
      hardDelete: () => this.prisma.estudiante.delete({ where: { id } }),
    });
  }

  async findInscripciones(estudianteId: number, query: PaginationQueryDto) {
    await this.findOne(estudianteId);

    return paginate(this.prisma.inscripcion, {
      where: { estudianteId },
      orderBy: { id: query.order ?? 'asc' },
      page: query.page,
      limit: query.limit,
    });
  }

  async findCalificaciones(estudianteId: number, query: PaginationQueryDto) {
    await this.findOne(estudianteId);

    return paginate(this.prisma.calificacion, {
      where: { inscripcion: { estudianteId } },
      orderBy: { id: query.order ?? 'asc' },
      page: query.page,
      limit: query.limit,
    });
  }

  async getHistorialAcademico(id: number) {
    const estudiante = await this.prisma.estudiante.findUnique({
      where: { id },
      include: {
        inscripciones: {
          include: {
            periodoAcademico: true,
            curso: true,
            calificaciones: { include: { materia: true } },
          },
        },
      },
    });

    if (!estudiante) {
      throw new NotFoundException('Estudiante no encontrado');
    }

    return {
      estudiante: {
        id: estudiante.id,
        codigo: estudiante.codigo,
        nombre: `${estudiante.nombres} ${estudiante.apellidos}`,
      },
      periodos: estudiante.inscripciones.map((inscripcion) => {
        const porMateria = groupBy(
          inscripcion.calificaciones,
          (calificacion) => calificacion.materia.nombre,
        );

        return {
          periodo: inscripcion.periodoAcademico.nombre,
          curso: inscripcion.curso.nombre,
          materias: [...porMateria.entries()].map(([materia, calificaciones]) => ({
            materia,
            calificaciones: calificaciones.map((calificacion) => ({
              tipo: calificacion.tipo,
              nota: calificacion.nota,
            })),
          })),
        };
      }),
    };
  }
}
