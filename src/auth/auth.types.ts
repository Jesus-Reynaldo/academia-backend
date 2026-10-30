import type { RolUsuario } from '@prisma/client';

export interface AuthUser {
  id: number;
  email: string;
  rol: RolUsuario;
  estudianteId: number | null;
  docenteId: number | null;
}
