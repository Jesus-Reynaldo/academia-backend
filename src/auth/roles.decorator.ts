import { SetMetadata } from '@nestjs/common';
import type { RolUsuario } from '@prisma/client';

export const ROLES_KEY = 'roles';

/** Restricts a route to the given roles. Without it, any authenticated user may call it. */
export const Roles = (...roles: RolUsuario[]) => SetMetadata(ROLES_KEY, roles);
