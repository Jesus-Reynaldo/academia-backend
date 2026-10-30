import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { createTestApp } from './helpers/create-test-app.js';
import { cleanDatabase } from './helpers/clean-db.js';
import { adminAgent, agentFor, createUsuario, TEST_PASSWORD } from './helpers/auth.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Auth y usuarios (e2e)', () => {
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

  describe('POST /auth/login', () => {
    it('returns a token and the user for valid credentials', async () => {
      const admin = await createUsuario(prisma, { rol: 'ADMIN', email: 'admin@test.edu' });

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'ADMIN@test.edu', password: TEST_PASSWORD })
        .expect(200);

      expect(response.body).toMatchObject({
        tokenType: 'Bearer',
        usuario: { id: admin.id, email: 'admin@test.edu', rol: 'ADMIN' },
      });
      expect(response.body.accessToken).toEqual(expect.any(String));
      expect(response.body.usuario.passwordHash).toBeUndefined();
    });

    it('rejects a wrong password and an unknown email with the same 401', async () => {
      await createUsuario(prisma, { rol: 'ADMIN', email: 'admin@test.edu' });

      const wrongPassword = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'admin@test.edu', password: 'incorrecta' })
        .expect(401);
      const unknownEmail = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'nadie@test.edu', password: 'incorrecta' })
        .expect(401);

      expect(wrongPassword.body.message).toBe(unknownEmail.body.message);
    });

    it('rejects an inactive user', async () => {
      await createUsuario(prisma, { rol: 'ADMIN', email: 'admin@test.edu', activo: false });

      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'admin@test.edu', password: TEST_PASSWORD })
        .expect(401);
    });

    it('validates the body', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'no-es-email' })
        .expect(400);
    });
  });

  describe('token handling', () => {
    it('rejects requests without a token or with a malformed one', async () => {
      await request(app.getHttpServer()).get('/api/v1/estudiantes').expect(401);
      await request(app.getHttpServer())
        .get('/api/v1/estudiantes')
        .set('Authorization', 'Bearer basura')
        .expect(401);
    });

    it('revokes access as soon as the user is deactivated', async () => {
      const usuario = await createUsuario(prisma, { rol: 'ADMIN' });
      const api = agentFor(app, usuario.id);
      await api.get('/api/v1/auth/me').expect(200);

      await prisma.usuario.update({ where: { id: usuario.id }, data: { activo: false } });

      await api.get('/api/v1/auth/me').expect(401);
    });

    it('keeps GET / public', async () => {
      await request(app.getHttpServer()).get('/api/v1').expect(200);
    });
  });

  describe('GET /auth/me', () => {
    it('returns the profile name for a docente', async () => {
      const docente = await prisma.docente.create({
        data: { codigo: 'DOC-1', nombres: 'Ana', apellidos: 'García' },
      });
      const usuario = await createUsuario(prisma, { rol: 'DOCENTE', docenteId: docente.id });

      const response = await agentFor(app, usuario.id).get('/api/v1/auth/me').expect(200);

      expect(response.body).toMatchObject({
        rol: 'DOCENTE',
        docenteId: docente.id,
        estudianteId: null,
        nombre: 'Ana García',
      });
    });
  });

  describe('POST /auth/cambiar-password', () => {
    it('changes the password when the current one is correct', async () => {
      const usuario = await createUsuario(prisma, { rol: 'ADMIN', email: 'admin@test.edu' });
      const api = agentFor(app, usuario.id);

      await api
        .post('/api/v1/auth/cambiar-password')
        .send({ passwordActual: TEST_PASSWORD, passwordNueva: 'Nueva-Password-456' })
        .expect(204);

      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'admin@test.edu', password: TEST_PASSWORD })
        .expect(401);
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'admin@test.edu', password: 'Nueva-Password-456' })
        .expect(200);
    });

    it('rejects a wrong current password and a short new one', async () => {
      const usuario = await createUsuario(prisma, { rol: 'ADMIN' });
      const api = agentFor(app, usuario.id);

      await api
        .post('/api/v1/auth/cambiar-password')
        .send({ passwordActual: 'incorrecta', passwordNueva: 'Nueva-Password-456' })
        .expect(400);
      await api
        .post('/api/v1/auth/cambiar-password')
        .send({ passwordActual: TEST_PASSWORD, passwordNueva: 'corta' })
        .expect(400);
    });
  });

  describe('/usuarios', () => {
    it('lets an admin create a usuario linked to an estudiante, without exposing the hash', async () => {
      const api = await adminAgent(app, prisma);
      const estudiante = await prisma.estudiante.create({
        data: { codigo: 'E-1', nombres: 'Juan', apellidos: 'Pérez', documento: '1' },
      });

      const response = await api
        .post('/api/v1/usuarios')
        .send({
          email: 'Juan@Test.edu',
          password: 'Password-123',
          rol: 'ESTUDIANTE',
          estudianteId: estudiante.id,
        })
        .expect(201);

      expect(response.body).toMatchObject({
        email: 'juan@test.edu',
        rol: 'ESTUDIANTE',
        estudianteId: estudiante.id,
      });
      expect(response.body.passwordHash).toBeUndefined();
    });

    it('enforces the rol/link consistency', async () => {
      const api = await adminAgent(app, prisma);

      await api
        .post('/api/v1/usuarios')
        .send({ email: 'a@test.edu', password: 'Password-123', rol: 'ESTUDIANTE' })
        .expect(400);
      await api
        .post('/api/v1/usuarios')
        .send({ email: 'b@test.edu', password: 'Password-123', rol: 'DOCENTE', docenteId: 9999 })
        .expect(404);
      await api
        .post('/api/v1/usuarios')
        .send({ email: 'c@test.edu', password: 'Password-123', rol: 'ADMIN', docenteId: 1 })
        .expect(400);
    });

    it('returns 409 for a duplicate email', async () => {
      const api = await adminAgent(app, prisma);
      const body = { email: 'dup@test.edu', password: 'Password-123', rol: 'ADMIN' };

      await api.post('/api/v1/usuarios').send(body).expect(201);
      await api.post('/api/v1/usuarios').send(body).expect(409);
    });

    it('does not let an admin deactivate or delete their own account', async () => {
      const admin = await createUsuario(prisma, { rol: 'ADMIN' });
      const api = agentFor(app, admin.id);

      await api.patch(`/api/v1/usuarios/${admin.id}`).send({ activo: false }).expect(400);
      await api.delete(`/api/v1/usuarios/${admin.id}`).expect(400);
    });

    it('is forbidden to non-admins', async () => {
      const docente = await prisma.docente.create({
        data: { codigo: 'DOC-1', nombres: 'Ana', apellidos: 'García' },
      });
      const usuario = await createUsuario(prisma, { rol: 'DOCENTE', docenteId: docente.id });

      await agentFor(app, usuario.id).get('/api/v1/usuarios').expect(403);
    });
  });
});
