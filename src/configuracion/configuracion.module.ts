import { Module } from '@nestjs/common';
import { ConfiguracionController } from './configuracion.controller.js';
import { ConfiguracionService } from './configuracion.service.js';
import { DespertadorService } from './despertador.service.js';

@Module({
  controllers: [ConfiguracionController],
  providers: [ConfiguracionService, DespertadorService],
})
export class ConfiguracionModule {}
