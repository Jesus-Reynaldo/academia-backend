import { INestApplication } from '@nestjs/common';
import type request from 'supertest';
import type { App } from 'supertest/types';
import { createTestApp } from './helpers/create-test-app.js';
import { cleanDatabase } from './helpers/clean-db.js';
import { adminAgent } from './helpers/auth.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Estudiantes (e2e)', () => {
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

  it('POST /api/v1/estudiantes creates an estudiante', async () => {
    const response = await api
      .post('/api/v1/estudiantes')
      .send({
        codigo: 'EST-0001',
        nombres: 'Juan',
        apellidos: 'Pérez',
        documento: '12345678',
      })
      .expect(201);

    expect(response.body).toMatchObject({ codigo: 'EST-0001', estado: 'ACTIVO' });
  });

  it('GET /api/v1/estudiantes returns paginated results', async () => {
    await prisma.estudiante.create({
      data: { codigo: 'EST-0001', nombres: 'Juan', apellidos: 'Pérez', documento: '1' },
    });

    const response = await api
      .get('/api/v1/estudiantes?page=1&limit=10')
      .expect(200);

    expect(response.body.meta).toMatchObject({ page: 1, limit: 10, total: 1 });
    expect(response.body.data).toHaveLength(1);
  });

  it('GET /api/v1/estudiantes/:id returns 404 for a non-existent estudiante', async () => {
    const response = await api
      .get('/api/v1/estudiantes/9999')
      .expect(404);

    expect(response.body).toMatchObject({ statusCode: 404 });
  });
});
