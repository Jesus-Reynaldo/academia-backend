import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { groupBy, promedio } from '../common/array.util.js';
import { EstudiantesEnRiesgoQueryDto } from './dto/dashboard-query.dto.js';

const DEFAULT_NOTA_APROBACION = 51;
const DEFAULT_LIMIT = 20;

/** Upper bounds (exclusive) of the grade buckets; the last one is open-ended. */
const RANGOS = [
  { rango: '0-50', hasta: 51 },
  { rango: '51-70', hasta: 71 },
  { rango: '71-85', hasta: 86 },
  { rango: '86-100', hasta: Infinity },
] as const;

export interface PeriodoResumen {
  id: number;
  nombre: string;
  fechaInicio: Date;
  fechaFin: Date;
}

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async resumen() {
    const [
      estudiantesActivos,
      docentesActivos,
      cursosActivos,
      materiasActivas,
      periodoActivo,
    ] = await Promise.all([
      this.prisma.estudiante.count({ where: { estado: 'ACTIVO' } }),
      this.prisma.docente.count({ where: { estado: 'ACTIVO' } }),
      this.prisma.curso.count({ where: { estado: 'ACTIVO' } }),
      this.prisma.materia.count({ where: { estado: 'ACTIVA' } }),
      this.periodoPorDefecto(),
    ]);

    const inscripcionesActivas = periodoActivo
      ? await this.prisma.inscripcion.count({
          where: { periodoAcademicoId: periodoActivo.id, estado: 'ACTIVA' },
        })
      : 0;

    return {
      totales: { estudiantesActivos, docentesActivos, cursosActivos, materiasActivas },
      periodoActivo,
      inscripcionesActivas,
    };
  }

  async ocupacionCursos(periodoAcademicoId?: number) {
    const periodo = await this.resolverPeriodo(periodoAcademicoId);
    if (!periodo) {
      return { periodo: null, data: [] };
    }

    const [cursos, ocupados] = await Promise.all([
      this.prisma.curso.findMany({ where: { estado: 'ACTIVO' }, orderBy: { id: 'asc' } }),
      this.prisma.inscripcion.groupBy({
        by: ['cursoId'],
        where: { periodoAcademicoId: periodo.id, estado: 'ACTIVA' },
        _count: { _all: true },
      }),
    ]);
    const inscritosPorCurso = new Map(ocupados.map((fila) => [fila.cursoId, fila._count._all]));

    return {
      periodo,
      data: cursos.map((curso) => {
        const inscritosActivos = inscritosPorCurso.get(curso.id) ?? 0;
        return {
          cursoId: curso.id,
          nombre: curso.nombre,
          capacidad: curso.capacidad,
          inscritosActivos,
          porcentaje:
            curso.capacidad != null && curso.capacidad > 0
              ? Math.round((inscritosActivos / curso.capacidad) * 10000) / 100
              : null,
        };
      }),
    };
  }

  async promediosPorCurso(periodoAcademicoId?: number) {
    const periodo = await this.resolverPeriodo(periodoAcademicoId);
    if (!periodo) {
      return { periodo: null, data: [] };
    }

    const filas = await this.prisma.$queryRaw<
      { cursoId: number; curso: string; promedio: number; cantidad: bigint }[]
    >(Prisma.sql`
      SELECT cu.id AS cursoId, cu.nombre AS curso, AVG(c.nota) AS promedio, COUNT(*) AS cantidad
      FROM calificaciones c
      JOIN inscripciones i ON i.id = c.inscripcionId
      JOIN cursos cu ON cu.id = i.cursoId
      WHERE i.periodoAcademicoId = ${periodo.id}
      GROUP BY cu.id, cu.nombre
      ORDER BY cu.id
    `);

    return {
      periodo,
      data: filas.map((fila) => ({
        cursoId: Number(fila.cursoId),
        curso: fila.curso,
        promedio: promedio([Number(fila.promedio)]),
        cantidadCalificaciones: Number(fila.cantidad),
      })),
    };
  }

  async distribucionNotas(options: {
    periodoAcademicoId?: number;
    materiaId?: number;
    docenteId?: number;
  }) {
    const periodo = await this.resolverPeriodo(options.periodoAcademicoId);
    if (!periodo) {
      return { periodo: null, materiaId: options.materiaId ?? null, data: this.rangosVacios() };
    }

    const materia = options.materiaId
      ? Prisma.sql`AND c.materiaId = ${options.materiaId}`
      : Prisma.empty;
    const docente = options.docenteId
      ? Prisma.sql`AND c.docenteId = ${options.docenteId}`
      : Prisma.empty;

    const filas = await this.prisma.$queryRaw<{ nota: number; cantidad: bigint }[]>(Prisma.sql`
      SELECT c.nota AS nota, COUNT(*) AS cantidad
      FROM calificaciones c
      JOIN inscripciones i ON i.id = c.inscripcionId
      WHERE i.periodoAcademicoId = ${periodo.id} ${materia} ${docente}
      GROUP BY c.nota
    `);

    const data = this.rangosVacios();
    for (const fila of filas) {
      const nota = Number(fila.nota);
      const indice = RANGOS.findIndex(({ hasta }) => nota < hasta);
      data[indice]!.cantidad += Number(fila.cantidad);
    }

    return { periodo, materiaId: options.materiaId ?? null, data };
  }

  async estudiantesEnRiesgo(query: EstudiantesEnRiesgoQueryDto) {
    const periodo = await this.resolverPeriodo(query.periodoAcademicoId);
    const umbral = query.umbral ?? this.notaAprobacion();
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : DEFAULT_LIMIT;

    if (!periodo) {
      return {
        periodo: null,
        umbral,
        data: [],
        meta: { page, limit, total: 0, totalPages: 0 },
      };
    }

    const filas = await this.prisma.$queryRaw<
      {
        estudianteId: number;
        codigo: string;
        nombres: string;
        apellidos: string;
        promedio: number;
        cantidad: bigint;
        total: bigint;
      }[]
    >(Prisma.sql`
      SELECT riesgo.*, COUNT(*) OVER () AS total
      FROM (
        SELECT e.id AS estudianteId, e.codigo, e.nombres, e.apellidos,
               AVG(c.nota) AS promedio, COUNT(*) AS cantidad
        FROM calificaciones c
        JOIN inscripciones i ON i.id = c.inscripcionId
        JOIN estudiantes e ON e.id = i.estudianteId
        WHERE i.periodoAcademicoId = ${periodo.id}
        GROUP BY e.id, e.codigo, e.nombres, e.apellidos
        HAVING AVG(c.nota) < ${umbral}
      ) AS riesgo
      ORDER BY riesgo.promedio ASC, riesgo.estudianteId ASC
      LIMIT ${limit} OFFSET ${(page - 1) * limit}
    `);

    const total = filas[0] ? Number(filas[0].total) : 0;
    return {
      periodo,
      umbral,
      data: filas.map((fila) => ({
        estudianteId: Number(fila.estudianteId),
        codigo: fila.codigo,
        nombre: `${fila.nombres} ${fila.apellidos}`,
        promedio: promedio([Number(fila.promedio)]),
        cantidadCalificaciones: Number(fila.cantidad),
      })),
      meta: { page, limit, total, totalPages: total === 0 ? 0 : Math.ceil(total / limit) },
    };
  }

  async resumenEstudiante(estudianteId: number) {
    const estudiante = await this.prisma.estudiante.findUnique({
      where: { id: estudianteId },
      include: {
        inscripciones: {
          include: { periodoAcademico: true, calificaciones: { select: { nota: true, materiaId: true } } },
        },
      },
    });
    if (!estudiante) {
      throw new NotFoundException('Estudiante no encontrado');
    }

    const calificaciones = estudiante.inscripciones.flatMap((i) => i.calificaciones);
    const porPeriodo = groupBy(estudiante.inscripciones, (i) => i.periodoAcademicoId);

    return {
      estudiante: {
        id: estudiante.id,
        codigo: estudiante.codigo,
        nombre: `${estudiante.nombres} ${estudiante.apellidos}`,
      },
      promedioGeneral: promedio(calificaciones.map((c) => c.nota)),
      cantidadCalificaciones: calificaciones.length,
      materiasCursadas: new Set(calificaciones.map((c) => c.materiaId)).size,
      porPeriodo: [...porPeriodo.values()].map((inscripciones) => {
        const notas = inscripciones.flatMap((i) => i.calificaciones.map((c) => c.nota));
        return {
          periodoId: inscripciones[0]!.periodoAcademico.id,
          periodo: inscripciones[0]!.periodoAcademico.nombre,
          promedio: promedio(notas),
          cantidadCalificaciones: notas.length,
        };
      }),
    };
  }

  async resumenDocente(docenteId: number) {
    const docente = await this.prisma.docente.findUnique({ where: { id: docenteId } });
    if (!docente) {
      throw new NotFoundException('Docente no encontrado');
    }

    const [total, porMateria] = await Promise.all([
      this.prisma.calificacion.aggregate({
        where: { docenteId },
        _avg: { nota: true },
        _count: { _all: true },
      }),
      this.prisma.calificacion.groupBy({
        by: ['materiaId'],
        where: { docenteId },
        _avg: { nota: true },
        _count: { _all: true },
        orderBy: { materiaId: 'asc' },
      }),
    ]);

    const materias = await this.prisma.materia.findMany({
      where: { id: { in: porMateria.map((fila) => fila.materiaId) } },
    });
    const nombres = new Map(materias.map((materia) => [materia.id, materia.nombre]));

    return {
      docente: {
        id: docente.id,
        codigo: docente.codigo,
        nombre: `${docente.nombres} ${docente.apellidos}`,
      },
      calificacionesRegistradas: total._count._all,
      promedioOtorgado: total._avg.nota == null ? null : promedio([total._avg.nota]),
      materias: porMateria.map((fila) => ({
        materiaId: fila.materiaId,
        materia: nombres.get(fila.materiaId) ?? null,
        calificaciones: fila._count._all,
        promedio: fila._avg.nota == null ? null : promedio([fila._avg.nota]),
      })),
    };
  }

  private notaAprobacion(): number {
    const configured = Number(this.config.get('NOTA_APROBACION'));
    return Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_NOTA_APROBACION;
  }

  private rangosVacios() {
    return RANGOS.map(({ rango }) => ({ rango, cantidad: 0 }));
  }

  private periodoPorDefecto(): Promise<PeriodoResumen | null> {
    return this.prisma.periodoAcademico.findFirst({
      where: { estado: 'ACTIVO' },
      orderBy: { fechaInicio: 'desc' },
      select: { id: true, nombre: true, fechaInicio: true, fechaFin: true },
    });
  }

  /** The requested period, or the active one when none is given. */
  private async resolverPeriodo(id?: number): Promise<PeriodoResumen | null> {
    if (id == null) {
      return this.periodoPorDefecto();
    }
    const periodo = await this.prisma.periodoAcademico.findUnique({
      where: { id },
      select: { id: true, nombre: true, fechaInicio: true, fechaFin: true },
    });
    if (!periodo) {
      throw new NotFoundException('Período académico no encontrado');
    }
    return periodo;
  }
}
