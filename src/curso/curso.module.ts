import { Module } from '@nestjs/common';
import { CursoController } from './curso.controller.js';
import { CursoService } from './curso.service.js';

@Module({
  controllers: [CursoController],
  providers: [CursoService],
  exports: [CursoService],
})
export class CursoModule {}
