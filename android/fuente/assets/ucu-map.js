(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.UCUMap = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var site = { name: 'UCU Salto · estacionamiento del fondo', lat: -31.389172, lon: -57.958842,
    zoom: 20, source: 'https://maps.app.goo.gl/NSXLWDAJGod3SWo6A', layout: 'propuesta, no relevada', width: 2.5, length: 5 };
  var cosLat = Math.cos(site.lat * Math.PI / 180);
  function offset(east, north) { return [site.lat + north / 111320, site.lon + east / (111320 * cosLat)]; }
  // Six bays in one row in the northern portion of the patio. Adjustable proposal.
  var places = Array.from({ length: 6 }, function (_, i) {
    var east = -10.5 + 2.6 * i, north = 3.8, center = offset(east, north);
    var corners = [[-1.25,-2.5],[1.25,-2.5],[1.25,2.5],[-1.25,2.5],[-1.25,-2.5]].map(function (p) {
      var c = offset(east + p[0], north + p[1]); return [c[1], c[0]];
    });
    return { id: 'E00' + (i + 1), label: 'P' + (i + 1), lat: center[0], lon: center[1], east: east, north: north, corners: corners };
  });
  function project(lat, lon, zoom) {
    var scale = 256 * Math.pow(2, zoom), s = Math.sin(lat * Math.PI / 180);
    return { x: (lon + 180) / 360 * scale, y: (.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * scale };
  }
  function metersPerPixel(lat, zoom) { return 156543.03392 * Math.cos(lat * Math.PI / 180) / Math.pow(2, zoom); }
  function tileURL(layer, z, x, y) {
    return layer === 'street' ? 'https://tile.openstreetmap.org/' + z + '/' + x + '/' + y + '.png'
      : 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/' + z + '/' + y + '/' + x;
  }
  function renderTiles(map, element, layer) {
    var w = element.clientWidth, h = element.clientHeight; if (!w) return;
    var center = project(map.lat, map.lon, map.zoom), left = center.x - w/2, top = center.y - h/2;
    var base = map.layer === 'street' ? 'street' : 'satellite';
    var fallback = typeof document !== 'undefined' ? document.getElementById('map-fallback') : null;
    if (map.lastBase !== base) {
      if (fallback) {
        fallback.classList.remove('tiles-loaded');
        var title = fallback.querySelector('span'), help = fallback.querySelector('small');
        if (title) title.textContent = base === 'satellite' ? 'Vista satelital sin conexión' : 'Mapa de calles sin conexión';
        if (help) help.textContent = 'Se necesita Internet para cargar el fondo.';
      }
      map.lastBase = base;
    }
    // World Imagery has coverage at z18 here; z19 returns a no-data placeholder.
    // Fetch only the viewport and scale that available imagery for close-up bays.
    var nativeZoom = Math.min(map.zoom, base === 'satellite' ? 18 : 19), size = 256 * Math.pow(2, map.zoom - nativeZoom), n = Math.pow(2, nativeZoom), wanted = new Set();
    for (var x = Math.floor(left / size); x <= Math.floor((left + w) / size); x++) {
      for (var y = Math.floor(top / size); y <= Math.floor((top + h) / size); y++) {
        if (y < 0 || y >= n) continue;
        var tx = ((x % n) + n) % n, key = base + '/' + nativeZoom + '/' + tx + '/' + y, img = map.tiles.get(key);
        wanted.add(key);
        if (!img) {
          img = document.createElement('img'); img.alt = ''; img.draggable = false;
          img.referrerPolicy = 'strict-origin-when-cross-origin';
          img.setAttribute('data-map-layer', base);
          img.addEventListener('load', function () { var notice = document.getElementById('map-fallback'); if (notice && this.getAttribute('data-map-layer') === map.lastBase) notice.classList.add('tiles-loaded'); });
          img.addEventListener('error', function () { this.style.display = 'none'; });
          img.src = tileURL(base, nativeZoom, tx, y);
          map.tiles.set(key, img); layer.appendChild(img);
        }
        img.style.width = img.style.height = size + 'px';
        img.style.left = Math.round(x * size - left) + 'px'; img.style.top = Math.round(y * size - top) + 'px';
      }
    }
    map.tiles.forEach(function (img, key) { if (!wanted.has(key)) { img.remove(); map.tiles.delete(key); } });
  }
  function renderPlaces(map, element, layer, snapshot, selected, stateOf, onSelect) {
    layer.replaceChildren(); if (!snapshot || !element.clientWidth) return;
    var w = element.clientWidth, h = element.clientHeight, center = project(map.lat, map.lon, map.zoom), scale = metersPerPixel(site.lat, map.zoom);
    snapshot.plazas.forEach(function (p) {
      var configured = places.find(function (s) { return s.id === p.id; });
      if (!configured || p.lat === null || p.lon === null) return;
      var position = project(p.lat, p.lon, map.zoom), x = position.x - center.x + w / 2, y = position.y - center.y + h / 2;
      if (x < -70 || x > w + 70 || y < -70 || y > h + 70) return;
      var state = stateOf(p), button = document.createElement('button'); button.type = 'button';
      button.className = 'map-marker ucu-bay ' + state + (p.id === selected ? ' selected' : '');
      button.style.left = x + 'px'; button.style.top = y + 'px';
      button.style.width = Math.max(16, site.width / scale) + 'px'; button.style.height = Math.max(28, site.length / scale) + 'px';
      button.setAttribute('aria-label', 'Plaza ' + configured.label + ': ' + state);
      var label = document.createElement('span'); label.textContent = configured.label; button.appendChild(label);
      button.addEventListener('click', function (e) { e.stopPropagation(); if (!map.moved) onSelect(p); }); layer.appendChild(button);
    });
    var anchor = project(site.lat, site.lon, map.zoom), pin = document.createElement('span'); pin.className = 'ucu-anchor';
    pin.style.left = (anchor.x - center.x + w / 2) + 'px'; pin.style.top = (anchor.y - center.y + h / 2) + 'px';
    pin.title = 'Punto compartido por el docente'; pin.setAttribute('aria-label', 'Punto de referencia compartido'); layer.appendChild(pin);
  }
  function geoJSON() {
    return { type: 'FeatureCollection', name: 'UCU_Salto_6_plazas', features: [
      { type: 'Feature', properties: { nombre: site.name, fuente: site.source, tipo: 'punto_compartido' }, geometry: { type: 'Point', coordinates: [site.lon, site.lat] } }
    ].concat(places.map(function (p) { return { type: 'Feature', properties: { id: p.id, etiqueta: p.label, bit: Number(p.label.slice(1))-1,
      distribucion: site.layout, ancho_m: site.width, largo_m: site.length }, geometry: { type: 'Polygon', coordinates: [p.corners] } }; })) };
  }
  return { site: site, places: places, project: project, metersPerPixel: metersPerPixel, tileURL: tileURL, renderTiles: renderTiles, renderPlaces: renderPlaces, geoJSON: geoJSON };
});
