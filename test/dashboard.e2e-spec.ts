import { INestApplication } from '@nestjs/common';
import type { App } from 'supertest/types';
import { createTestApp } from './helpers/create-test-app.js';
import { cleanDatabase } from './helpers/clean-db.js';
import { agentFor, createUsuario } from './helpers/auth.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Dashboard (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  let admin: ReturnType<typeof agentFor>;
  let asDocente: ReturnType<typeof agentFor>;
  let asEstudiante: ReturnType<typeof agentFor>;
  let ids: {
    periodoId: number;
    cursoId: number;
    materiaId: number;
    estudianteId: number;
    riesgoId: number;
    docenteId: number;
    otroDocenteId: number;
  };

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await cleanDatabase(prisma);

    const periodo = await prisma.periodoAcademico.create({
      data: {
        nombre: 'Gestión 2026',
        fechaInicio: new Date('2026-02-01'),
        fechaFin: new Date('2026-11-30'),
        estado: 'ACTIVO',
      },
    });
    const curso = await prisma.curso.create({
      data: { nombre: '1ro A', nivel: 'Secundaria', capacidad: 4 },
    });
    await prisma.curso.create({ data: { nombre: 'Sin cupo definido', nivel: 'Secundaria' } });
    const materia = await prisma.materia.create({ data: { codigo: 'MAT-1', nombre: 'Matemática' } });
    const docente = await prisma.docente.create({
      data: { codigo: 'D-1', nombres: 'Ana', apellidos: 'García' },
    });
    const otroDocente = await prisma.docente.create({
      data: { codigo: 'D-2', nombres: 'Luis', apellidos: 'Mamani' },
    });

    // Alicia averages 90 (passing); Beto averages 40 (at risk).
    const alicia = await prisma.estudiante.create({
      data: { codigo: 'E-A', nombres: 'Alicia', apellidos: 'Alta', documento: '1' },
    });
    const beto = await prisma.estudiante.create({
      data: { codigo: 'E-B', nombres: 'Beto', apellidos: 'Bajo', documento: '2' },
    });
    const inscripcionAlicia = await prisma.inscripcion.create({
      data: { estudianteId: alicia.id, cursoId: curso.id, periodoAcademicoId: periodo.id },
    });
    const inscripcionBeto = await prisma.inscripcion.create({
      data: { estudianteId: beto.id, cursoId: curso.id, periodoAcademicoId: periodo.id },
    });
    const registrar = (inscripcionId: number, nota: number, docenteId: number) =>
      prisma.calificacion.create({
        data: { inscripcionId, materiaId: materia.id, docenteId, nota, tipo: 'PARCIAL' },
      });
    await registrar(inscripcionAlicia.id, 80, docente.id);
    await registrar(inscripcionAlicia.id, 100, docente.id);
    await registrar(inscripcionBeto.id, 30, otroDocente.id);
    await registrar(inscripcionBeto.id, 50, otroDocente.id);

    ids = {
      periodoId: periodo.id,
      cursoId: curso.id,
      materiaId: materia.id,
      estudianteId: alicia.id,
      riesgoId: beto.id,
      docenteId: docente.id,
      otroDocenteId: otroDocente.id,
    };

    admin = agentFor(app, (await createUsuario(prisma, { rol: 'ADMIN' })).id);
    asDocente = agentFor(
      app,
      (await createUsuario(prisma, { rol: 'DOCENTE', docenteId: docente.id })).id,
    );
    asEstudiante = agentFor(
      app,
      (await createUsuario(prisma, { rol: 'ESTUDIANTE', estudianteId: alicia.id })).id,
    );
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /dashboard/resumen returns totals and the active period', async () => {
    const response = await admin.get('/api/v1/dashboard/resumen').expect(200);

    expect(response.body).toMatchObject({
      totales: { estudiantesActivos: 2, docentesActivos: 2, cursosActivos: 2, materiasActivas: 1 },
      periodoActivo: { id: ids.periodoId, nombre: 'Gestión 2026' },
      inscripcionesActivas: 2,
    });
  });

  it('GET /dashboard/resumen works without an active period', async () => {
    await prisma.periodoAcademico.update({
      where: { id: ids.periodoId },
      data: { estado: 'FINALIZADO' },
    });

    const response = await admin.get('/api/v1/dashboard/resumen').expect(200);

    expect(response.body.periodoActivo).toBeNull();
    expect(response.body.inscripcionesActivas).toBe(0);
  });

  it('GET /dashboard/ocupacion-cursos computes the percentage, null without capacity', async () => {
    const response = await admin.get('/api/v1/dashboard/ocupacion-cursos').expect(200);

    expect(response.body.data).toEqual([
      expect.objectContaining({
        cursoId: ids.cursoId,
        capacidad: 4,
        inscritosActivos: 2,
        porcentaje: 50,
      }),
      expect.objectContaining({ capacidad: null, inscritosActivos: 0, porcentaje: null }),
    ]);
  });

  it('GET /dashboard/promedios-por-curso averages every grade of the curso', async () => {
    const response = await admin
      .get(`/api/v1/dashboard/promedios-por-curso?periodoAcademicoId=${ids.periodoId}`)
      .expect(200);

    expect(response.body.data).toEqual([
      { cursoId: ids.cursoId, curso: '1ro A', promedio: 65, cantidadCalificaciones: 4 },
    ]);
  });

  it('GET /dashboard/distribucion-notas buckets the grades and always returns every range', async () => {
    const response = await admin.get('/api/v1/dashboard/distribucion-notas').expect(200);

    expect(response.body.data).toEqual([
      { rango: '0-50', cantidad: 2 },
      { rango: '51-70', cantidad: 0 },
      { rango: '71-85', cantidad: 1 },
      { rango: '86-100', cantidad: 1 },
    ]);
  });

  it('GET /dashboard/distribucion-notas limits a docente to the grades they gave', async () => {
    const response = await asDocente.get('/api/v1/dashboard/distribucion-notas').expect(200);

    expect(response.body.data).toEqual([
      { rango: '0-50', cantidad: 0 },
      { rango: '51-70', cantidad: 0 },
      { rango: '71-85', cantidad: 1 },
      { rango: '86-100', cantidad: 1 },
    ]);
  });

  it('GET /dashboard/estudiantes-en-riesgo lists students under the threshold', async () => {
    const response = await admin.get('/api/v1/dashboard/estudiantes-en-riesgo').expect(200);

    expect(response.body.umbral).toBe(51);
    expect(response.body.data).toEqual([
      {
        estudianteId: ids.riesgoId,
        codigo: 'E-B',
        nombre: 'Beto Bajo',
        promedio: 40,
        cantidadCalificaciones: 2,
      },
    ]);
    expect(response.body.meta).toEqual({ page: 1, limit: 20, total: 1, totalPages: 1 });
  });

  it('GET /dashboard/estudiantes-en-riesgo honours a custom umbral and paginates', async () => {
    const response = await admin
      .get('/api/v1/dashboard/estudiantes-en-riesgo?umbral=95&limit=1&page=2')
      .expect(200);

    expect(response.body.umbral).toBe(95);
    expect(response.body.meta).toMatchObject({ page: 2, limit: 1, total: 2, totalPages: 2 });
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].estudianteId).toBe(ids.estudianteId);
  });

  it('returns 404 for an unknown periodo', async () => {
    await admin.get('/api/v1/dashboard/ocupacion-cursos?periodoAcademicoId=9999').expect(404);
  });

  it('GET /dashboard/estudiantes/:id/resumen summarises the student', async () => {
    const response = await asEstudiante
      .get(`/api/v1/dashboard/estudiantes/${ids.estudianteId}/resumen`)
      .expect(200);

    expect(response.body).toMatchObject({
      estudiante: { codigo: 'E-A', nombre: 'Alicia Alta' },
      promedioGeneral: 90,
      cantidadCalificaciones: 2,
      materiasCursadas: 1,
      porPeriodo: [{ periodo: 'Gestión 2026', promedio: 90, cantidadCalificaciones: 2 }],
    });
  });

  it('GET /dashboard/docentes/:id/resumen summarises the docente', async () => {
    const response = await asDocente
      .get(`/api/v1/dashboard/docentes/${ids.docenteId}/resumen`)
      .expect(200);

    expect(response.body).toMatchObject({
      docente: { codigo: 'D-1', nombre: 'Ana García' },
      calificacionesRegistradas: 2,
      promedioOtorgado: 90,
      materias: [{ materiaId: ids.materiaId, materia: 'Matemática', calificaciones: 2, promedio: 90 }],
    });
  });

  it('enforces roles and ownership', async () => {
    await asDocente.get('/api/v1/dashboard/resumen').expect(403);
    await asEstudiante.get('/api/v1/dashboard/resumen').expect(403);
    await asEstudiante.get('/api/v1/dashboard/distribucion-notas').expect(403);
    await asEstudiante.get(`/api/v1/dashboard/estudiantes/${ids.riesgoId}/resumen`).expect(403);
    await asDocente.get(`/api/v1/dashboard/docentes/${ids.otroDocenteId}/resumen`).expect(403);
    await asDocente.get(`/api/v1/dashboard/estudiantes/${ids.estudianteId}/resumen`).expect(403);
  });

  it('GET /estudiantes/:id/historial-academico includes averages', async () => {
    const response = await admin
      .get(`/api/v1/estudiantes/${ids.estudianteId}/historial-academico`)
      .expect(200);

    expect(response.body).toMatchObject({
      promedioGeneral: 90,
      periodos: [
        {
          periodoId: ids.periodoId,
          cursoId: ids.cursoId,
          promedio: 90,
          materias: [{ materiaId: ids.materiaId, materia: 'Matemática', promedio: 90 }],
        },
      ],
    });
  });
});
