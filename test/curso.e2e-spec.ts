import { INestApplication } from '@nestjs/common';
import type request from 'supertest';
import type { App } from 'supertest/types';
import { createTestApp } from './helpers/create-test-app.js';
import { cleanDatabase } from './helpers/clean-db.js';
import { adminAgent } from './helpers/auth.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Cursos (e2e)', () => {
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

  it('POST /api/v1/cursos creates a curso', async () => {
    const response = await api
      .post('/api/v1/cursos')
      .send({ nombre: '1ro Secundaria A', nivel: 'Secundaria', capacidad: 30 })
      .expect(201);

    expect(response.body).toMatchObject({ nombre: '1ro Secundaria A', estado: 'ACTIVO' });
  });
});
