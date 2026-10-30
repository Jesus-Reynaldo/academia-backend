import { INestApplication } from '@nestjs/common';
import type request from 'supertest';
import type { App } from 'supertest/types';
import { createTestApp } from './helpers/create-test-app.js';
import { cleanDatabase } from './helpers/clean-db.js';
import { adminAgent } from './helpers/auth.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Calificaciones (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let api: ReturnType<typeof request.agent>;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await cleanDatabase(prisma);
    api = await adminAgent(app, prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  async function crearInscripcion() {
    const estudiante = await prisma.estudiante.create({
      data: { codigo: 'EST-0001', nombres: 'Juan', apellidos: 'Pérez', documento: '1' },
    });
    const curso = await prisma.curso.create({
      data: { nombre: '1ro Secundaria A', nivel: 'Secundaria' },
    });
    const periodo = await prisma.periodoAcademico.create({
      data: {
        nombre: 'Gestión 2026',
        fechaInicio: new Date('2026-02-01'),
        fechaFin: new Date('2026-11-30'),
      },
    });
    const materia = await prisma.materia.create({
      data: { codigo: 'MAT-001', nombre: 'Matemática' },
    });
    const inscripcion = await prisma.inscripcion.create({
      data: { estudianteId: estudiante.id, cursoId: curso.id, periodoAcademicoId: periodo.id },
    });
    return { inscripcion, materia };
  }

  it('POST /api/v1/calificaciones registers a calificacion', async () => {
    const { inscripcion, materia } = await crearInscripcion();

    const response = await api
      .post('/api/v1/calificaciones')
      .send({
        inscripcionId: inscripcion.id,
        materiaId: materia.id,
        nota: 85,
        tipo: 'PARCIAL',
      })
      .expect(201);

    expect(response.body).toMatchObject({ nota: 85, tipo: 'PARCIAL' });
  });

  it('rejects a nota out of range with 400', async () => {
    const { inscripcion, materia } = await crearInscripcion();

    await api
      .post('/api/v1/calificaciones')
      .send({ inscripcionId: inscripcion.id, materiaId: materia.id, nota: 150, tipo: 'PARCIAL' })
      .expect(400);
  });

  it('rejects an inexistent inscripcion with 404', async () => {
    const { materia } = await crearInscripcion();

    await api
      .post('/api/v1/calificaciones')
      .send({ inscripcionId: 9999, materiaId: materia.id, nota: 85, tipo: 'PARCIAL' })
      .expect(404);
  });

  it('rejects an inexistent materia with 404', async () => {
    const { inscripcion } = await crearInscripcion();

    await api
      .post('/api/v1/calificaciones')
      .send({ inscripcionId: inscripcion.id, materiaId: 9999, nota: 85, tipo: 'PARCIAL' })
      .expect(404);
  });
});
