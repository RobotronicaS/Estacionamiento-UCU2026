const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ParkingCore = require('../android/fuente/assets/core.js');

const cliente = readFileSync(path.join(__dirname, '../rpi/web/cliente-web.js'), 'utf8');

function navegador(grupo, primerIntentoFalla = false) {
  const elementos = new Map();
  const rutas = [];
  const resultados = [];
  let falloPendiente = primerIntentoFalla;
  function elemento(id) {
    if (!elementos.has(id)) {
      elementos.set(id, {
        addEventListener(evento, accion) { this[evento] = accion; },
        removeEventListener(evento) { delete this[evento]; }
      });
    }
    return elementos.get(id);
  }
  const contexto = {
    AbortController, setTimeout, clearTimeout,
    location: { protocol: 'https:', origin: 'https://equipo' + grupo + '.example.test' },
    document: {
      getElementById: elemento, querySelector: elemento,
      createElement: () => ({}),
      head: {
        appendChild(script) {
          assert.equal(script.src, 'app.js');
          script.onload();
        }
      }
    },
    async fetch(ruta, opciones) {
      assert.equal(opciones.redirect, 'error');
      assert.equal(opciones.credentials, 'omit');
      rutas.push(ruta);
      if (ruta === '/' && falloPendiente) {
        falloPendiente = false;
        return { ok: false, status: 503 };
      }
      let cuerpo = { grupo };
      if (ruta.startsWith('/api/estado')) cuerpo = ParkingCore.makeDemo(grupo, Date.now(), 0);
      if (ruta.startsWith('/api/historial')) cuerpo = { eventos: [] };
      return { ok: true, text: async () => JSON.stringify(cuerpo) };
    },
    receiveNativeResult(resultado) { resultados.push(resultado); }
  };
  contexto.window = contexto;
  vm.runInNewContext(cliente, contexto);
  return { contexto, elemento, rutas, resultados };
}

(async () => {
  for (const grupo of [1, 2, 3, 4]) {
    const falloInicial = grupo === 4;
    const { contexto, elemento, rutas, resultados } = navegador(grupo, falloInicial);
    await new Promise(setImmediate);
    if (falloInicial) {
      assert.match(elemento('error-text').textContent, /503/);
      assert.equal(elemento('refresh').disabled, false);
      await elemento('refresh').click();
    }
    assert.deepEqual(JSON.parse(contexto.AppNative.getConfig()), {
      servidor: contexto.location.origin, grupo, demo: false
    });
    await contexto.AppNative.requestUpdate('r1');
    const consultas = [ '/', '/api/estado?grupo=' + grupo, '/api/historial?grupo=' + grupo + '&limite=60' ];
    assert.deepEqual(rutas, falloInicial ? ['/'].concat(consultas) : consultas);
    assert.equal(resultados[0].request_id, 'r1');
    assert.equal(resultados[0].ok, true);
    assert.equal(resultados[0].estado.grupo, grupo);
    assert.equal(resultados[0].estado.plazas.length, 6);
    assert.equal(elemento('settings-form').hidden, true);
  }
  console.log('OK iPhone: enlace del grupo, seis plazas por API compartida y reintento.');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
