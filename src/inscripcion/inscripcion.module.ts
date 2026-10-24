import { Module } from '@nestjs/common';
import { InscripcionController } from './inscripcion.controller.js';
import { InscripcionService } from './inscripcion.service.js';

@Module({
  controllers: [InscripcionController],
  providers: [InscripcionService],
  exports: [InscripcionService],
})
export class InscripcionModule {}
