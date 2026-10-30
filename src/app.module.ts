import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { createObserveModule } from '@nestjs/observe';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { PeriodoAcademicoModule } from './periodo-academico/periodo-academico.module.js';
import { CursoModule } from './curso/curso.module.js';
import { MateriaModule } from './materia/materia.module.js';
import { DocenteModule } from './docente/docente.module.js';
import { EstudianteModule } from './estudiante/estudiante.module.js';
import { InscripcionModule } from './inscripcion/inscripcion.module.js';
import { CalificacionModule } from './calificacion/calificacion.module.js';
import { AuthModule } from './auth/auth.module.js';
import { UsuarioModule } from './usuario/usuario.module.js';
import { DashboardModule } from './dashboard/dashboard.module.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Distributed tracing, auto-correlated logs, request/job metrics, error
    // telemetry, alarms, and more — out of the box. Sign up at https://observe.nestjs.com
    ObserveModule.forRoot({
      appKey: 'YOUR_APP_KEY',
      appSecret: 'YOUR_APP_SECRET',
      serviceId: 'backend-notas',
    }),
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 300 }],
      // The e2e suite hammers the API from a single address.
      skipIf: () => process.env.NODE_ENV === 'test',
    }),
    PrismaModule,
    AuthModule,
    UsuarioModule,
    DashboardModule,
    PeriodoAcademicoModule,
    CursoModule,
    MateriaModule,
    DocenteModule,
    EstudianteModule,
    InscripcionModule,
    CalificacionModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
