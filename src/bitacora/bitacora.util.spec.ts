import { randomBytes } from 'node:crypto';
import {
  accionBitacora,
  describirRegistro,
  rutaBitacora,
} from './bitacora.util.js';

// Valor al azar: en el repositorio no van contraseñas literales (las detecta el escáner de secretos).
const CLAVE_DE_PRUEBA = randomBytes(12).toString('base64url');

describe('rutaBitacora', () => {
  it('toma el recurso y el id de la URL', () => {
    expect(rutaBitacora('PATCH', '/api/v1/estudiantes/5?x=1')).toEqual({
      recurso: 'estudiantes',
      recursoId: 5,
      subruta: null,
    });
    expect(rutaBitacora('POST', '/api/v1/periodos-academicos')).toEqual({
      recurso: 'periodos-academicos',
      recursoId: null,
      subruta: null,
    });
    expect(rutaBitacora('PUT', '/api/v1/configuracion/logo')).toEqual({
      recurso: 'configuracion',
      recursoId: null,
      subruta: 'logo',
    });
  });

  it('ignora lecturas y recursos que no se registran', () => {
    expect(rutaBitacora('GET', '/api/v1/estudiantes')).toBeNull();
    expect(rutaBitacora('POST', '/api/v1/auth/login')).toBeNull();
    expect(rutaBitacora('POST', '/api/v1/bitacora')).toBeNull();
  });
});

describe('accionBitacora', () => {
  it('distingue crear, modificar, desactivar y eliminar', () => {
    expect(accionBitacora('POST', {}, 201)).toBe('CREAR');
    expect(accionBitacora('PATCH', { telefono: '7' }, 200)).toBe('MODIFICAR');
    expect(accionBitacora('PATCH', { estado: 'INACTIVO' }, 200)).toBe(
      'DESACTIVAR',
    );
    expect(accionBitacora('PATCH', { estado: 'INACTIVA' }, 200)).toBe(
      'DESACTIVAR',
    );
    expect(accionBitacora('PATCH', { activo: false }, 200)).toBe('DESACTIVAR');
    expect(accionBitacora('DELETE', undefined, 200)).toBe('DESACTIVAR');
    expect(accionBitacora('DELETE', undefined, 204)).toBe('ELIMINAR');
  });
});

describe('describirRegistro', () => {
  it('describe personas, nombres, cuentas y notas', () => {
    expect(
      describirRegistro({ id: 1, nombres: 'Juan', apellidos: 'Pérez' }, {}),
    ).toBe('Juan Pérez');
    expect(describirRegistro({ id: 2, nombre: '3ro Secundaria A' }, {})).toBe(
      '3ro Secundaria A',
    );
    expect(
      describirRegistro(
        { id: 3, email: 'a@b.edu' },
        { password: CLAVE_DE_PRUEBA },
      ),
    ).toBe('a@b.edu');
    expect(
      describirRegistro(
        { id: 4, nota: 78, materia: { nombre: 'Matemática' } },
        {},
      ),
    ).toBe('Nota 78 · Matemática');
  });

  it('describe inscripciones y cambios de estado', () => {
    const inscripcion = {
      id: 9,
      estudiante: { nombres: 'Ana', apellidos: 'Rojas' },
      curso: { nombre: '1ro A' },
    };
    expect(describirRegistro(inscripcion, { estado: 'RETIRADA' })).toBe(
      'Ana Rojas en 1ro A → RETIRADA',
    );
  });

  it('nunca supera 255 caracteres y tolera respuestas vacías (DELETE 204)', () => {
    expect(describirRegistro({ nombre: 'x'.repeat(400) }, {})).toHaveLength(
      255,
    );
    expect(describirRegistro(undefined, {})).toBe('Registro');
  });
});
