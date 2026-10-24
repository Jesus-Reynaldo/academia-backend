import { Module } from '@nestjs/common';
import { PeriodoAcademicoController } from './periodo-academico.controller.js';
import { PeriodoAcademicoService } from './periodo-academico.service.js';

@Module({
  controllers: [PeriodoAcademicoController],
  providers: [PeriodoAcademicoService],
  exports: [PeriodoAcademicoService],
})
export class PeriodoAcademicoModule {}
