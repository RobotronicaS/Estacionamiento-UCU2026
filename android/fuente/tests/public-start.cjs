const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const C = require('../assets/core.js');
const root = path.resolve(__dirname, '..');
const publicServer = 'https://oxide-land-psychological-gonna.trycloudflare.com';
const image = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=','base64');
(async () => {
  const browser = await chromium.launch({headless:true, executablePath:process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  try {
    for (const scenario of ['fresh', 'legacy-empty', 'custom-server']) {
      const context = await browser.newContext({viewport:{width:412,height:915},isMobile:true,hasTouch:true});
      const requests = [];
      await context.route('https://appassets.androidplatform.net/assets/**', async route => {
        const name = new URL(route.request().url()).pathname.split('/').pop();
        await route.fulfill({contentType:name.endsWith('.js')?'application/javascript':name.endsWith('.css')?'text/css':'text/html',body:fs.readFileSync(path.join(root,'assets',name))});
      });
      await context.route('https://services.arcgisonline.com/**', r=>r.fulfill({contentType:'image/png',body:image}));
      await context.route('https://tile.openstreetmap.org/**', r=>r.abort());
      for (const host of [publicServer,'https://custom.test']) {
        await context.route(host+'/api/**', async route => {
          const url = new URL(route.request().url());requests.push(url.toString());
          const group = Number(url.searchParams.get('grupo'));
          const state = C.makeDemo(group,Date.now(),0);state.fuente='simulador-python';
          await route.fulfill({contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:JSON.stringify(url.pathname==='/api/estado'?state:{eventos:[]})});
        });
      }
      if(scenario!=='fresh') await context.addInitScript(({scenario})=>{
        if(!localStorage.getItem('test-seeded')) {
          localStorage.setItem('pi2-config',JSON.stringify(scenario==='legacy-empty'?{servidor:'',grupo:4,demo:true}:{servidor:'https://custom.test',grupo:2,demo:false}));
          localStorage.setItem('test-seeded','1');
        }
      },{scenario});
      const page = await context.newPage();
      const errors=[];page.on('pageerror',e=>errors.push(e.message));
      await page.goto('https://appassets.androidplatform.net/assets/index.html');
      await page.waitForFunction(()=>document.getElementById('connection-label').textContent==='Servidor · datos de prueba');
      assert.equal(await page.locator('.ucu-bay').count(),6);
      assert.equal(await page.locator('#demo-notice strong').innerText(),'Datos de prueba del servidor');
      assert.doesNotMatch(await page.locator('#demo-notice').innerText(),/MPF-1/);
      const server = scenario==='custom-server'?'https://custom.test':publicServer;
      const group = scenario==='custom-server'?2:1;
      assert.ok(requests.includes(server+'/api/estado?grupo='+group));
      assert.ok(requests.includes(server+'/api/historial?grupo='+group+'&limite=60'));
      await page.locator('[data-page="settings"]').click();
      assert.equal(await page.locator('#server-url').inputValue(),server);
      assert.equal(await page.locator('#group-select').inputValue(),String(group));
      assert.equal(await page.locator('#demo-mode').isChecked(),false);
      if(scenario==='fresh') {
        const shots=process.env.PI2_SCREENSHOTS || path.join(root,'build','public-screenshots');
        fs.mkdirSync(shots,{recursive:true});
        await page.screenshot({path:path.join(shots,'ajustes-publicos.png'),fullPage:true});
        await page.locator('[data-page="map"]').click();
        await page.screenshot({path:path.join(shots,'mapa-publico.png'),fullPage:true});
        // Explicitly choosing local demo must survive reload after initial migration.
        await page.locator('[data-page="settings"]').click();
        await page.locator('#demo-mode').check();
        await page.locator('#server-url').fill('');
        await page.locator('.primary-button').click();
        await page.reload();
        await page.waitForFunction(()=>document.getElementById('connection-label').textContent.includes('Demostración'));
      }
      assert.deepEqual(errors,[]);
      await context.close();
      console.log('OK: conexión pública automática, caso '+scenario);
    }
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
