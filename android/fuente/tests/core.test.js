'use strict';
const assert = require('node:assert/strict');
const C = require('../assets/core.js');
let count = 0;
function test(name, fn) { fn(); count++; console.log('OK ' + name); }
const now = Date.parse('2026-10-20T01:30:00Z');
test('seis plazas: máscara 15, tres libres y tres ocupadas', () => {
  const state = C.normalizeState(C.makeDemo(1, now, 0), 1);
  assert.deepEqual(C.summary(state, now), { libre: 3, ocupado: 3, desconocido: 0, total: 6 });
});
test('una lectura vencida nunca se presenta como libre', () => {
  const state = C.makeDemo(1, now, 0);
  assert.equal(C.summary(state, now + 20001).desconocido, 6);
  assert.equal(C.summary(state, now + 20001).libre, 0);
});
test('descargar otra vez el mismo estado no renueva su fecha', () => {
  const state = C.normalizeState(JSON.parse(JSON.stringify(C.makeDemo(1, now, 0))), 1);
  assert.equal(C.summary(state, now + 90000).libre, 0);
});
test('fecha futura o de plaza vieja invalida su disponibilidad', () => {
  const state = C.makeDemo(1, now, 0);
  state.plazas[0].actualizado_en = new Date(now + 6000).toISOString();
  assert.equal(C.effectiveState(state.plazas[0], state, now), 'desconocido');
  state.plazas[1].actualizado_en = new Date(now - 60000).toISOString();
  assert.equal(C.effectiveState(state.plazas[1], state, now), 'desconocido');
});
test('rechaza datos de otro grupo, ids repetidos y coordenadas inválidas', () => {
  assert.throws(() => C.normalizeState(C.makeDemo(2, now, 0), 1));
  const duplicate = C.makeDemo(1, now, 0); duplicate.plazas[1].id = duplicate.plazas[0].id;
  assert.throws(() => C.normalizeState(duplicate, 1));
  const coords = C.makeDemo(1, now, 0); coords.plazas[0].lat = 100;
  assert.throws(() => C.normalizeState(coords, 1));
});
test('las plazas E001 a E006 sin coordenadas usan el diseño propuesto de la UCU', () => {
  const state = C.makeDemo(1, now, 0); state.plazas[0].lat = null; state.plazas[0].lon = null;
  const normalized = C.normalizeState(state, 1).plazas[0];
  assert.ok(Math.abs(normalized.lat - (-31.389172)) < .001);
  assert.ok(Math.abs(normalized.lon - (-57.958842)) < .001);
  state.plazas[0].id = 'SIN-GEOMETRIA';
  assert.equal(C.normalizeState(state, 1).plazas[0].lat, null);
});
test('no admite estados inventados ni fechas sin zona horaria', () => {
  const state = C.makeDemo(1, now, 0); state.plazas[0].estado = 'disponible';
  assert.throws(() => C.normalizeState(state, 1));
  state.plazas[0].estado = 'libre'; state.plazas[0].actualizado_en = '2026-10-20T01:30:00';
  assert.throws(() => C.normalizeState(state, 1));
});
test('el historial se ordena por fecha y valida cada evento', () => {
  const events = [{ plaza_id:'E001', estado:'libre', fecha:'2026-10-20T01:20:00Z' }, { plaza_id:'E002', estado:'ocupado', fecha:'2026-10-20T01:30:00Z' }];
  assert.equal(C.normalizeHistory({ eventos:events })[0].plaza_id, 'E002');
  assert.throws(() => C.normalizeHistory({ eventos:[{ plaza_id:'E001', estado:'otro', fecha:events[0].fecha }] }));
});
test('la conexión exige HTTPS y nunca acepta credenciales en la URL', () => {
  assert.throws(() => C.validateConfig({ servidor:'http://example.com', grupo:1, demo:false }));
  assert.throws(() => C.validateConfig({ servidor:'https://user:pass@example.com', grupo:1, demo:false }));
  assert.throws(() => C.validateConfig({ servidor:'https://example.com/?token=secret', grupo:1, demo:false }));
  assert.throws(() => C.validateConfig({ servidor:'', grupo:1, demo:false }));
  assert.deepEqual(C.validateConfig({ servidor:'https://example.com/', grupo:'4', demo:false }), { servidor:'https://example.com', grupo:4, demo:false });
});
test('los cuatro equipos tienen una demo válida e independiente', () => {
  for (let group = 1; group <= 4; group++) {
    const state = C.normalizeState(C.makeDemo(group, now, 0), group);
    assert.equal(state.simulado, true); assert.equal(C.summary(state, now).total, 6);
  }
});
console.log(count + ' pruebas aprobadas.');
