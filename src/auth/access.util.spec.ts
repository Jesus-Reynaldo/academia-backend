import { ForbiddenException } from '@nestjs/common';
import type { AuthUser } from './auth.types.js';
import { assertDocenteAccess, assertEstudianteAccess } from './access.util.js';

const user = (overrides: Partial<AuthUser>): AuthUser => ({
  id: 1,
  email: 'x@test.edu',
  rol: 'ADMIN',
  estudianteId: null,
  docenteId: null,
  ...overrides,
});

describe('access.util', () => {
  describe('assertEstudianteAccess', () => {
    it('lets an estudiante reach their own id only', () => {
      const estudiante = user({ rol: 'ESTUDIANTE', estudianteId: 5 });

      expect(() => assertEstudianteAccess(estudiante, 5)).not.toThrow();
      expect(() => assertEstudianteAccess(estudiante, 6)).toThrow(ForbiddenException);
    });

    it('does not restrict admin or docente', () => {
      expect(() => assertEstudianteAccess(user({ rol: 'ADMIN' }), 6)).not.toThrow();
      expect(() =>
        assertEstudianteAccess(user({ rol: 'DOCENTE', docenteId: 1 }), 6),
      ).not.toThrow();
    });
  });

  describe('assertDocenteAccess', () => {
    it('lets a docente reach their own id only', () => {
      const docente = user({ rol: 'DOCENTE', docenteId: 3 });

      expect(() => assertDocenteAccess(docente, 3)).not.toThrow();
      expect(() => assertDocenteAccess(docente, 4)).toThrow(ForbiddenException);
    });

    it('does not restrict admin', () => {
      expect(() => assertDocenteAccess(user({ rol: 'ADMIN' }), 4)).not.toThrow();
    });
  });
});
