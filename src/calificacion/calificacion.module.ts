import { Module } from '@nestjs/common';
import { CalificacionController } from './calificacion.controller.js';
import { CalificacionService } from './calificacion.service.js';

@Module({
  controllers: [CalificacionController],
  providers: [CalificacionService],
  exports: [CalificacionService],
})
export class CalificacionModule {}
