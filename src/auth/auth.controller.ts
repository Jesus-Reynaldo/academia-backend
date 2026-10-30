import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service.js';
import type { AuthUser } from './auth.types.js';
import { CurrentUser } from './current-user.decorator.js';
import { Public } from './public.decorator.js';
import { LoginDto } from './dto/login.dto.js';
import { CambiarPasswordDto } from './dto/cambiar-password.dto.js';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.service.login(dto);
  }

  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.service.me(user);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('cambiar-password')
  cambiarPassword(@CurrentUser() user: AuthUser, @Body() dto: CambiarPasswordDto) {
    return this.service.cambiarPassword(user, dto);
  }
}
