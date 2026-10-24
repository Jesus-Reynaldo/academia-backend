import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
    PrismaModule,
    PeriodoAcademicoModule,
    CursoModule,
    MateriaModule,
    DocenteModule,
    EstudianteModule,
    InscripcionModule,
    CalificacionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
