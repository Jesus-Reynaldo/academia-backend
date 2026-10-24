import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { paginate } from '../common/pagination.util.js';
import { CreateCalificacionDto, NOTA_MAX, NOTA_MIN } from './dto/create-calificacion.dto.js';
import { UpdateCalificacionDto } from './dto/update-calificacion.dto.js';
import { CalificacionQueryDto } from './dto/calificacion-query.dto.js';

const SORTABLE_FIELDS = new Set(['id', 'nota', 'tipo', 'fecha']);

@Injectable()
export class CalificacionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCalificacionDto) {
    if (dto.nota < NOTA_MIN || dto.nota > NOTA_MAX) {
      throw new BadRequestException(`La nota debe estar entre ${NOTA_MIN} y ${NOTA_MAX}`);
    }

    const inscripcion = await this.prisma.inscripcion.findUnique({
      where: { id: dto.inscripcionId },
    });
    if (!inscripcion) {
      throw new NotFoundException('Inscripción no encontrada');
    }
    if (inscripcion.estado === 'RETIRADA') {
      throw new BadRequestException(
        'No se pueden registrar calificaciones en una inscripción retirada',
      );
    }

    const materia = await this.prisma.materia.findUnique({ where: { id: dto.materiaId } });
    if (!materia) {
      throw new NotFoundException('Materia no encontrada');
    }
    if (materia.estado !== 'ACTIVA') {
      throw new BadRequestException('La materia no está activa');
    }

    if (dto.docenteId != null) {
      const docente = await this.prisma.docente.findUnique({ where: { id: dto.docenteId } });
      if (!docente) {
        throw new NotFoundException('Docente no encontrado');
      }
      if (docente.estado !== 'ACTIVO') {
        throw new BadRequestException('El docente no está activo');
      }
    }

    return this.prisma.calificacion.create({
      data: {
        inscripcionId: dto.inscripcionId,
        materiaId: dto.materiaId,
        docenteId: dto.docenteId,
        nota: dto.nota,
        tipo: dto.tipo,
        fecha: dto.fecha ? new Date(dto.fecha) : undefined,
        observacion: dto.observacion,
      },
    });
  }

  async findAll(query: CalificacionQueryDto) {
    const where: Prisma.CalificacionWhereInput = {
      materiaId: query.materiaId,
      docenteId: query.docenteId,
      inscripcionId: query.inscripcionId,
      tipo: query.tipo,
    };

    const sortBy = query.sortBy && SORTABLE_FIELDS.has(query.sortBy) ? query.sortBy : 'id';

    return paginate(this.prisma.calificacion, {
      where,
      orderBy: { [sortBy]: query.order ?? 'asc' },
      page: query.page,
      limit: query.limit,
    });
  }

  async findOne(id: number) {
    const calificacion = await this.prisma.calificacion.findUnique({ where: { id } });
    if (!calificacion) {
      throw new NotFoundException('Calificación no encontrada');
    }
    return calificacion;
  }

  async update(id: number, dto: UpdateCalificacionDto) {
    await this.findOne(id);

    if (dto.nota != null && (dto.nota < NOTA_MIN || dto.nota > NOTA_MAX)) {
      throw new BadRequestException(`La nota debe estar entre ${NOTA_MIN} y ${NOTA_MAX}`);
    }

    return this.prisma.calificacion.update({
      where: { id },
      data: {
        nota: dto.nota,
        tipo: dto.tipo,
        fecha: dto.fecha ? new Date(dto.fecha) : undefined,
        observacion: dto.observacion,
        docenteId: dto.docenteId,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    throw new ConflictException(
      'No se puede eliminar físicamente una calificación que forma parte del historial académico',
    );
  }
}
