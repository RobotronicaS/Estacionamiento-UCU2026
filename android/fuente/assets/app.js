(function () {
  'use strict';
  if (!Element.prototype.replaceChildren) Element.prototype.replaceChildren = function () { while (this.firstChild) this.removeChild(this.firstChild); for (var i = 0; i < arguments.length; i++) this.appendChild(arguments[i]); };
  var C = ParkingCore, $ = function (id) { return document.getElementById(id); };
  var icons = {
    refresh: '<path d="M20 7v5h-5M4 17v-5h5M6 7a7 7 0 0 1 11-2l3 3M4 16l3 3a7 7 0 0 0 11-2"/>',
    focus: '<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/><circle cx="12" cy="12" r="4"/>',
    pin: '<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2.5"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v1"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    map: '<path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2Zm6-2v16m6-14v16"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l4 2"/>',
    settings: '<path d="m9 3-1 3-3 1-2 4 2 2v4l4 2 3-1 3 1 4-2v-4l2-2-2-4-3-1-1-3Z"/><circle cx="12" cy="12" r="3"/>',
    shield: '<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6Z"/><path d="m8 12 3 3 5-6"/>',
    car: '<path d="m5 8 2-5h10l2 5M3 9h18v8H3Zm2 8v3m14-3v3M6 12h2m8 0h2"/>'
  };
  function svg(name) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + icons[name] + '</svg>'; }
  document.querySelectorAll('[data-icon]').forEach(function (n) { n.innerHTML = svg(n.dataset.icon); });
  function node(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; return n; }
  function stored(key) { try { return JSON.parse(localStorage.getItem(key)); } catch (_) { return null; } }
  function persist(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {} }
  var config = { servidor: 'https://oxide-land-psychological-gonna.trycloudflare.com', grupo: 1, demo: false };
  try {
    var savedConfig = window.AppNative ? JSON.parse(AppNative.getConfig()) : stored('pi2-config');
    if (!window.AppNative && !stored('pi2-public-default-013')) {
      if (!savedConfig || !String(savedConfig.servidor || '').trim()) savedConfig = config;
      persist('pi2-config', savedConfig);
      persist('pi2-public-default-013', true);
    }
    config = C.validateConfig(savedConfig || config);
  } catch (_) {}
  var snapshot = null, events = [], errorMessage = '', historyError = '', selected = null, filter = 'todas', cycle = 0;
  var page = 'map', pendingId = null, nextId = 0, busy = false, active = true, toastTimer, fetchController;
  var map = { lat: UCUMap.site.lat, lon: UCUMap.site.lon, zoom: UCUMap.site.zoom,
    layer: stored('pi2-map-layer') === 'street' ? 'street' : 'satellite', tiles: new Map(), ready: false, loaded: false, drag: null, moved: false };
  function cacheKey() { return 'pi2-cache:' + config.servidor + ':' + config.grupo; }
  function humanState(state) { return { libre: 'Libre', ocupado: 'Ocupada', desconocido: 'Sin datos' }[state]; }
  function timeAgo(date) { var seconds = Math.max(0, Math.floor((Date.now() - C.timestamp(date)) / 1000)); return seconds < 2 ? 'hace un instante' : seconds < 60 ? 'hace ' + seconds + ' s' : seconds < 3600 ? 'hace ' + Math.floor(seconds / 60) + ' min' : 'hace ' + Math.floor(seconds / 3600) + ' h'; }
  function toast(message) { $('toast').textContent = message; $('toast').classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(function () { $('toast').classList.remove('visible'); }, 3200); }
  function switchPage(name) {
    page = name;
    document.querySelectorAll('.page').forEach(function (n) { n.classList.toggle('active', n.id === 'page-' + name); });
    document.querySelectorAll('.nav-item').forEach(function (n) { var on = n.dataset.page === name; n.classList.toggle('active', on); n.setAttribute('aria-current', on ? 'page' : 'false'); });
    window.scrollTo(0, 0);
    if (name === 'map') requestAnimationFrame(renderMap);
    if (name === 'places') renderPlaces();
    if (name === 'history') renderHistory();
    if (name === 'settings') { $('demo-mode').checked = config.demo; $('group-select').value = String(config.grupo); $('server-url').value = config.servidor; }
  }
  document.querySelectorAll('.nav-item').forEach(function (n) { n.addEventListener('click', function () { switchPage(n.dataset.page); }); });
  function placeCard(p, selectedCard) {
    var state = C.effectiveState(p, snapshot, Date.now());
    var wrap = node(selectedCard ? 'div' : 'button', selectedCard ? '' : 'place-card');
    if (!selectedCard) { wrap.type = 'button'; wrap.addEventListener('click', function () { selected = p.id; switchPage('map'); if (p.lat !== null) { map.lat = p.lat; map.lon = p.lon; } renderMap(); render(); }); }
    var symbol = node('div', 'place-symbol ' + state, 'P');
    var copy = node('div', 'place-copy'); copy.appendChild(node('strong', '', p.nombre + ' · ' + p.id)); copy.appendChild(node('small', '', p.zona));
    wrap.appendChild(symbol); wrap.appendChild(copy); wrap.appendChild(node('span', 'state-badge ' + state, humanState(state)));
    return wrap;
  }
  function renderPlaces() {
    var list = $('places-list'); list.replaceChildren();
    var places = snapshot ? snapshot.plazas.filter(function (p) { return filter === 'todas' || C.effectiveState(p, snapshot, Date.now()) === filter; }) : [];
    if (!places.length) list.appendChild(node('div', 'empty', snapshot ? 'No hay plazas para este filtro.' : 'Conectá el servidor desde Ajustes o activá la demostración.'));
    places.forEach(function (p) { list.appendChild(placeCard(p, false)); });
  }
  function renderHistory() {
    var list = $('history-list'); list.replaceChildren(); $('history-count').textContent = events.length + ' eventos';
    if (!events.length) list.appendChild(node('div', 'empty', historyError || 'Los cambios de estado aparecerán aquí.'));
    events.forEach(function (e) {
      var item = node('div', 'event'), icon = node('div', 'event-icon ' + e.estado); icon.innerHTML = svg(e.estado === 'libre' ? 'check' : 'car');
      var copy = node('div', 'event-copy'); copy.appendChild(node('strong', '', e.plaza_id + (e.estado === 'libre' ? ' quedó libre' : e.estado === 'ocupado' ? ' se ocupó' : ' sin datos')));
      copy.appendChild(node('small', '', config.demo ? 'Evento simulado' : 'Registro del servidor'));
      var date = new Date(e.fecha), time = node('time', '', date.toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' }));
      time.dateTime = e.fecha; time.appendChild(document.createElement('br')); time.appendChild(document.createTextNode(date.toLocaleDateString('es-UY', { day: '2-digit', month: '2-digit' })));
      item.appendChild(icon); item.appendChild(copy); item.appendChild(time); list.appendChild(item);
    });
    if (historyError && events.length) list.appendChild(node('div', 'empty', historyError));
  }
  function render() {
    var counts = C.summary(snapshot, Date.now());
    $('count-free').textContent = snapshot ? counts.libre : '—'; $('count-busy').textContent = snapshot ? counts.ocupado : '—'; $('count-unknown').textContent = snapshot ? counts.desconocido : '—';
    var expired = snapshot && counts.total > 0 && counts.desconocido === counts.total;
    $('connection-label').textContent = config.demo ? 'Demostración · datos simulados' : errorMessage ? (snapshot ? 'Sin conexión · última lectura guardada' : 'Sin conexión con el servidor') : expired ? 'Lecturas vencidas' : snapshot ? (snapshot.simulado ? 'Servidor · datos de prueba' : 'Conectado al servidor') : 'Esperando el servidor';
    $('status-dot').className = 'status-dot ' + (config.demo ? 'demo' : errorMessage || expired || !snapshot ? 'error' : '');
    $('group-label').textContent = 'Equipo ' + config.grupo;
    $('demo-notice').hidden = !config.demo && !(snapshot && snapshot.simulado);
    $('demo-notice').querySelector('strong').textContent = config.demo ? 'Estás viendo una demostración' : 'Datos de prueba del servidor';
    $('demo-notice').querySelector('p').textContent = config.demo ? 'Estados simulados. Punto de la UCU confirmado; distribución de las seis plazas propuesta.' : 'Las plazas muestran lecturas simuladas. No representan disponibilidad real.';
    document.querySelector('.history-demo').hidden = !config.demo;
    $('error-notice').hidden = !errorMessage && !expired;
    $('error-title').textContent = errorMessage ? 'No se pudo actualizar' : 'La lectura perdió vigencia';
    $('error-text').textContent = errorMessage || 'Las plazas pasan a «Sin datos» hasta recibir una nueva lectura.';
    $('last-update').textContent = snapshot ? 'Última lectura ' + timeAgo(snapshot.ultima_lectura) + ' · actualización cada 10 s' : 'Todavía no hay una lectura válida del servidor.';
    $('refresh').classList.toggle('loading', busy); $('refresh').disabled = busy;
    var p = snapshot && (snapshot.plazas.find(function (v) { return v.id === selected; }) || snapshot.plazas[0]);
    $('selected-card').replaceChildren(); $('selected-card').hidden = !p;
    if (p) { selected = p.id; var card = placeCard(p, true); while (card.firstChild) $('selected-card').appendChild(card.firstChild); }
    renderMarkers();
    if (page === 'places') renderPlaces();
  }
  function project(lat, lon, zoom) { var scale = 256 * Math.pow(2, zoom), s = Math.sin(lat * Math.PI / 180); return { x: (lon + 180) / 360 * scale, y: (.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * scale }; }
  function unproject(x, y, zoom) { var scale = 256 * Math.pow(2, zoom); return { lon: x / scale * 360 - 180, lat: Math.atan(Math.sinh(Math.PI * (1 - 2 * y / scale))) * 180 / Math.PI }; }
  function renderMarkers() {
    UCUMap.renderPlaces(map, $('map'), $('markers'), snapshot, selected,
      function (p) { return C.effectiveState(p, snapshot, Date.now()); },
      function (p) { selected = p.id; render(); });
  }
  function renderMap() {
    if (page !== 'map' || !$('map').clientWidth) return;
    $('map').classList.toggle('satellite', map.layer === 'satellite');
    ['satellite','street'].forEach(function (name) { var selectedLayer = map.layer === name; $('layer-' + name).classList.toggle('active', selectedLayer); $('layer-' + name).setAttribute('aria-pressed', String(selectedLayer)); });
    var attribution = $('map-attribution');
    attribution.textContent = map.layer === 'street' ? '© OpenStreetMap contributors' : 'Imágenes © Esri · Maxar · Earthstar Geographics · GIS User Community';
    attribution.href = map.layer === 'street' ? 'https://www.openstreetmap.org/copyright' : 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer';
    UCUMap.renderTiles(map, $('map'), $('tiles')); renderMarkers();
  }
  $('map').addEventListener('pointerdown', function (e) {
    if (e.target.closest('.zoom-controls,.attribution,.map-marker,.map-layers')) return;
    map.moved = false; map.drag = { x: e.clientX, y: e.clientY, center: project(map.lat, map.lon, map.zoom), pointer: e.pointerId };
    $('map').setPointerCapture(e.pointerId);
  });
  $('map').addEventListener('pointermove', function (e) {
    if (!map.drag || map.drag.pointer !== e.pointerId) return;
    var dx = e.clientX - map.drag.x, dy = e.clientY - map.drag.y;
    if (Math.abs(dx) + Math.abs(dy) > 5) map.moved = true;
    var p = unproject(map.drag.center.x - dx, map.drag.center.y - dy, map.zoom);
    map.lat = Math.max(-85, Math.min(85, p.lat)); map.lon = ((p.lon + 540) % 360) - 180; renderMap();
  });
  function endDrag() { map.drag = null; setTimeout(function () { map.moved = false; }, 0); }
  $('map').addEventListener('pointerup', endDrag); $('map').addEventListener('pointercancel', endDrag);
  $('zoom-in').addEventListener('click', function () { map.zoom = Math.min(21, map.zoom + 1); renderMap(); });
  $('zoom-out').addEventListener('click', function () { map.zoom = Math.max(12, map.zoom - 1); renderMap(); });
  function centerMap() {
    map.lat = UCUMap.site.lat; map.lon = UCUMap.site.lon; map.zoom = UCUMap.site.zoom; renderMap();
  }
  $('center-map').addEventListener('click', centerMap);
  ['satellite','street'].forEach(function (name) { $('layer-' + name).addEventListener('click', function () { map.layer = name; persist('pi2-map-layer', name); renderMap(); }); });
  window.addEventListener('resize', renderMap);
  $('filters').addEventListener('click', function (e) { var b = e.target.closest('[data-filter]'); if (!b) return; filter = b.dataset.filter; document.querySelectorAll('.filter').forEach(function (n) { n.classList.toggle('active', n === b); }); renderPlaces(); });
  function loadMode() {
    snapshot = null; events = []; selected = null; errorMessage = ''; historyError = ''; cycle = 0; busy = false; pendingId = null;
    if (fetchController) fetchController.abort();
    if (!config.demo) {
      var cache = stored(cacheKey());
      try { if (cache) { snapshot = C.normalizeState(cache.estado, config.grupo); events = C.normalizeHistory(cache.historial); } } catch (_) { snapshot = null; events = []; }
    }
    if (config.demo) {
      snapshot = C.makeDemo(config.grupo, Date.now(), cycle);
      events = snapshot.plazas.slice(0, 4).map(function (p, i) { return { id: 'demo-start-' + i, plaza_id: p.id, estado: p.estado, fecha: new Date(Date.now() - (i + 1) * 60000).toISOString() }; });
    }
    renderHistory(); render(); centerMap();
  }
  function demoUpdate() {
    cycle++;
    var previous = snapshot; snapshot = C.makeDemo(config.grupo, Date.now(), cycle);
    snapshot.plazas.forEach(function (p, i) { if (!previous || p.estado !== previous.plazas[i].estado) events.unshift({ id: 'demo-' + cycle + '-' + i, plaza_id: p.id, estado: p.estado, fecha: snapshot.ultima_lectura }); });
    events = events.slice(0, 60); renderHistory(); render();
  }
  window.receiveNativeResult = function (result) {
    if (result.request_id !== pendingId) return;
    busy = false; pendingId = null;
    if (!result.ok) { errorMessage = result.error || 'El servidor no respondió.'; render(); return; }
    try {
      var newState = C.normalizeState(result.estado, config.grupo), newEvents = events;
      historyError = result.historial_error || '';
      if (result.historial) { try { newEvents = C.normalizeHistory(result.historial); } catch (_) { historyError = 'El formato del historial no es válido. Se conserva la última copia.'; } }
      snapshot = newState; events = newEvents; errorMessage = '';
      persist(cacheKey(), { estado: snapshot, historial: { eventos: events } });
      if (!selected) centerMap(); renderHistory(); render();
    } catch (e) { errorMessage = e.message; render(); }
  };
  async function browserRequest(id) {
    try {
      fetchController = new AbortController(); var timer = setTimeout(function () { fetchController.abort(); }, 18000);
      async function read(path) {
        var r = await fetch(config.servidor + path, { signal: fetchController.signal, redirect: 'error', credentials: 'omit' });
        if (!r.ok) throw Error('El servidor respondió HTTP ' + r.status + '.');
        var text = await r.text(); if (text.length > 1048576) throw Error('La respuesta excede el tamaño permitido.');
        try { return JSON.parse(text); } catch (_) { throw Error('La dirección no devuelve JSON. Revisá la API y Cloudflare Access.'); }
      }
      var state = await read('/api/estado?grupo=' + config.grupo), history = null, historyMessage = '';
      try { history = await read('/api/historial?grupo=' + config.grupo + '&limite=60'); } catch (_) { historyMessage = 'No se pudo actualizar el historial.'; }
      clearTimeout(timer); window.receiveNativeResult({ request_id: id, ok: true, estado: state, historial: history, historial_error: historyMessage });
    } catch (e) { window.receiveNativeResult({ request_id: id, ok: false, error: e.name === 'AbortError' ? 'El servidor no respondió a tiempo.' : e.message }); }
  }
  function refresh() {
    if (busy || !active) return;
    if (config.demo) { demoUpdate(); return; }
    busy = true; pendingId = 'r' + (++nextId); render();
    if (window.AppNative) AppNative.requestUpdate(pendingId); else browserRequest(pendingId);
  }
  $('refresh').addEventListener('click', refresh);
  $('settings-form').addEventListener('submit', function (e) {
    e.preventDefault(); $('form-error').hidden = true;
    try {
      var next = C.validateConfig({ servidor: $('server-url').value, grupo: $('group-select').value, demo: $('demo-mode').checked });
      if (window.AppNative) { var result = JSON.parse(AppNative.saveConfig(JSON.stringify(next))); if (!result.ok) throw Error(result.error || 'No se pudo guardar.'); }
      config = next; persist('pi2-config', config); loadMode(); switchPage('map'); toast(config.demo ? 'Demostración activada' : 'Conectando con el servidor…'); if (!config.demo) refresh();
    } catch (err) { $('form-error').textContent = err.message; $('form-error').hidden = false; }
  });
  window.onAppPause = function () { active = false; };
  window.onAppResume = function () { active = true; render(); if (!config.demo) refresh(); };
  window.handleAppBack = function () { if (page !== 'map') { switchPage('map'); return true; } return false; };
  document.addEventListener('visibilitychange', function () { active = !document.hidden; if (active) { render(); if (!config.demo) refresh(); } });
  setInterval(function () { if (active) render(); }, 1000);
  setInterval(function () { if (active) refresh(); }, 10000);
  loadMode(); switchPage('map'); if (!config.demo) refresh();
})();
