import { urlPublica } from './despertador.service.js';
import { describirConfiguracion } from '../bitacora/bitacora.util.js';

describe('urlPublica', () => {
  it('usa RENDER_EXTERNAL_URL (sin barra final) en Render', () => {
    expect(
      urlPublica({ RENDER_EXTERNAL_URL: 'https://notas.onrender.com/' }),
    ).toEqual({
      url: 'https://notas.onrender.com',
      publica: true,
    });
  });

  it('usa URL_PUBLICA si Render no definió la suya', () => {
    expect(
      urlPublica({ URL_PUBLICA: 'https://mi-api.onrender.com' }).publica,
    ).toBe(true);
  });

  it('en la PC cae a localhost y avisa que no es pública', () => {
    expect(urlPublica({ PORT: '3001' })).toEqual({
      url: 'http://localhost:3001',
      publica: false,
    });
  });
});

describe('describirConfiguracion (despertador)', () => {
  it('describe encender, apagar y probar', () => {
    // Cuenta lo que quedó guardado (la respuesta), no lo que se envió.
    expect(
      describirConfiguracion(
        'PATCH',
        'despertador',
        { activo: true },
        { activo: 'si' },
      ),
    ).toBe('Despertador encendido');
    expect(
      describirConfiguracion('PATCH', 'despertador', { activo: false }, {}),
    ).toBe('Despertador apagado');
    expect(describirConfiguracion('POST', 'despertador', {}, {})).toBe(
      'Despertador: prueba manual',
    );
  });
});
