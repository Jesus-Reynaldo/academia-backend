import { INestApplication } from '@nestjs/common';
import type request from 'supertest';
import type { App } from 'supertest/types';
import { createTestApp } from './helpers/create-test-app.js';
import { cleanDatabase } from './helpers/clean-db.js';
import { adminAgent } from './helpers/auth.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Historial académico (e2e)', () => {
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

  it('GET /api/v1/estudiantes/:id/historial-academico groups periodos, cursos and materias', async () => {
    const estudiante = await prisma.estudiante.create({
      data: { codigo: 'EST-0015', nombres: 'Juan', apellidos: 'Pérez', documento: '1' },
    });
    const curso = await prisma.curso.create({
      data: { nombre: '3ro Secundaria A', nivel: 'Secundaria' },
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
    await prisma.calificacion.create({
      data: { inscripcionId: inscripcion.id, materiaId: materia.id, nota: 85, tipo: 'PARCIAL' },
    });
    await prisma.calificacion.create({
      data: { inscripcionId: inscripcion.id, materiaId: materia.id, nota: 90, tipo: 'FINAL' },
    });

    const response = await api
      .get(`/api/v1/estudiantes/${estudiante.id}/historial-academico`)
      .expect(200);

    expect(response.body).toMatchObject({
      estudiante: { id: estudiante.id, codigo: 'EST-0015', nombre: 'Juan Pérez' },
      periodos: [
        {
          periodo: 'Gestión 2026',
          curso: '3ro Secundaria A',
          materias: [
            {
              materia: 'Matemática',
              calificaciones: [
                { tipo: 'PARCIAL', nota: 85 },
                { tipo: 'FINAL', nota: 90 },
              ],
            },
          ],
        },
      ],
    });
  });

  it('returns 404 for a non-existent estudiante', async () => {
    await api
      .get('/api/v1/estudiantes/9999/historial-academico')
      .expect(404);
  });
});
