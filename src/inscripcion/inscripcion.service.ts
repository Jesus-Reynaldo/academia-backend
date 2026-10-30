import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { paginate } from '../common/pagination.util.js';
import { CreateInscripcionDto } from './dto/create-inscripcion.dto.js';
import { UpdateInscripcionDto } from './dto/update-inscripcion.dto.js';
import { InscripcionQueryDto } from './dto/inscripcion-query.dto.js';

const SORTABLE_FIELDS = new Set(['id', 'fechaInscripcion', 'estado', 'createdAt']);

const INSCRIPCION_INCLUDE = {
  estudiante: true,
  curso: true,
  periodoAcademico: true,
} satisfies Prisma.InscripcionInclude;
const PRISMA_UNIQUE_CONSTRAINT = 'P2002';

@Injectable()
export class InscripcionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateInscripcionDto) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const estudiante = await tx.estudiante.findUnique({
          where: { id: dto.estudianteId },
        });
        if (!estudiante) {
          throw new NotFoundException('Estudiante no encontrado');
        }
        if (estudiante.estado !== 'ACTIVO') {
          throw new BadRequestException('El estudiante no está activo');
        }

        const curso = await tx.curso.findUnique({ where: { id: dto.cursoId } });
        if (!curso) {
          throw new NotFoundException('Curso no encontrado');
        }
        if (curso.estado !== 'ACTIVO') {
          throw new BadRequestException('El curso no está activo');
        }

        const periodo = await tx.periodoAcademico.findUnique({
          where: { id: dto.periodoAcademicoId },
        });
        if (!periodo) {
          throw new NotFoundException('Período académico no encontrado');
        }
        if (periodo.estado === 'FINALIZADO') {
          throw new BadRequestException(
            'El período académico no está disponible para inscripciones',
          );
        }

        const duplicada = await tx.inscripcion.findUnique({
          where: {
            estudianteId_cursoId_periodoAcademicoId: {
              estudianteId: dto.estudianteId,
              cursoId: dto.cursoId,
              periodoAcademicoId: dto.periodoAcademicoId,
            },
          },
        });
        if (duplicada) {
          throw new ConflictException(
            'El estudiante ya tiene una inscripción para ese curso y período',
          );
        }

        if (curso.capacidad != null) {
          const ocupados = await tx.inscripcion.count({
            where: {
              cursoId: dto.cursoId,
              periodoAcademicoId: dto.periodoAcademicoId,
              estado: 'ACTIVA',
            },
          });
          if (ocupados >= curso.capacidad) {
            throw new ConflictException('El curso ha alcanzado su capacidad máxima');
          }
        }

        return tx.inscripcion.create({
          data: {
            estudianteId: dto.estudianteId,
            cursoId: dto.cursoId,
            periodoAcademicoId: dto.periodoAcademicoId,
            fechaInscripcion: dto.fechaInscripcion ? new Date(dto.fechaInscripcion) : undefined,
          },
        });
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === PRISMA_UNIQUE_CONSTRAINT
      ) {
        throw new ConflictException(
          'El estudiante ya tiene una inscripción para ese curso y período',
        );
      }
      throw error;
    }
  }

  async findAll(query: InscripcionQueryDto) {
    const where: Prisma.InscripcionWhereInput = {
      estudianteId: query.estudianteId,
      cursoId: query.cursoId,
      periodoAcademicoId: query.periodoAcademicoId,
      estado: query.estado,
    };

    const sortBy = query.sortBy && SORTABLE_FIELDS.has(query.sortBy) ? query.sortBy : 'id';

    return paginate(this.prisma.inscripcion, {
      where,
      orderBy: { [sortBy]: query.order ?? 'asc' },
      include: INSCRIPCION_INCLUDE,
      page: query.page,
      limit: query.limit,
    });
  }

  async findOne(id: number) {
    const inscripcion = await this.prisma.inscripcion.findUnique({
      where: { id },
      include: INSCRIPCION_INCLUDE,
    });
    if (!inscripcion) {
      throw new NotFoundException('Inscripción no encontrada');
    }
    return inscripcion;
  }

  async update(id: number, dto: UpdateInscripcionDto) {
    await this.findOne(id);
    return this.prisma.inscripcion.update({
      where: { id },
      data: {
        estado: dto.estado,
        fechaInscripcion: dto.fechaInscripcion ? new Date(dto.fechaInscripcion) : undefined,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    const calificaciones = await this.prisma.calificacion.count({
      where: { inscripcionId: id },
    });
    if (calificaciones > 0) {
      throw new ConflictException(
        'No se puede eliminar una inscripción con calificaciones registradas; use PATCH con estado RETIRADA',
      );
    }

    await this.prisma.inscripcion.delete({ where: { id } });
  }
}
