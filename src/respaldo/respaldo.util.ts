import { gunzipSync, gzipSync } from 'node:zlib';

/** Versión del formato del archivo. Si cambia el esquema, se sube y se rechazan los archivos viejos. */
export const VERSION_RESPALDO = 1;

/**
 * Tablas del respaldo, en el orden en que se INSERTAN al restaurar (padres antes que hijos).
 * Para borrar se recorre al revés.
 */
export const TABLAS = [
  'periodoAcademico',
  'curso',
  'materia',
  'docente',
  'estudiante',
  'inscripcion',
  'calificacion',
  'usuario',
  'bitacora',
] as const;

export type Tabla = (typeof TABLAS)[number];

export interface ArchivoRespaldo {
  version: number;
  aplicacion: 'backend-notas';
  generado: string;
  conteos: Record<Tabla, number>;
  tablas: Record<Tabla, Record<string, unknown>[]>;
}

/** Arma el archivo y lo comprime con gzip (un respaldo de ~25 000 notas pesa menos de 1 MB). */
export function empaquetar(tablas: Record<Tabla, Record<string, unknown>[]>, fecha = new Date()): Buffer {
  const conteos = Object.fromEntries(TABLAS.map((t) => [t, tablas[t].length])) as Record<Tabla, number>;
  const archivo: ArchivoRespaldo = {
    version: VERSION_RESPALDO,
    aplicacion: 'backend-notas',
    generado: fecha.toISOString(),
    conteos,
    tablas,
  };
  return gzipSync(Buffer.from(JSON.stringify(archivo), 'utf8'));
}

/** Nombre del archivo: respaldo-academico-2026-11-13-2350.json.gz (hora local del servidor). */
export function nombreArchivo(fecha = new Date()): string {
  const d = (n: number) => String(n).padStart(2, '0');
  return `respaldo-academico-${fecha.getFullYear()}-${d(fecha.getMonth() + 1)}-${d(fecha.getDate())}-${d(fecha.getHours())}${d(fecha.getMinutes())}.json.gz`;
}

export class RespaldoInvalidoError extends Error {}

/**
 * Lee un archivo subido (gzip o JSON plano) y comprueba que sea un respaldo de este sistema y de esta versión,
 * con todas las tablas y filas con id. No toca la base: si algo no cuadra, se rechaza antes de borrar nada.
 */
export function desempaquetar(contenido: Buffer): ArchivoRespaldo {
  let texto: string;
  try {
    const esGzip = contenido.length > 2 && contenido[0] === 0x1f && contenido[1] === 0x8b;
    texto = (esGzip ? gunzipSync(contenido) : contenido).toString('utf8');
  } catch {
    throw new RespaldoInvalidoError('El archivo está dañado o no es un respaldo.');
  }
  let datos: Partial<ArchivoRespaldo>;
  try {
    datos = JSON.parse(texto) as Partial<ArchivoRespaldo>;
  } catch {
    throw new RespaldoInvalidoError('El archivo no es un respaldo válido (no es JSON).');
  }
  if (datos?.aplicacion !== 'backend-notas') {
    throw new RespaldoInvalidoError('El archivo no es un respaldo de este sistema.');
  }
  if (datos.version !== VERSION_RESPALDO) {
    throw new RespaldoInvalidoError(`El respaldo es de otra versión (${String(datos.version)}); se esperaba la ${VERSION_RESPALDO}.`);
  }
  const tablas = datos.tablas as ArchivoRespaldo['tablas'] | undefined;
  for (const t of TABLAS) {
    const filas = tablas?.[t];
    if (!Array.isArray(filas)) throw new RespaldoInvalidoError(`Falta la tabla «${t}» en el respaldo.`);
    if (filas.some((f) => typeof f !== 'object' || f === null || typeof f.id !== 'number')) {
      throw new RespaldoInvalidoError(`La tabla «${t}» tiene filas sin id.`);
    }
  }
  return datos as ArchivoRespaldo;
}
