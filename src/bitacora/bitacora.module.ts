import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { BitacoraController } from './bitacora.controller.js';
import { BitacoraInterceptor } from './bitacora.interceptor.js';
import { BitacoraService } from './bitacora.service.js';

@Module({
  controllers: [BitacoraController],
  providers: [
    BitacoraService,
    { provide: APP_INTERCEPTOR, useClass: BitacoraInterceptor },
  ],
})
export class BitacoraModule {}
