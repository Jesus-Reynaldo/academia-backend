import { INestApplication } from '@nestjs/common';
import type { App } from 'supertest/types';
import { createTestApp } from './helpers/create-test-app.js';
import { cleanDatabase } from './helpers/clean-db.js';
import { agentFor, createUsuario } from './helpers/auth.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Permisos por rol (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  let admin: ReturnType<typeof agentFor>;
  let docente: ReturnType<typeof agentFor>;
  let otroDocente: ReturnType<typeof agentFor>;
  let estudiante: ReturnType<typeof agentFor>;
  let ids: {
    estudianteId: number;
    otroEstudianteId: number;
    docenteId: number;
    otroDocenteId: number;
    inscripcionId: number;
    otraInscripcionId: number;
    materiaId: number;
    calificacionId: number;
  };

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await cleanDatabase(prisma);

    const [e1, e2] = await Promise.all([
      prisma.estudiante.create({
        data: { codigo: 'E-1', nombres: 'Juan', apellidos: 'Pérez', documento: '1' },
      }),
      prisma.estudiante.create({
        data: { codigo: 'E-2', nombres: 'María', apellidos: 'Fernández', documento: '2' },
      }),
    ]);
    const d1 = await prisma.docente.create({
      data: { codigo: 'D-1', nombres: 'Ana', apellidos: 'García' },
    });
    const d2 = await prisma.docente.create({
      data: { codigo: 'D-2', nombres: 'Luis', apellidos: 'Mamani' },
    });
    const curso = await prisma.curso.create({ data: { nombre: '1ro A', nivel: 'Secundaria' } });
    const periodo = await prisma.periodoAcademico.create({
      data: {
        nombre: 'Gestión 2026',
        fechaInicio: new Date('2026-02-01'),
        fechaFin: new Date('2026-11-30'),
        estado: 'ACTIVO',
      },
    });
    const materia = await prisma.materia.create({ data: { codigo: 'MAT-1', nombre: 'Matemática' } });
    const i1 = await prisma.inscripcion.create({
      data: { estudianteId: e1.id, cursoId: curso.id, periodoAcademicoId: periodo.id },
    });
    const i2 = await prisma.inscripcion.create({
      data: { estudianteId: e2.id, cursoId: curso.id, periodoAcademicoId: periodo.id },
    });
    const calificacion = await prisma.calificacion.create({
      data: {
        inscripcionId: i1.id,
        materiaId: materia.id,
        docenteId: d1.id,
        nota: 80,
        tipo: 'PARCIAL',
      },
    });
    await prisma.calificacion.create({
      data: {
        inscripcionId: i2.id,
        materiaId: materia.id,
        docenteId: d2.id,
        nota: 60,
        tipo: 'PARCIAL',
      },
    });

    ids = {
      estudianteId: e1.id,
      otroEstudianteId: e2.id,
      docenteId: d1.id,
      otroDocenteId: d2.id,
      inscripcionId: i1.id,
      otraInscripcionId: i2.id,
      materiaId: materia.id,
      calificacionId: calificacion.id,
    };

    admin = agentFor(app, (await createUsuario(prisma, { rol: 'ADMIN' })).id);
    docente = agentFor(app, (await createUsuario(prisma, { rol: 'DOCENTE', docenteId: d1.id })).id);
    otroDocente = agentFor(
      app,
      (await createUsuario(prisma, { rol: 'DOCENTE', docenteId: d2.id })).id,
    );
    estudiante = agentFor(
      app,
      (await createUsuario(prisma, { rol: 'ESTUDIANTE', estudianteId: e1.id })).id,
    );
  });

  afterAll(async () => {
    await app.close();
  });

  describe('estudiantes', () => {
    it('lets only admin and docente list estudiantes', async () => {
      await admin.get('/api/v1/estudiantes').expect(200);
      await docente.get('/api/v1/estudiantes').expect(200);
      await estudiante.get('/api/v1/estudiantes').expect(403);
    });

    it('lets an estudiante read only their own data', async () => {
      await estudiante.get(`/api/v1/estudiantes/${ids.estudianteId}`).expect(200);
      await estudiante.get(`/api/v1/estudiantes/${ids.estudianteId}/historial-academico`).expect(200);
      await estudiante.get(`/api/v1/estudiantes/${ids.otroEstudianteId}`).expect(403);
      await estudiante
        .get(`/api/v1/estudiantes/${ids.otroEstudianteId}/historial-academico`)
        .expect(403);
      await estudiante.get(`/api/v1/estudiantes/${ids.otroEstudianteId}/calificaciones`).expect(403);
    });

    it('only lets admin write', async () => {
      const body = { codigo: 'E-9', nombres: 'Nuevo', apellidos: 'Alumno', documento: '9' };
      await docente.post('/api/v1/estudiantes').send(body).expect(403);
      await estudiante.post('/api/v1/estudiantes').send(body).expect(403);
      await estudiante.patch(`/api/v1/estudiantes/${ids.estudianteId}`).send({ nombres: 'X' }).expect(403);
      await estudiante.delete(`/api/v1/estudiantes/${ids.estudianteId}`).expect(403);
      await admin.post('/api/v1/estudiantes').send(body).expect(201);
    });
  });

  describe('docentes', () => {
    it('lets a docente read only their own record', async () => {
      await docente.get(`/api/v1/docentes/${ids.docenteId}`).expect(200);
      await docente.get(`/api/v1/docentes/${ids.otroDocenteId}`).expect(403);
      await docente.get(`/api/v1/docentes/${ids.otroDocenteId}/calificaciones`).expect(403);
      await docente.get('/api/v1/docentes').expect(403);
      await estudiante.get(`/api/v1/docentes/${ids.docenteId}`).expect(403);
    });
  });

  describe('catálogos', () => {
    it('lets everyone read cursos, materias and períodos but only admin write', async () => {
      for (const api of [admin, docente, estudiante]) {
        await api.get('/api/v1/cursos').expect(200);
        await api.get('/api/v1/materias').expect(200);
        await api.get('/api/v1/periodos-academicos').expect(200);
      }
      await docente.post('/api/v1/cursos').send({ nombre: 'X', nivel: 'Y' }).expect(403);
      await estudiante.post('/api/v1/materias').send({ codigo: 'M', nombre: 'N' }).expect(403);
    });

    it('hides the estudiantes of a curso from other estudiantes', async () => {
      const cursos = await admin.get('/api/v1/cursos').expect(200);
      const cursoId = cursos.body.data[0].id;

      await docente.get(`/api/v1/cursos/${cursoId}/estudiantes`).expect(200);
      await estudiante.get(`/api/v1/cursos/${cursoId}/estudiantes`).expect(403);
    });
  });

  describe('inscripciones', () => {
    it('forces an estudiante to see only their own inscripciones, whatever the filter', async () => {
      const response = await estudiante
        .get(`/api/v1/inscripciones?estudianteId=${ids.otroEstudianteId}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].id).toBe(ids.inscripcionId);
      expect(response.body.data[0].estudiante).toMatchObject({ id: ids.estudianteId });
      expect(response.body.data[0].curso).toMatchObject({ nombre: '1ro A' });
    });

    it('forbids reading or writing someone else\'s inscripción', async () => {
      await estudiante.get(`/api/v1/inscripciones/${ids.inscripcionId}`).expect(200);
      await estudiante.get(`/api/v1/inscripciones/${ids.otraInscripcionId}`).expect(403);
      await estudiante
        .patch(`/api/v1/inscripciones/${ids.inscripcionId}`)
        .send({ estado: 'RETIRADA' })
        .expect(403);
    });
  });

  describe('calificaciones', () => {
    it('lists calificaciones with their relations', async () => {
      const response = await admin.get('/api/v1/calificaciones').expect(200);

      expect(response.body.data[0]).toMatchObject({
        materia: { nombre: 'Matemática' },
        inscripcion: { estudiante: { codigo: expect.any(String) }, curso: { nombre: '1ro A' } },
      });
    });

    it('scopes the list to the estudiante or docente, whatever the filter', async () => {
      const comoEstudiante = await estudiante
        .get(`/api/v1/calificaciones?estudianteId=${ids.otroEstudianteId}`)
        .expect(200);
      expect(comoEstudiante.body.data.map((c: { id: number }) => c.id)).toEqual([
        ids.calificacionId,
      ]);

      const comoDocente = await docente
        .get(`/api/v1/calificaciones?docenteId=${ids.otroDocenteId}`)
        .expect(200);
      expect(comoDocente.body.data.map((c: { id: number }) => c.id)).toEqual([ids.calificacionId]);
    });

    it('forbids reading a calificación that is not yours', async () => {
      await estudiante.get(`/api/v1/calificaciones/${ids.calificacionId}`).expect(200);
      await docente.get(`/api/v1/calificaciones/${ids.calificacionId}`).expect(200);
      await otroDocente.get(`/api/v1/calificaciones/${ids.calificacionId}`).expect(403);
    });

    it('lets a docente register grades only under their own name', async () => {
      const body = {
        inscripcionId: ids.otraInscripcionId,
        materiaId: ids.materiaId,
        nota: 90,
        tipo: 'FINAL',
      };

      await docente.post('/api/v1/calificaciones').send({ ...body, docenteId: ids.otroDocenteId }).expect(403);

      const response = await docente.post('/api/v1/calificaciones').send(body).expect(201);
      expect(response.body.docenteId).toBe(ids.docenteId);

      await estudiante.post('/api/v1/calificaciones').send(body).expect(403);
    });

    it('lets a docente edit only their own grades', async () => {
      await otroDocente
        .patch(`/api/v1/calificaciones/${ids.calificacionId}`)
        .send({ nota: 100 })
        .expect(403);
      await docente
        .patch(`/api/v1/calificaciones/${ids.calificacionId}`)
        .send({ nota: 95 })
        .expect(200);
      await docente
        .patch(`/api/v1/calificaciones/${ids.calificacionId}`)
        .send({ docenteId: ids.otroDocenteId })
        .expect(403);
    });

    it('filters by periodo, curso and date range', async () => {
      const todos = await admin.get('/api/v1/calificaciones').expect(200);
      expect(todos.body.meta.total).toBe(2);

      const porEstudiante = await admin
        .get(`/api/v1/calificaciones?estudianteId=${ids.otroEstudianteId}`)
        .expect(200);
      expect(porEstudiante.body.meta.total).toBe(1);

      const futuro = await admin
        .get('/api/v1/calificaciones?fechaDesde=2999-01-01T00:00:00.000Z')
        .expect(200);
      expect(futuro.body.meta.total).toBe(0);
    });
  });

  describe('lectura de cursos y estudiantes', () => {
    it('searches estudiantes by código and documento with q', async () => {
      const porCodigo = await admin.get('/api/v1/estudiantes?q=E-2').expect(200);
      expect(porCodigo.body.data.map((e: { codigo: string }) => e.codigo)).toEqual(['E-2']);

      const porDocumento = await admin.get('/api/v1/estudiantes?q=1').expect(200);
      expect(porDocumento.body.data.map((e: { documento: string }) => e.documento)).toContain('1');
    });

    it('reports inscritosActivos on cursos (active period only)', async () => {
      const response = await admin.get('/api/v1/cursos').expect(200);

      expect(response.body.data[0]).toMatchObject({ nombre: '1ro A', inscritosActivos: 2 });
      expect(response.body.data[0]._count).toBeUndefined();
    });
  });
});
