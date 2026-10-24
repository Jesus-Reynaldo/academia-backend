import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { paginate } from '../common/pagination.util.js';
import { CreatePeriodoAcademicoDto } from './dto/create-periodo-academico.dto.js';
import { UpdatePeriodoAcademicoDto } from './dto/update-periodo-academico.dto.js';
import { PeriodoAcademicoQueryDto } from './dto/periodo-academico-query.dto.js';

const SORTABLE_FIELDS = new Set(['id', 'nombre', 'fechaInicio', 'fechaFin', 'estado']);

@Injectable()
export class PeriodoAcademicoService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePeriodoAcademicoDto) {
    this.validateFechas(dto.fechaInicio, dto.fechaFin);

    return this.prisma.periodoAcademico.create({
      data: {
        nombre: dto.nombre,
        fechaInicio: new Date(dto.fechaInicio),
        fechaFin: new Date(dto.fechaFin),
        estado: dto.estado,
      },
    });
  }

  async findAll(query: PeriodoAcademicoQueryDto) {
    const where: Prisma.PeriodoAcademicoWhereInput = {
      estado: query.estado,
    };

    const sortBy = query.sortBy && SORTABLE_FIELDS.has(query.sortBy) ? query.sortBy : 'id';

    return paginate(this.prisma.periodoAcademico, {
      where,
      orderBy: { [sortBy]: query.order ?? 'asc' },
      page: query.page,
      limit: query.limit,
    });
  }

  async findOne(id: number) {
    const periodo = await this.prisma.periodoAcademico.findUnique({ where: { id } });
    if (!periodo) {
      throw new NotFoundException('Período académico no encontrado');
    }
    return periodo;
  }

  async update(id: number, dto: UpdatePeriodoAcademicoDto) {
    const periodo = await this.findOne(id);

    const fechaInicio = dto.fechaInicio ?? periodo.fechaInicio.toISOString();
    const fechaFin = dto.fechaFin ?? periodo.fechaFin.toISOString();
    this.validateFechas(fechaInicio, fechaFin);

    return this.prisma.periodoAcademico.update({
      where: { id },
      data: {
        nombre: dto.nombre,
        fechaInicio: dto.fechaInicio ? new Date(dto.fechaInicio) : undefined,
        fechaFin: dto.fechaFin ? new Date(dto.fechaFin) : undefined,
        estado: dto.estado,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.periodoAcademico.delete({ where: { id } });
  }

  private validateFechas(fechaInicio: string, fechaFin: string) {
    if (new Date(fechaInicio) >= new Date(fechaFin)) {
      throw new BadRequestException('fechaInicio debe ser anterior a fechaFin');
    }
  }
}
