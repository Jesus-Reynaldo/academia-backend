import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { assertDocenteAccess, assertEstudianteAccess } from '../auth/access.util.js';
import type { AuthUser } from '../auth/auth.types.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { Roles } from '../auth/roles.decorator.js';
import { DashboardService } from './dashboard.service.js';
import {
  DistribucionNotasQueryDto,
  EstudiantesEnRiesgoQueryDto,
  PeriodoQueryDto,
} from './dto/dashboard-query.dto.js';

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Roles('ADMIN')
  @Get('resumen')
  resumen() {
    return this.service.resumen();
  }

  @Roles('ADMIN')
  @Get('ocupacion-cursos')
  ocupacionCursos(@Query() query: PeriodoQueryDto) {
    return this.service.ocupacionCursos(query.periodoAcademicoId);
  }

  @Roles('ADMIN')
  @Get('promedios-por-curso')
  promediosPorCurso(@Query() query: PeriodoQueryDto) {
    return this.service.promediosPorCurso(query.periodoAcademicoId);
  }

  @Roles('ADMIN', 'DOCENTE')
  @Get('distribucion-notas')
  distribucionNotas(@Query() query: DistribucionNotasQueryDto, @CurrentUser() user: AuthUser) {
    return this.service.distribucionNotas({
      periodoAcademicoId: query.periodoAcademicoId,
      materiaId: query.materiaId,
      // A teacher sees the distribution of the grades they gave, not of everyone's.
      docenteId: user.rol === 'DOCENTE' ? (user.docenteId ?? -1) : undefined,
    });
  }

  @Roles('ADMIN')
  @Get('estudiantes-en-riesgo')
  estudiantesEnRiesgo(@Query() query: EstudiantesEnRiesgoQueryDto) {
    return this.service.estudiantesEnRiesgo(query);
  }

  @Roles('ADMIN', 'ESTUDIANTE')
  @Get('estudiantes/:id/resumen')
  resumenEstudiante(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    assertEstudianteAccess(user, id);
    return this.service.resumenEstudiante(id);
  }

  @Roles('ADMIN', 'DOCENTE')
  @Get('docentes/:id/resumen')
  resumenDocente(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    assertDocenteAccess(user, id);
    return this.service.resumenDocente(id);
  }
}
