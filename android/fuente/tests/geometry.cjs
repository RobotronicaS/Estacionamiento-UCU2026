const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const U=require('../assets/ucu-map.js');
assert.equal(U.site.lat,-31.389172);assert.equal(U.site.lon,-57.958842);
assert.equal(U.places.length,6);
assert.deepEqual(U.places.map(p=>p.label),['P1','P2','P3','P4','P5','P6']);
assert.equal(new Set(U.places.map(p=>p.id)).size,6);
for(let i=0;i<6;i++){
 const p=U.places[i];assert.ok(Math.hypot(p.east,p.north)<15);
 assert.equal(p.corners.length,5);assert.deepEqual(p.corners[0],p.corners[4]);
 const width=(p.corners[1][0]-p.corners[0][0])*111320*Math.cos(U.site.lat*Math.PI/180);
 const length=(p.corners[2][1]-p.corners[1][1])*111320;
 assert.ok(Math.abs(width-2.5)<.001);assert.ok(Math.abs(length-5)<.001);
 if(i)assert.ok(p.east-U.places[i-1].east>2.5);
}
const geo=U.geoJSON();assert.equal(geo.features.length,7);
assert.deepEqual(geo.features[0].geometry.coordinates,[-57.958842,-31.389172]);
assert.ok(geo.features.slice(1).every(f=>f.properties.distribucion.includes('propuesta')));
const root=path.resolve(__dirname,'..');
fs.writeFileSync(path.join(root,'api','ubicacion_ucu.geojson'),JSON.stringify(geo,null,2)+'\n');
fs.writeFileSync(path.join(root,'api','posiciones_ucu.json'),JSON.stringify({sitio:U.site,plazas:U.places.map(p=>({id:p.id,etiqueta:p.label,lat:p.lat,lon:p.lon,ancho_m:2.5,largo_m:5,distribucion:U.site.layout}))},null,2)+'\n');
console.log('OK: punto compartido, seis plazas únicas, geometrías cerradas de 2,5×5 m, separación y propuesta explícita.');
// Renderer contract without network calls: six selectable bays in the default viewport.
class Element {
 constructor(tag='div'){this.tag=tag;this.children=[];this.style={};this.events={};this.attrs={};this.clientWidth=412;this.clientHeight=370;}
 replaceChildren(){this.children=[];}
 appendChild(child){this.children.push(child);child.parent=this;}
 addEventListener(name,fn){this.events[name]=fn;}
 setAttribute(name,value){this.attrs[name]=value;}
 remove(){if(this.parent)this.parent.children=this.parent.children.filter(c=>c!==this);}
}
global.document={createElement:tag=>new Element(tag),getElementById:()=>null};
const map={lat:U.site.lat,lon:U.site.lon,zoom:20,tiles:new Map()},box=new Element(),tiles=new Element(),markers=new Element();
const snapshot={plazas:U.places.map((p,i)=>({...p,estado:i%2?'ocupado':'libre'}))};
let selection=null;
U.renderPlaces(map,box,markers,snapshot,'E001',p=>p.estado,p=>selection=p.id);
const bays=markers.children.filter(x=>x.tag==='button');assert.equal(bays.length,6);
assert.ok(bays.every(b=>parseFloat(b.style.left)>0&&parseFloat(b.style.left)<412&&parseFloat(b.style.top)>0&&parseFloat(b.style.top)<370));
assert.equal(bays[5].attrs['aria-label'],'Plaza P6: ocupado');bays[5].events.click({stopPropagation(){}});assert.equal(selection,'E006');
U.renderTiles(map,box,tiles);assert.ok(tiles.children.length>0);assert.ok(tiles.children.every(t=>t.src.startsWith('https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/18/')));
assert.ok(tiles.children.every(t=>t.style.width==='1024px'));
assert.equal(U.tileURL('satellite',19,3,7),'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/19/7/3');
assert.equal(U.tileURL('street',19,3,7),'https://tile.openstreetmap.org/19/3/7.png');
map.layer='street';U.renderTiles(map,box,tiles);
assert.ok(tiles.children.every(t=>t.src.startsWith('https://tile.openstreetmap.org/19/')));
assert.ok(tiles.children.every(t=>t.style.width==='512px'));
console.log('OK: seis plazas visibles, selección P6→E006, satélite por z/y/x hasta z18 y calles por z/x/y hasta z19.');
