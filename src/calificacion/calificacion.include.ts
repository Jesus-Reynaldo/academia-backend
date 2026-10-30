import type { Prisma } from '@prisma/client';

// Lists return the names the UI needs so clients don't have to fetch them one by one.
export const CALIFICACION_INCLUDE = {
  materia: true,
  docente: true,
  inscripcion: { include: { estudiante: true, curso: true } },
} satisfies Prisma.CalificacionInclude;
