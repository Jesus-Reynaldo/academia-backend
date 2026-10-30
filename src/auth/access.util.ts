import { ForbiddenException } from '@nestjs/common';
import type { AuthUser } from './auth.types.js';

const OWN_DATA_ONLY = 'Solo puede acceder a su propia información';

/** An ESTUDIANTE may only touch their own student record; other roles pass. */
export function assertEstudianteAccess(user: AuthUser, estudianteId: number): void {
  if (user.rol === 'ESTUDIANTE' && user.estudianteId !== estudianteId) {
    throw new ForbiddenException(OWN_DATA_ONLY);
  }
}

/** A DOCENTE may only touch their own teacher record; other roles pass. */
export function assertDocenteAccess(user: AuthUser, docenteId: number): void {
  if (user.rol === 'DOCENTE' && user.docenteId !== docenteId) {
    throw new ForbiddenException(OWN_DATA_ONLY);
  }
}
