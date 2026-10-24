import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { createTestApp } from './helpers/create-test-app.js';
import { cleanDatabase } from './helpers/clean-db.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Materias (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await cleanDatabase(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/v1/materias creates a materia', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/materias')
      .send({ codigo: 'MAT-001', nombre: 'Matemática' })
      .expect(201);

    expect(response.body).toMatchObject({ codigo: 'MAT-001', estado: 'ACTIVA' });
  });
});
