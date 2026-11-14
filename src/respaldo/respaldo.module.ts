import { Module } from '@nestjs/common';
import { RespaldoController } from './respaldo.controller.js';
import { RespaldoService } from './respaldo.service.js';

@Module({
  controllers: [RespaldoController],
  providers: [RespaldoService],
})
export class RespaldoModule {}
