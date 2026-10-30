import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { paginate } from '../common/pagination.util.js';
import { CALIFICACION_INCLUDE } from '../calificacion/calificacion.include.js';
import { removeOrDeactivate } from '../common/soft-delete.util.js';
import { groupBy, promedio } from '../common/array.util.js';
import { CreateEstudianteDto } from './dto/create-estudiante.dto.js';
import { UpdateEstudianteDto } from './dto/update-estudiante.dto.js';
import { EstudianteQueryDto } from './dto/estudiante-query.dto.js';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';

const SORTABLE_FIELDS = new Set([
  'id',
  'codigo',
  'nombres',
  'apellidos',
  'documento',
  'email',
  'estado',
  'createdAt',
]);

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
    const search = query.q ?? query.nombre;
    const where: Prisma.EstudianteWhereInput = {
      estado: query.estado,
      OR: search
        ? [
            { nombres: { contains: search } },
            { apellidos: { contains: search } },
            ...(query.q
              ? [{ codigo: { contains: search } }, { documento: { contains: search } }]
              : []),
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
      include: CALIFICACION_INCLUDE,
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

    const todas = estudiante.inscripciones.flatMap((inscripcion) =>
      inscripcion.calificaciones.map((calificacion) => calificacion.nota),
    );

    return {
      estudiante: {
        id: estudiante.id,
        codigo: estudiante.codigo,
        nombre: `${estudiante.nombres} ${estudiante.apellidos}`,
      },
      promedioGeneral: promedio(todas),
      periodos: estudiante.inscripciones.map((inscripcion) => {
        const porMateria = groupBy(
          inscripcion.calificaciones,
          (calificacion) => calificacion.materia.id,
        );

        return {
          periodoId: inscripcion.periodoAcademico.id,
          periodo: inscripcion.periodoAcademico.nombre,
          cursoId: inscripcion.curso.id,
          curso: inscripcion.curso.nombre,
          promedio: promedio(inscripcion.calificaciones.map((calificacion) => calificacion.nota)),
          materias: [...porMateria.values()].map((calificaciones) => ({
            materiaId: calificaciones[0]!.materia.id,
            materia: calificaciones[0]!.materia.nombre,
            promedio: promedio(calificaciones.map((calificacion) => calificacion.nota)),
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
