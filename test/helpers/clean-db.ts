import type { PrismaService } from '../../src/prisma/prisma.service.js';

export async function cleanDatabase(prisma: PrismaService) {
  await prisma.calificacion.deleteMany();
  await prisma.inscripcion.deleteMany();
  await prisma.estudiante.deleteMany();
  await prisma.docente.deleteMany();
  await prisma.materia.deleteMany();
  await prisma.curso.deleteMany();
  await prisma.periodoAcademico.deleteMany();
}
