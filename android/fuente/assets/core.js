(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ParkingCore = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var UCU_COORDS = {"E001":[-31.38913786417535,-57.95895249347723],"E002":[-31.38913786417535,-57.95892513318763],"E003":[-31.38913786417535,-57.95889777289803],"E004":[-31.38913786417535,-57.95887041260843],"E005":[-31.38913786417535,-57.95884305231883],"E006":[-31.38913786417535,-57.958815692029226]};
  var STATES = ['libre', 'ocupado', 'desconocido'];
  function timestamp(value) {
    if (typeof value !== 'string' || !/T.*(?:Z|[+-]\d{2}:\d{2})$/.test(value)) return NaN;
    return Date.parse(value);
  }
  function finite(value) { return typeof value === 'number' && Number.isFinite(value); }
  function validateConfig(input) {
    var group = Number(input.grupo);
    if (!Number.isInteger(group) || group < 1 || group > 4) throw Error('Elegí un equipo del 1 al 4.');
    var url = String(input.servidor || '').trim().replace(/\/+$/, '');
    if (url) {
      var parsed;
      try { parsed = new URL(url); } catch (_) { throw Error('La dirección del servidor no es válida.'); }
      if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.search || parsed.hash)
        throw Error('Usá una dirección HTTPS sin contraseñas, parámetros ni #.');
    }
    if (!input.demo && !url) throw Error('Ingresá la dirección HTTPS que publica Cloudflare.');
    return { servidor: url, grupo: group, demo: !!input.demo };
  }
  function normalizeState(raw, expectedGroup) {
    if (!raw || raw.version !== 1 || raw.grupo !== expectedGroup || !Array.isArray(raw.plazas) || raw.plazas.length > 128)
      throw Error('El servidor no devuelve el formato esperado para este equipo.');
    if (typeof raw.simulado !== 'boolean' || typeof raw.fuente !== 'string' || !Number.isFinite(timestamp(raw.ultima_lectura)))
      throw Error('Faltan el origen o la fecha de la lectura.');
    var ttl = raw.vigencia_segundos;
    if (!Number.isInteger(ttl) || ttl < 1 || ttl > 300) throw Error('La vigencia debe estar entre 1 y 300 segundos.');
    var ids = new Set();
    var places = raw.plazas.map(function (p) {
      if (!p || typeof p.id !== 'string' || !p.id || p.id.length > 48 || ids.has(p.id)) throw Error('Identificadores de plazas inválidos o repetidos.');
      ids.add(p.id);
      if (STATES.indexOf(p.estado) < 0 || !Number.isFinite(timestamp(p.actualizado_en))) throw Error('Estado o fecha de plaza inválidos.');
      var hasCoordinates = p.lat !== null && p.lon !== null && p.lat !== undefined && p.lon !== undefined;
      if (hasCoordinates && (!finite(p.lat) || !finite(p.lon) || Math.abs(p.lat) > 85 || Math.abs(p.lon) > 180)) throw Error('Coordenadas inválidas.');
      return { id: p.id, nombre: String(p.nombre || p.id).slice(0, 100), zona: String(p.zona || 'Sin zona').slice(0, 100),
        lat: hasCoordinates ? p.lat : (UCU_COORDS[p.id] ? UCU_COORDS[p.id][0] : null), lon: hasCoordinates ? p.lon : (UCU_COORDS[p.id] ? UCU_COORDS[p.id][1] : null), estado: p.estado, actualizado_en: p.actualizado_en };
    });
    return { version: 1, grupo: raw.grupo, simulado: raw.simulado, fuente: raw.fuente.slice(0, 80),
      ultima_lectura: raw.ultima_lectura, vigencia_segundos: ttl, plazas: places };
  }
  function effectiveState(place, snapshot, now) {
    var oldest = Math.min(timestamp(place.actualizado_en), timestamp(snapshot.ultima_lectura));
    var newest = Math.max(timestamp(place.actualizado_en), timestamp(snapshot.ultima_lectura));
    if (!Number.isFinite(oldest) || newest > now + 5000 || now - oldest > snapshot.vigencia_segundos * 1000) return 'desconocido';
    return place.estado;
  }
  function summary(snapshot, now) {
    var result = { libre: 0, ocupado: 0, desconocido: 0, total: snapshot ? snapshot.plazas.length : 0 };
    if (snapshot) snapshot.plazas.forEach(function (p) { result[effectiveState(p, snapshot, now)]++; });
    return result;
  }
  function normalizeHistory(raw) {
    if (!raw || !Array.isArray(raw.eventos) || raw.eventos.length > 500) throw Error('Formato de historial no válido.');
    return raw.eventos.map(function (e) {
      if (!e || typeof e.plaza_id !== 'string' || STATES.indexOf(e.estado) < 0 || !Number.isFinite(timestamp(e.fecha)))
        throw Error('Evento de historial no válido.');
      return { id: String(e.id || '').slice(0, 64), plaza_id: e.plaza_id.slice(0, 48), estado: e.estado, fecha: e.fecha };
    }).sort(function (a, b) { return timestamp(b.fecha) - timestamp(a.fecha); });
  }
  function makeDemo(group, now, cycle) {
    var date = new Date(now).toISOString();
    var masks = [0x15, 0x2d, 0x0c, 0x3f, 0x00, 0x19];
    var mask = masks[(group - 1 + cycle) % masks.length];
    var coords = [[-31.38913786417535, -57.95895249347723], [-31.38913786417535, -57.95892513318763], [-31.38913786417535, -57.95889777289803], [-31.38913786417535, -57.95887041260843], [-31.38913786417535, -57.95884305231883], [-31.38913786417535, -57.958815692029226]];
    return { version: 1, grupo: group, simulado: true, fuente: 'demostracion-local', ultima_lectura: date, vigencia_segundos: 20,
      plazas: coords.map(function (c, i) { return { id: 'E00' + (i + 1), nombre: 'Plaza P' + (i + 1),
        zona: 'UCU Salto · estacionamiento del fondo', lat: c[0], lon: c[1], estado: (mask & (1 << i)) ? 'ocupado' : 'libre', actualizado_en: date }; }) };
  }
  return { timestamp: timestamp, validateConfig: validateConfig, normalizeState: normalizeState, normalizeHistory: normalizeHistory,
    effectiveState: effectiveState, summary: summary, makeDemo: makeDemo };
});
