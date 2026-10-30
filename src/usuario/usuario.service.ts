import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Usuario } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { paginate } from '../common/pagination.util.js';
import { hashPassword } from '../auth/password.util.js';
import type { AuthUser } from '../auth/auth.types.js';
import { CreateUsuarioDto } from './dto/create-usuario.dto.js';
import { UpdateUsuarioDto } from './dto/update-usuario.dto.js';
import { UsuarioQueryDto } from './dto/usuario-query.dto.js';

const SORTABLE_FIELDS = new Set(['id', 'email', 'rol', 'createdAt']);
const PRISMA_UNIQUE_CONSTRAINT = 'P2002';

type PublicUsuario = Omit<Usuario, 'passwordHash'>;

function withoutHash({ passwordHash: _passwordHash, ...rest }: Usuario): PublicUsuario {
  return rest;
}

@Injectable()
export class UsuarioService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUsuarioDto) {
    await this.assertRolLink(dto);

    try {
      const usuario = await this.prisma.usuario.create({
        data: {
          email: dto.email.toLowerCase(),
          passwordHash: await hashPassword(dto.password),
          rol: dto.rol,
          estudianteId: dto.estudianteId,
          docenteId: dto.docenteId,
        },
      });
      return withoutHash(usuario);
    } catch (error) {
      throw this.mapUniqueViolation(error);
    }
  }

  async findAll(query: UsuarioQueryDto) {
    const sortBy = query.sortBy && SORTABLE_FIELDS.has(query.sortBy) ? query.sortBy : 'id';

    const result = await paginate(this.prisma.usuario, {
      where: { rol: query.rol },
      orderBy: { [sortBy]: query.order ?? 'asc' },
      page: query.page,
      limit: query.limit,
    });
    return { ...result, data: result.data.map(withoutHash) };
  }

  async findOne(id: number) {
    const usuario = await this.prisma.usuario.findUnique({ where: { id } });
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return withoutHash(usuario);
  }

  async update(id: number, dto: UpdateUsuarioDto, actor: AuthUser) {
    await this.findOne(id);
    if (id === actor.id && dto.activo === false) {
      throw new BadRequestException('No puede desactivar su propia cuenta');
    }

    try {
      const usuario = await this.prisma.usuario.update({
        where: { id },
        data: {
          email: dto.email?.toLowerCase(),
          activo: dto.activo,
          passwordHash: dto.password ? await hashPassword(dto.password) : undefined,
        },
      });
      return withoutHash(usuario);
    } catch (error) {
      throw this.mapUniqueViolation(error);
    }
  }

  async remove(id: number, actor: AuthUser) {
    await this.findOne(id);
    if (id === actor.id) {
      throw new BadRequestException('No puede eliminar su propia cuenta');
    }
    await this.prisma.usuario.delete({ where: { id } });
  }

  /** ESTUDIANTE needs an existing estudiante, DOCENTE a docente, ADMIN neither. */
  private async assertRolLink(dto: CreateUsuarioDto) {
    const { rol, estudianteId, docenteId } = dto;

    if (rol === 'ESTUDIANTE') {
      if (estudianteId == null || docenteId != null) {
        throw new BadRequestException('Un usuario ESTUDIANTE requiere solo estudianteId');
      }
      const estudiante = await this.prisma.estudiante.findUnique({ where: { id: estudianteId } });
      if (!estudiante) {
        throw new NotFoundException('Estudiante no encontrado');
      }
    } else if (rol === 'DOCENTE') {
      if (docenteId == null || estudianteId != null) {
        throw new BadRequestException('Un usuario DOCENTE requiere solo docenteId');
      }
      const docente = await this.prisma.docente.findUnique({ where: { id: docenteId } });
      if (!docente) {
        throw new NotFoundException('Docente no encontrado');
      }
    } else if (estudianteId != null || docenteId != null) {
      throw new BadRequestException('Un usuario ADMIN no se vincula a estudiante ni docente');
    }
  }

  private mapUniqueViolation(error: unknown): unknown {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === PRISMA_UNIQUE_CONSTRAINT
    ) {
      return new ConflictException(
        'El email ya está registrado o el estudiante/docente ya tiene un usuario',
      );
    }
    return error;
  }
}
