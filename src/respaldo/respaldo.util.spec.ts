import { gzipSync } from 'node:zlib';
import { desempaquetar, empaquetar, nombreArchivo, RespaldoInvalidoError, TABLAS, type Tabla } from './respaldo.util.js';

const vacias = () => Object.fromEntries(TABLAS.map((t) => [t, []])) as Record<Tabla, Record<string, unknown>[]>;

describe('respaldo.util', () => {
  it('empaqueta y desempaqueta sin perder datos', () => {
    const tablas = vacias();
    tablas.curso = [{ id: 1, nombre: '1ro A' }];
    const archivo = desempaquetar(empaquetar(tablas, new Date('2026-11-13T12:00:00Z')));
    expect(archivo.tablas.curso).toEqual([{ id: 1, nombre: '1ro A' }]);
    expect(archivo.conteos.curso).toBe(1);
    expect(archivo.generado).toBe('2026-11-13T12:00:00.000Z');
  });

  it('acepta también JSON sin comprimir', () => {
    const json = JSON.stringify({ version: 1, aplicacion: 'backend-notas', generado: 'x', conteos: {}, tablas: vacias() });
    expect(desempaquetar(Buffer.from(json)).version).toBe(1);
    expect(desempaquetar(gzipSync(Buffer.from(json))).version).toBe(1);
  });

  it('rechaza archivos ajenos, dañados, de otra versión o incompletos', () => {
    expect(() => desempaquetar(Buffer.from('hola'))).toThrow(RespaldoInvalidoError);
    expect(() => desempaquetar(Buffer.from([0x1f, 0x8b, 0, 1, 2]))).toThrow(/dañado/);
    expect(() => desempaquetar(Buffer.from(JSON.stringify({ aplicacion: 'otra' })))).toThrow(/este sistema/);
    expect(() => desempaquetar(Buffer.from(JSON.stringify({ aplicacion: 'backend-notas', version: 99 })))).toThrow(/versión/);
    const sinCursos = vacias() as Record<string, unknown>;
    delete sinCursos.curso;
    expect(() => desempaquetar(Buffer.from(JSON.stringify({ aplicacion: 'backend-notas', version: 1, tablas: sinCursos })))).toThrow(/curso/);
    const sinId = vacias();
    sinId.materia = [{ nombre: 'x' }];
    expect(() => desempaquetar(Buffer.from(JSON.stringify({ aplicacion: 'backend-notas', version: 1, tablas: sinId })))).toThrow(/sin id/);
  });

  it('nombra el archivo con fecha y hora', () => {
    expect(nombreArchivo(new Date(2026, 10, 13, 9, 5))).toBe('respaldo-academico-2026-11-13-0905.json.gz');
  });
});
