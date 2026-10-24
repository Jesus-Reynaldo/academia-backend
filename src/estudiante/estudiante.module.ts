import { Module } from '@nestjs/common';
import { EstudianteController } from './estudiante.controller.js';
import { EstudianteService } from './estudiante.service.js';

@Module({
  controllers: [EstudianteController],
  providers: [EstudianteService],
  exports: [EstudianteService],
})
export class EstudianteModule {}
