'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {parseHTML}=require('linkedom');
const root=path.join(__dirname,'../public');
const fixture={basics:[{fname:'Synthetic',lname:'Person',label:['Role <A>','Role B'],summary:'Exact synthetic summary & detail. '.repeat(24),location:[{city:'Synthetic City',country:'Example Country'}],Pictures:[{type_of:'profile',URL:'https://example.test/owner.jpg'},{type_of:'cover',URL:'https://example.test/cover.jpg'}]}],unusedSection:{preserved:true,nullable:null}};
function setup({reduce=false}={}){
  const dom=parseHTML(fs.readFileSync(path.join(root,'index.html'),'utf8')),win={HeroLabDesigns:[],matchMedia:()=>({matches:reduce})};
  // LinkeDOM implements a read-only select.value; emulate the browser's setter.
  Object.defineProperty(dom.document.querySelector('#designSelect'),'value',{value:'',writable:true});
  const calls=[];
  const transport=async(url,options={})=>{calls.push(url);return {ok:true,status:200,json:async()=>url==='/api/cv'?structuredClone(fixture):{ok:true}};};
  for(const group of ['a','b','c'])new Function('window',fs.readFileSync(path.join(root,`designs/collection-${group}.js`),'utf8'))(win);
  new Function('window','document','fetch','setTimeout','clearTimeout',fs.readFileSync(path.join(root,'app.js'),'utf8'))(win,dom.document,transport,()=>1,()=>{});
  const click=selector=>{const el=dom.document.querySelector(selector);assert(el,selector);el.dispatchEvent(new dom.Event('click',{bubbles:true}));};
  async function login(){dom.document.querySelector('#password').value='synthetic-password';dom.document.querySelector('#loginForm').dispatchEvent(new dom.Event('submit',{cancelable:true}));for(let i=0;i<20&&!win.heroLabView.authenticated;i++)await new Promise(r=>setImmediate(r));assert.equal(win.heroLabView.authenticated,true);}
  return {dom,win,calls,click,login};
}
test('all 20 distinct registered compositions render only JSON identity and its real image URL',async()=>{
  const env=setup(),{document}=env.dom;
  assert.equal(env.win.HeroLabDesigns.length,20);assert.equal(new Set(env.win.HeroLabDesigns.map(d=>d.id)).size,20);
  assert.equal(env.calls.length,0);await env.login();assert.deepStrictEqual(env.win.heroLabView.cv,fixture);assert.deepStrictEqual(JSON.parse(document.querySelector('#fullJson').textContent),fixture);
  const shapes=new Set();
  for(const design of env.win.HeroLabDesigns){env.click(`[data-design="${design.id}"]`);const hero=document.querySelector(`.hero-${design.id}`);assert(hero,design.id);assert(hero.textContent.includes('Synthetic'));assert(hero.textContent.includes('Person'));assert(hero.textContent.includes(fixture.basics[0].summary));assert(hero.textContent.includes('Role <A>'));assert.equal(hero.querySelectorAll('.h-summary img').length,0);const photos=hero.querySelectorAll('img.h-photo-img');assert(photos.length>=1,design.id+' portrait');for(const image of photos)assert.equal(image.getAttribute('src'),fixture.basics[0].Pictures[0].URL);assert.equal(document.querySelectorAll('[data-design][aria-pressed="true"]').length,1);shapes.add(hero.innerHTML.replace(/class="[^"]*"/g,''));}
  assert.equal(shapes.size,20);
  env.click('#motionBtn');assert(document.querySelector('#canvas').classList.contains('paused'));env.click('#nextBtn');assert(document.querySelector('#canvas').classList.contains('paused'));
  env.click('#summaryBtn');assert(document.querySelector('.hero').classList.contains('show-full-summary'));
  const image=document.querySelector('.h-photo-img');image.dispatchEvent(new env.dom.Event('error'));assert.equal(image.closest('.h-photo').dataset.imageState,'error');assert.equal(image.hidden,true);
  for(const section of ['projects','research','skills','about','contact']){env.click(`[data-section="${section}"]`);assert.equal(document.querySelector('.hero'),null);}
  env.click('[data-section="hero"]');assert(document.querySelector('.hero'));
  env.click('#logoutBtn');for(let i=0;i<10&&env.win.heroLabView.cv;i++)await new Promise(r=>setImmediate(r));assert.equal(env.win.heroLabView.cv,null);assert.equal(document.querySelector('#fullJson').textContent,'');assert.equal(document.querySelector('img.h-photo-img'),null);
});
test('reduced-motion mode disables animation control and keeps collection paused',()=>{
  const env=setup({reduce:true});assert.equal(env.dom.document.querySelector('#motionBtn').disabled,true);assert(env.dom.document.querySelector('#canvas').classList.contains('paused'));
});
