import { Module } from '@nestjs/common';
import { MateriaController } from './materia.controller.js';
import { MateriaService } from './materia.service.js';

@Module({
  controllers: [MateriaController],
  providers: [MateriaService],
  exports: [MateriaService],
})
export class MateriaModule {}
