import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service.js';
import type { AuthUser } from './auth.types.js';
import { LoginDto } from './dto/login.dto.js';
import { CambiarPasswordDto } from './dto/cambiar-password.dto.js';
import { hashPassword, verifyPassword } from './password.util.js';

const INVALID_CREDENTIALS = 'Credenciales inválidas';

@Injectable()
export class AuthService {
  // Verified when the email is unknown so both failures cost the same time.
  private dummyHash?: Promise<string>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    this.dummyHash ??= hashPassword('dummy-password');
    const hash = usuario?.passwordHash ?? (await this.dummyHash);
    const valid = await verifyPassword(dto.password, hash);

    if (!usuario || !valid || !usuario.activo) {
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    const accessToken = await this.jwt.signAsync({ sub: usuario.id });
    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: Number(this.config.get('JWT_EXPIRES_IN_SECONDS') ?? 3600),
      usuario: {
        id: usuario.id,
        email: usuario.email,
        rol: usuario.rol,
        estudianteId: usuario.estudianteId,
        docenteId: usuario.docenteId,
      },
    };
  }

  async me(user: AuthUser) {
    const usuario = await this.prisma.usuario.findUniqueOrThrow({
      where: { id: user.id },
      include: { estudiante: true, docente: true },
    });
    const perfil = usuario.estudiante ?? usuario.docente;

    return {
      id: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
      estudianteId: usuario.estudianteId,
      docenteId: usuario.docenteId,
      nombre: perfil ? `${perfil.nombres} ${perfil.apellidos}` : null,
    };
  }

  async cambiarPassword(user: AuthUser, dto: CambiarPasswordDto) {
    const usuario = await this.prisma.usuario.findUniqueOrThrow({ where: { id: user.id } });

    if (!(await verifyPassword(dto.passwordActual, usuario.passwordHash))) {
      throw new BadRequestException('La contraseña actual es incorrecta');
    }

    await this.prisma.usuario.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(dto.passwordNueva) },
    });
  }
}
