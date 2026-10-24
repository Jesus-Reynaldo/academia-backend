import { Module } from '@nestjs/common';
import { DocenteController } from './docente.controller.js';
import { DocenteService } from './docente.service.js';

@Module({
  controllers: [DocenteController],
  providers: [DocenteService],
  exports: [DocenteService],
})
export class DocenteModule {}
