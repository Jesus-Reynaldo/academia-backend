import { Injectable, type CallHandler, type ExecutionContext, type NestInterceptor } from '@nestjs/common';
import type { Request, Response } from 'express';
import { tap, type Observable } from 'rxjs';
import type { AuthUser } from '../auth/auth.types.js';
import { BitacoraService } from './bitacora.service.js';
import { accionBitacora, describirRegistro, rutaBitacora } from './bitacora.util.js';

/**
 * Registra en la bitácora cada POST/PATCH/PUT/DELETE exitoso sobre los recursos del sistema, con el usuario
 * que lo hizo. Es global (APP_INTERCEPTOR): los módulos existentes no cambian. Solo escribe si la operación
 * terminó bien y lo hace sin esperar (una inserción por cambio), así no agrega demora a la respuesta.
 */
@Injectable()
export class BitacoraInterceptor implements NestInterceptor {
  constructor(private readonly bitacora: BitacoraService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();
    const http = context.switchToHttp();
    const request = http.getRequest<Request & { user?: AuthUser }>();
    const ruta = rutaBitacora(request.method, request.originalUrl ?? request.url);
    if (!ruta) return next.handle();

    return next.handle().pipe(
      tap((respuesta: unknown) => {
        const status = http.getResponse<Response>().statusCode;
        const id = ruta.recursoId ?? ((respuesta as { id?: unknown } | undefined)?.id as number | undefined) ?? null;
        this.bitacora.registrar({
          usuarioId: request.user?.id ?? null,
          accion: accionBitacora(request.method, request.body, status),
          recurso: ruta.recurso,
          recursoId: typeof id === 'number' ? id : null,
          descripcion: describirRegistro(respuesta, request.body),
        });
      }),
    );
  }
}
