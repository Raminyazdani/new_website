'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {parseHTML}=require('linkedom');
const {adaptCV}=require('../public/data/cv-adapter');
const root=path.join(__dirname,'../public');
const raw={basics:[{fname:'Synthetic',lname:'Profile',summary:'Exact fictional summary <img src=x onerror=alert(1)>',label:['Test role'],location:[{city:'Example City'}],email:'synthetic@example.test',Pictures:[{type_of:'profile',URL:'https://example.test/portrait.jpg'}]}],profiles:[{network:'Code',username:'Synthetic',url:'https://example.test/code'}],projects:Array.from({length:12},(_,i)=>({title:'Project '+i,description:'Full description '+i,type_key:[i%2?'Topic B':'Topic A']})),experiences:[{role:'Synthetic role',institution:'Example organization',duration:'Source date',description:'A full role description'}],education:[{institution:'Example University',area:'Test field',studyType:'Degree',startDate:'not-a-real-date'}],publications:[{title:'Synthetic research',authors:['Fictional Author'],status:'In preparation',year:'2024'}],skills:{'Test domain':{'Test group':[{long_name:'Synthetic skill',short_name:'Test'}]}},workshop_and_certifications:[{issuer:'Example issuer',certifications:Array.from({length:9},(_,i)=>({name:'Certificate '+i,certificate:true,URL:'https://example.test/cert/'+i}))}],languages:[{language:'Example language',proficiency:{level:'Source level'}}],references:[{name:'Fictional Referee',email:'referee@example.test',institution:'Example Institute'}]};
async function boot({reduce=true,auth=false,model=adaptCV(raw)}={}){
 const {document,Event}=parseHTML(fs.readFileSync(path.join(root,'index.html'),'utf8'));Object.defineProperty(document.querySelector('#motionMode'),'value',{value:'auto',writable:true});
 const win={PortfolioRenderers:{},PortfolioData:{load:async()=>{if(auth){const error=Error();error.code='AUTH_REQUIRED';throw error;}return {raw:structuredClone(raw),model:structuredClone(model)};}},matchMedia:()=>({matches:reduce}),requestAnimationFrame:fn=>fn(),addEventListener(){},navigator:{clipboard:{writeText:async()=>{}}}};
 for(const file of ['intro.js','records.js'])new Function('window',fs.readFileSync(path.join(root,'portfolio',file),'utf8'))(win);
 new Function('window','document','fetch','setTimeout','clearTimeout',fs.readFileSync(path.join(root,'portfolio/runtime.js'),'utf8'))(win,document,async()=>({ok:true}),()=>1,()=>{});
 for(let i=0;i<4;i++)await new Promise(r=>setImmediate(r));
 const click=selector=>{const node=document.querySelector(selector);assert(node,selector);node.dispatchEvent(new Event('click',{bubbles:true}));};
 return {win,document,Event,click};
}
test('full portfolio consumes only the stable model and retains every section and record',async()=>{
 const env=await boot(),{document,click,Event}=env;assert.equal(document.querySelector('#portfolio').hidden,false);
 const sections=['hero','about','projects','experience','publications','education','skills','certificates','languages','references','contact'];for(const id of sections)assert(document.querySelector('#portfolio #'+id),id);
 assert.equal(document.querySelectorAll('[data-project-card]').length,12);assert.equal(document.querySelectorAll('[data-project-card]:not([hidden])').length,6);click('[data-project-more]');assert.equal(document.querySelectorAll('[data-project-card]:not([hidden])').length,12);
 const search=document.querySelector('[data-project-search]');search.value='Project 11';search.dispatchEvent(new Event('input'));assert.equal(document.querySelectorAll('[data-project-card]:not([hidden])').length,1);click('[data-open-project="project-11"]');assert(document.querySelector('#projectDialog').hasAttribute('open'));assert(document.querySelector('#projectDialogBody').textContent.includes('Full description 11'));
 assert.equal(document.querySelectorAll('[data-cert-card]').length,9);assert.equal(document.querySelectorAll('[data-cert-card]:not([hidden])').length,6);click('[data-cert-more]');assert.equal(document.querySelectorAll('[data-cert-card]:not([hidden])').length,9);
 assert.equal(document.querySelectorAll('#references details[open]').length,0);assert.equal(document.querySelectorAll('#portfolio img[onerror]').length,0);assert.equal(document.querySelector('#hero h1').textContent.replace(/\s+/g,''),'SyntheticProfile');assert.deepStrictEqual(env.win.portfolioView.raw,raw);
 assert.equal(document.body.dataset.effects,'off');click('#enableEffects');assert.equal(document.body.dataset.effects,'on');assert.equal(env.win.portfolioView.motionMode,'full');
 click('#jumpBtn');assert(document.querySelector('#jumpDialog').hasAttribute('open'));assert.equal(document.querySelectorAll('[data-jump]').length,11);
 click('#logoutBtn');for(let i=0;i<3;i++)await new Promise(r=>setImmediate(r));assert.equal(env.win.portfolioView.model,null);assert.equal(env.win.portfolioView.raw,null);assert.equal(document.querySelector('#portfolio').textContent,'');
});
test('unauthenticated visitor receives no profile markup; missing optional model collections fabricate no records',async()=>{
 const locked=await boot({auth:true});assert.equal(locked.document.querySelector('#accessForm').hidden,false);assert.equal(locked.document.querySelector('#portfolio').textContent,'');
 const empty=await boot({model:adaptCV({})});assert.equal(empty.document.querySelectorAll('[data-project-card]').length,0);assert.equal(empty.document.querySelectorAll('[data-cert-card]').length,0);assert(!empty.document.querySelector('#portfolio').textContent.includes('Synthetic'));
});
