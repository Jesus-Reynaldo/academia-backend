import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { RolUsuario } from '@prisma/client';
import request from 'supertest';
import { hashPassword } from '../../src/auth/password.util.js';
import type { PrismaService } from '../../src/prisma/prisma.service.js';

export const TEST_PASSWORD = 'Password-123';

let counter = 0;

export async function createUsuario(
  prisma: PrismaService,
  data: {
    rol: RolUsuario;
    email?: string;
    estudianteId?: number;
    docenteId?: number;
    activo?: boolean;
  },
) {
  counter += 1;
  return prisma.usuario.create({
    data: {
      email: data.email ?? `${data.rol.toLowerCase()}-${counter}@test.edu`,
      passwordHash: await hashPassword(TEST_PASSWORD),
      rol: data.rol,
      estudianteId: data.estudianteId,
      docenteId: data.docenteId,
      activo: data.activo,
    },
  });
}

/** Supertest agent that sends a valid bearer token for the given user on every request. */
export function agentFor(app: INestApplication, usuarioId: number) {
  const token = app.get(JwtService, { strict: false }).sign({ sub: usuarioId });
  return request.agent(app.getHttpServer()).set('Authorization', `Bearer ${token}`);
}

/** Call after cleanDatabase(): it wipes the usuarios table, so the admin is recreated per test. */
export async function adminAgent(app: INestApplication, prisma: PrismaService) {
  const admin = await createUsuario(prisma, { rol: 'ADMIN' });
  return agentFor(app, admin.id);
}
