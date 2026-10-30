import { INestApplication } from '@nestjs/common';
import type request from 'supertest';
import type { App } from 'supertest/types';
import { createTestApp } from './helpers/create-test-app.js';
import { cleanDatabase } from './helpers/clean-db.js';
import { adminAgent } from './helpers/auth.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Inscripciones (e2e)', () => {
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

  async function crearFixtures(overrides?: {
    estudianteEstado?: string;
    cursoEstado?: string;
    cursoCapacidad?: number | null;
    periodoEstado?: string;
  }) {
    const estudiante = await prisma.estudiante.create({
      data: {
        codigo: 'EST-0001',
        nombres: 'Juan',
        apellidos: 'Pérez',
        documento: '12345678',
        estado: (overrides?.estudianteEstado as never) ?? 'ACTIVO',
      },
    });
    const curso = await prisma.curso.create({
      data: {
        nombre: '1ro Secundaria A',
        nivel: 'Secundaria',
        capacidad: overrides?.cursoCapacidad,
        estado: (overrides?.cursoEstado as never) ?? 'ACTIVO',
      },
    });
    const periodo = await prisma.periodoAcademico.create({
      data: {
        nombre: 'Gestión 2026',
        fechaInicio: new Date('2026-02-01'),
        fechaFin: new Date('2026-11-30'),
        estado: (overrides?.periodoEstado as never) ?? 'ACTIVO',
      },
    });
    return { estudiante, curso, periodo };
  }

  it('POST /api/v1/inscripciones creates an inscripcion', async () => {
    const { estudiante, curso, periodo } = await crearFixtures();

    const response = await api
      .post('/api/v1/inscripciones')
      .send({
        estudianteId: estudiante.id,
        cursoId: curso.id,
        periodoAcademicoId: periodo.id,
      })
      .expect(201);

    expect(response.body).toMatchObject({ estado: 'ACTIVA' });
  });

  it('rejects an inexistent estudiante with 404', async () => {
    const { curso, periodo } = await crearFixtures();

    await api
      .post('/api/v1/inscripciones')
      .send({ estudianteId: 9999, cursoId: curso.id, periodoAcademicoId: periodo.id })
      .expect(404);
  });

  it('rejects an inexistent curso with 404', async () => {
    const { estudiante, periodo } = await crearFixtures();

    await api
      .post('/api/v1/inscripciones')
      .send({ estudianteId: estudiante.id, cursoId: 9999, periodoAcademicoId: periodo.id })
      .expect(404);
  });

  it('rejects an inactive estudiante with 400', async () => {
    const { estudiante, curso, periodo } = await crearFixtures({
      estudianteEstado: 'INACTIVO',
    });

    await api
      .post('/api/v1/inscripciones')
      .send({ estudianteId: estudiante.id, cursoId: curso.id, periodoAcademicoId: periodo.id })
      .expect(400);
  });

  it('rejects an inactive curso with 400', async () => {
    const { estudiante, curso, periodo } = await crearFixtures({ cursoEstado: 'INACTIVO' });

    await api
      .post('/api/v1/inscripciones')
      .send({ estudianteId: estudiante.id, cursoId: curso.id, periodoAcademicoId: periodo.id })
      .expect(400);
  });

  it('rejects a duplicated inscripcion with 409', async () => {
    const { estudiante, curso, periodo } = await crearFixtures();
    const payload = {
      estudianteId: estudiante.id,
      cursoId: curso.id,
      periodoAcademicoId: periodo.id,
    };

    await api.post('/api/v1/inscripciones').send(payload).expect(201);
    await api.post('/api/v1/inscripciones').send(payload).expect(409);
  });

  it('rejects an inscripcion when the curso is full with 409', async () => {
    const { estudiante, curso, periodo } = await crearFixtures({ cursoCapacidad: 1 });
    const otroEstudiante = await prisma.estudiante.create({
      data: { codigo: 'EST-0002', nombres: 'Ana', apellidos: 'López', documento: '87654321' },
    });

    await api
      .post('/api/v1/inscripciones')
      .send({
        estudianteId: estudiante.id,
        cursoId: curso.id,
        periodoAcademicoId: periodo.id,
      })
      .expect(201);

    await api
      .post('/api/v1/inscripciones')
      .send({ estudianteId: otroEstudiante.id, cursoId: curso.id, periodoAcademicoId: periodo.id })
      .expect(409);
  });
});
