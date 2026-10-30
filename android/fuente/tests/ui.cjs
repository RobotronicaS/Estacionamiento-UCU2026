const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
const screenshots = path.resolve(process.env.PI2_SCREENSHOTS || path.join(root, 'build', 'screenshots'));
fs.mkdirSync(screenshots, { recursive:true });
(async () => {
  const browser = await chromium.launch({ headless:true, executablePath:process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  try {
    const context = await browser.newContext({ viewport:{width:412,height:915}, deviceScaleFactor:1, isMobile:true, hasTouch:true });
    // Serve local assets through interception, matching Android's asset origin.
    await context.route('https://appassets.androidplatform.net/assets/**', async route => {
      const name = new URL(route.request().url()).pathname.split('/').pop();
      if (!['index.html','style.css','safe-layout.css','core.js','ucu-map.js','app.js'].includes(name)) { await route.abort(); return; }
      await route.fulfill({ status:200, contentType:name.endsWith('.js') ? 'text/javascript' : name.endsWith('.css') ? 'text/css' : 'text/html', body:fs.readFileSync(path.join(root,'assets',name)) });
    });
    await context.route('https://tile.openstreetmap.org/**', r => r.abort()); // No automated tile fetching.
    const imageRequests = [];
    await context.route('https://services.arcgisonline.com/**', async r => {
      imageRequests.push(r.request().url());
      // Synthetic local PNG: checks the image loading path without external map downloads.
      await r.fulfill({contentType:'image/png',body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=','base64')});
    });
    await context.addInitScript(() => {
      window.__config = JSON.parse(localStorage.getItem('test-native-config') || '{"servidor":"","grupo":1,"demo":true}');
      window.__requests = []; window.__offline = false; window.__stale = false; window.__badHistory = false;
      window.AppNative = {
        getConfig:() => JSON.stringify(window.__config),
        saveConfig:encoded => { window.__config = JSON.parse(encoded); localStorage.setItem('test-native-config', encoded); return '{"ok":true}'; },
        requestUpdate:id => {
          window.__requests.push(id);
          setTimeout(() => {
            if (window.__offline) { window.receiveNativeResult({request_id:id, ok:false, error:'Sin Internet (prueba)'}); return; }
            const state = window.ParkingCore.makeDemo(window.__config.grupo, Date.now() - (window.__stale ? 60000:0), 0);
            state.fuente = 'mpf1-serie';
            window.receiveNativeResult({ request_id:id, ok:true, estado:state, historial:window.__badHistory ? {eventos:[{estado:'invalido'}]} : {eventos:[]} });
          },30);
        }
      };
    });
    const page = await context.newPage();
    const errors=[]; page.on('pageerror', e => errors.push(e.message));
    await page.goto('https://appassets.androidplatform.net/assets/index.html');
    await page.waitForSelector('.map-marker');
    assert.equal(await page.locator('.map-marker').count(),6);
    assert.equal(await page.locator('.ucu-bay').count(),6);
    assert.deepEqual(await page.locator('.ucu-bay span').allTextContents(),['P1','P2','P3','P4','P5','P6']);
    assert.deepEqual(await page.evaluate(() => [UCUMap.site.lat,UCUMap.site.lon]),[-31.389172,-57.958842]);
    const rectangles = await page.locator('.ucu-bay').evaluateAll(nodes => nodes.map(n => { const s=getComputedStyle(n); return {width:n.offsetWidth,height:n.offsetHeight,rounding:s.borderRadius,rotation:s.transform}; }));
    assert.ok(rectangles.every(r=>r.height>r.width*1.7&&parseFloat(r.rounding)<=4&&r.rotation.startsWith('matrix(1, 0, 0, 1,')));
    assert.match(await page.locator('#connection-label').innerText(),/Demostración/);
    assert.equal(await page.locator('#count-free').innerText(),'3');
    assert.equal(await page.locator('#layer-satellite').getAttribute('aria-pressed'),'true');
    await page.waitForFunction(() => document.getElementById('map-fallback').classList.contains('tiles-loaded'));
    assert.ok(imageRequests.length>0 && imageRequests.every(url=>url.includes('/World_Imagery/MapServer/tile/')));
    await page.locator('#layer-street').click();
    assert.equal(await page.locator('#layer-street').getAttribute('aria-pressed'),'true');
    assert.match(await page.locator('#map-attribution').innerText(),/OpenStreetMap/);
    assert.equal(await page.locator('.ucu-bay').count(),6);
    await page.locator('#layer-satellite').click();
    assert.match(await page.locator('#map-attribution').innerText(),/Esri/);
    await page.screenshot({path:path.join(screenshots,'01-mapa.png'),fullPage:true});
    await page.locator('[data-page="places"]').click();
    assert.equal(await page.locator('.place-card').count(),6);
    await page.locator('[data-filter="libre"]').click();
    assert.equal(await page.locator('.place-card').count(),3);
    await page.screenshot({path:path.join(screenshots,'02-plazas.png'),fullPage:true});
    await page.locator('.place-card').first().click();
    assert.ok(await page.locator('#page-map').evaluate(n => n.classList.contains('active')));
    await page.locator('[data-page="history"]').click();
    assert.equal(await page.locator('.event').count(),4);
    await page.screenshot({path:path.join(screenshots,'03-historial.png'),fullPage:true});
    await page.locator('[data-page="settings"]').click();
    await page.screenshot({path:path.join(screenshots,'04-ajustes.png'),fullPage:true});
    await page.locator('#demo-mode').uncheck();
    await page.locator('#server-url').fill('http://servidor.test');
    await page.locator('.primary-button').click();
    assert.match(await page.locator('#form-error').innerText(),/HTTPS/);
    await page.locator('#server-url').fill('https://servidor.test');
    await page.locator('#group-select').selectOption('2');
    await page.locator('.primary-button').click();
    await page.waitForFunction(() => document.getElementById('connection-label').textContent.includes('Servidor'));
    assert.equal(await page.locator('#group-label').innerText(),'Equipo 2');
    assert.equal(await page.locator('#count-free').innerText(),'2');
    // A failed refresh preserves the previous reading and exposes the failure.
    await page.evaluate(() => window.__offline = true);
    await page.locator('#refresh').click();
    await page.waitForFunction(() => document.getElementById('connection-label').textContent.includes('Sin conexión'));
    assert.equal(await page.locator('#count-free').innerText(),'2');
    // A successful download of old data does not make those places available.
    await page.evaluate(() => { window.__offline = false; window.__stale = true; });
    await page.locator('#refresh').click();
    await page.waitForFunction(() => document.getElementById('count-unknown').textContent === '6');
    assert.equal(await page.locator('#count-free').innerText(),'0');
    // Invalid history must not discard a valid state update.
    await page.evaluate(() => { window.__stale = false; window.__badHistory = true; });
    await page.locator('#refresh').click();
    await page.waitForFunction(() => document.getElementById('count-free').textContent === '2');
    await page.locator('[data-page="history"]').click();
    assert.match(await page.locator('#history-list').innerText(),/formato del historial/);
    await page.reload();
    await page.waitForFunction(() => document.getElementById('group-label').textContent === 'Equipo 2');
    assert.equal(await page.evaluate(() => window.__config.servidor),'https://servidor.test');
    for (const width of [320,360,412,650]) {
      await page.setViewportSize({width,height:915});
      for (const tab of ['map','places','history','settings']) {
        await page.locator('[data-page="' + tab + '"]').click();
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'overflow '+width+' '+tab);
      }
    }
    // Content viewports after reserving typical 3-button and gesture navigation bars.
    for (const systemBottom of [24,48,80]) {
      const usableHeight = 915-24-systemBottom;
      await page.setViewportSize({width:412,height:usableHeight});
      const bounds = await page.locator('.bottom-nav').boundingBox();
      assert.ok(bounds.y>=0 && bounds.y+bounds.height<=usableHeight+1);
      for (const tab of ['map','places','history','settings']) {
        await page.locator('[data-page="'+tab+'"]').click();
        assert.ok(await page.locator('#page-'+tab).evaluate(n=>n.classList.contains('active')));
      }
    }
    assert.deepEqual(errors,[]);
    console.log('OK: satélite/calles, carga de imágenes con fixture local, seis rectángulos, filtros, ajustes, desconexión, caché, vencimiento, anchos 320/360/412/650 y menú en viewports con barras de 24/48/80 px.');
    await context.close();
  } finally { await browser.close(); }
})().catch(err => { console.error(err);process.exitCode=1; });
