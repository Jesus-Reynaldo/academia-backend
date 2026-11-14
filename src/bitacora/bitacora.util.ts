import type { AccionBitacora } from '@prisma/client';

/** Recursos que se registran (el primer segmento de la ruta bajo /api/v1). */
export const RECURSOS_BITACORA = [
  'estudiantes',
  'docentes',
  'usuarios',
  'cursos',
  'materias',
  'periodos-academicos',
  'inscripciones',
  'calificaciones',
  'configuracion',
] as const;

const METODOS = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);
const ESTADOS_INACTIVOS = new Set(['INACTIVO', 'INACTIVA']);

export interface RutaBitacora {
  recurso: string;
  recursoId: number | null;
  /** Segundo segmento cuando no es un id (p. ej. «logo» en /configuracion/logo). */
  subruta: string | null;
}

/**
 * Recurso e id a partir de la URL: `/api/v1/estudiantes/5?x=1` → { recurso: 'estudiantes', recursoId: 5 }.
 * Devuelve null si el método no modifica datos o el recurso no se registra (login, bitácora, dashboard).
 */
export function rutaBitacora(metodo: string, url: string): RutaBitacora | null {
  if (!METODOS.has(metodo.toUpperCase())) return null;
  const segmentos = url.split('?')[0].split('/').filter(Boolean);
  const v1 = segmentos.indexOf('v1');
  const [recurso, id] = v1 >= 0 ? segmentos.slice(v1 + 1) : segmentos;
  if (!recurso || !(RECURSOS_BITACORA as readonly string[]).includes(recurso))
    return null;
  const recursoId = id !== undefined && /^\d+$/.test(id) ? Number(id) : null;
  return {
    recurso,
    recursoId,
    subruta: id !== undefined && recursoId === null ? id : null,
  };
}

/**
 * Acción según el método y lo enviado: un PATCH que pone el estado en INACTIVO/INACTIVA o `activo: false`
 * es una desactivación; un DELETE que responde 200 desactivó (el registro tenía dependencias) y uno 204 eliminó.
 */
export function accionBitacora(
  metodo: string,
  cuerpo: unknown,
  status: number,
): AccionBitacora {
  const m = metodo.toUpperCase();
  if (m === 'POST') return 'CREAR';
  if (m === 'DELETE') return status === 200 ? 'DESACTIVAR' : 'ELIMINAR';
  const datos = (cuerpo ?? {}) as { estado?: unknown; activo?: unknown };
  if (
    (typeof datos.estado === 'string' && ESTADOS_INACTIVOS.has(datos.estado)) ||
    datos.activo === false
  ) {
    return 'DESACTIVAR';
  }
  return 'MODIFICAR';
}

type Registro = Record<string, unknown> | null | undefined;

const texto = (v: unknown) =>
  typeof v === 'string' && v.trim() ? v.trim() : null;

/**
 * Descripción legible del registro afectado, tomada de la respuesta del endpoint (nunca del cuerpo enviado,
 * así no se guardan contraseñas). Ej.: «Juan Pérez», «3ro Secundaria A», «admin@colegio.edu», «Nota 78 · Matemática».
 */
export function describirRegistro(respuesta: unknown, cuerpo: unknown): string {
  const r = (
    respuesta && typeof respuesta === 'object' ? respuesta : {}
  ) as Record<string, unknown>;
  const persona = (p: Registro) =>
    p && texto(p.nombres) && texto(p.apellidos)
      ? `${texto(p.nombres)} ${texto(p.apellidos)}`
      : null;

  let base =
    persona(r) ??
    texto(r.nombre) ??
    texto(r.email) ??
    (typeof r.nota === 'number'
      ? `Nota ${r.nota}${texto((r.materia as Registro)?.nombre) ? ` · ${texto((r.materia as Registro)?.nombre)}` : ''}`
      : null) ??
    (r.estudiante ? persona(r.estudiante as Registro) : null) ??
    (typeof r.id === 'number' ? `#${r.id}` : 'Registro');

  // Inscripción: a quién y en qué curso, si la respuesta lo trae.
  const curso = texto((r.curso as Registro)?.nombre);
  if (r.estudiante && curso)
    base = `${persona(r.estudiante as Registro) ?? base} en ${curso}`;

  // Cambio de estado explícito (p. ej. inscripción RETIRADA, período FINALIZADO).
  const estado = texto((cuerpo as Registro)?.estado);
  if (estado) base = `${base} → ${estado}`;

  return base.slice(0, 255);
}

/** Cambios de la configuración de la institución: «Logotipo nuevo», «Logotipo quitado» o «Nombre: …». */
export function describirConfiguracion(
  metodo: string,
  subruta: string | null,
  respuesta: unknown,
): string {
  if (subruta === 'logo')
    return metodo.toUpperCase() === 'DELETE'
      ? 'Logotipo quitado'
      : 'Logotipo nuevo';
  const r = (respuesta ?? {}) as {
    nombreInstitucion?: unknown;
    sigla?: unknown;
  };
  const nombre = texto(r.nombreInstitucion) ?? 'Institución';
  const sigla = texto(r.sigla);
  return `Nombre: ${nombre}${sigla ? ` (${sigla})` : ''}`.slice(0, 255);
}
