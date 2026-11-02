(function(w){
 'use strict';
 const paths={dna:'M5 3c0 6 14 12 14 18M19 3C19 9 5 15 5 21M7 5h10M9 9h6M9 15h6M7 19h10',flask:'M9 3h6M10 3v7L4 20q0 1 2 1h12q2 0 2-1l-6-10V3M7 16h10',code:'m8 6-6 6 6 6m8-12 6 6-6 6m-3-15-2 18',branch:'M5 4v12q0 4 4 4h10M5 12h8q4 0 4-4V4M3 3h4M15 3h4M18 18l3 2-3 2',book:'M3 4h7q2 0 2 2v15q0-2-3-2H3zm18 0h-7q-2 0-2 2v15q0-2 3-2h6z',arrow:'M4 12h15m-6-6 6 6-6 6',cell:'M21 11c2 8-12 14-17 6S8 1 15 3s6 4 6 8ZM10 8c5-2 7 5 3 7s-6-6-3-7Z'};
 function icon(name){return `<svg class="science-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name]||paths.cell}"/></svg>`;}
 // These generated forms illustrate visual language, not an identified molecule or dataset.
 function geometry(kind){
  if(kind==='molecule'){
   const points=Array.from({length:6},(_,i)=>[Math.cos(i*Math.PI/3)*65,Math.sin(i*Math.PI/3)*65,(i%2?1:-1)*18]);
   const bonds=points.map((_,i)=>[i,(i+1)%6]);
   for(let i=0;i<6;i++){const a=i*Math.PI/3;points.push([Math.cos(a)*112,Math.sin(a)*112,(i%2?1:-1)*46]);bonds.push([i,i+6]);}
   points.push([105,-94,55],[137,-58,0],[-126,55,-16]);bonds.push([6,12],[12,13],[8,14]);
   return {points,bonds};
  }
  if(kind==='protein'){
   const points=Array.from({length:32},(_,i)=>{const a=i*.66;return [Math.cos(a)*55+(i-16)*4,Math.sin(a)*65,Math.cos(i*.24)*45];});
   return {points,bonds:points.slice(1).map((_,i)=>[i,i+1])};
  }
  const points=Array.from({length:22},(_,i)=>{const a=i*2.399;const r=20+Math.sqrt(i)*20;return [Math.cos(a)*r,Math.sin(a)*r*.8,Math.sin(i*1.7)*45];});
  return {points,bonds:points.slice(1).map((_,i)=>[i+1,Math.floor(i/2)])};
 }
 function project(points,angle=0,tilt=.2){return points.map(([x,y,z])=>{const X=x*Math.cos(angle)+z*Math.sin(angle),Z=z*Math.cos(angle)-x*Math.sin(angle),Y=y*Math.cos(tilt)-Z*Math.sin(tilt),D=Z*Math.cos(tilt)+y*Math.sin(tilt),s=390/(390+D);return {x:160+X*s,y:135+Y*s,z:D,s};});}
 function diagram(kind,angle){const g=geometry(kind),p=project(g.points,angle);return g.bonds.map(([a,b])=>`<line class="science-bond" x1="${p[a].x}" y1="${p[a].y}" x2="${p[b].x}" y2="${p[b].y}"/>`).join('')+p.map((v,i)=>`<circle class="science-node science-node-${i%3}" cx="${v.x}" cy="${v.y}" r="${(kind==='protein'?5:8)*v.s}"/>`).join('');}
 function cellDiagram(){return `<g data-cell-body><path class="science-membrane" d="M40 100C29 47 97 10 164 24S294 54 282 130 244 246 165 244 25 204 40 100Z"/><path class="science-cytoplasm" d="M51 103C40 58 103 24 162 36S282 63 270 130 236 234 166 232 37 198 51 103Z"/><ellipse class="science-nucleus" cx="164" cy="135" rx="45" ry="40" transform="rotate(-22 164 135)"/><circle class="science-nucleolus" cx="172" cy="131" r="14"/><g class="science-organelle"><path d="M78 67c-24 4-20 37 3 32s24-35-3-32Zm-7 5 12 4-11 8 13 7M230 153c-21-9-34 22-13 31s35-22 13-31Zm-3 5-12 6 12 3-8 10M92 179c-26-2-28 29-5 33s32-30 5-33Zm-7 6 12 6-14 4 10 10"/></g><g class="science-folds"><path d="M207 64q-32-6-20 18t-2 23M215 70q-29-5-17 18t-3 23M224 78q-27-5-15 18t-4 23M98 124q-24 14-9 31m15-26q-20 12-7 25m14-20q-17 10-7 22"/></g><g class="science-vesicles"><circle cx="113" cy="66" r="5"/><circle cx="241" cy="118" r="7"/><circle cx="142" cy="203" r="5"/><circle cx="68" cy="147" r="4"/><circle cx="207" cy="207" r="4"/></g></g>`;}
 function art(kind='cell'){
  if(!['cell','molecule','protein','code'].includes(kind))kind='cell';
  if(kind==='code')return `<div class="science-code-art" aria-hidden="true"><span>{</span><i>sequence</i><b>→</b><i>model</i><b>→</b><i>insight</i><span>}</span></div>`;
  const label=kind==='molecule'?'Molecular form':kind==='protein'?'Folded chain':'Cell anatomy';
  return `<figure class="science-art" data-science="${kind}"><svg viewBox="0 0 320 270" role="img" aria-label="${label}, illustrative ${kind==='cell'?'anatomy':'three-dimensional geometry'}"><g>${kind==='cell'?cellDiagram():diagram(kind,0)}</g></svg><figcaption><span>${label} · illustrative</span><div class="science-controls"><button type="button" data-science-turn aria-label="Rotate ${label.toLowerCase()}">Rotate ↻</button><button type="button" data-science-reset aria-label="Reset ${label.toLowerCase()}">Reset</button></div></figcaption></figure>`;
 }
 let cleanup=()=>{};
 function mount(root){
  cleanup();let frame=0,prior=0,observer;
  const scenes=[...root.querySelectorAll('[data-science]')].map(el=>({el,svg:el.querySelector('svg'),g:geometry(el.dataset.science),angle:0,tilt:.2,visible:false,drag:null}));
  const removers=[];
  function on(el,event,fn,options){el.addEventListener(event,fn,options);removers.push(()=>el.removeEventListener(event,fn,options));}
  function draw(s){if(s.el.dataset.science==='cell'){s.svg.querySelector('[data-cell-body]').setAttribute('transform',`rotate(${Math.sin(s.angle)*12} 160 135)`);return;}const p=project(s.g.points,s.angle,s.tilt),lines=s.svg.querySelectorAll('line'),nodes=s.svg.querySelectorAll('circle');s.g.bonds.forEach(([a,b],i)=>{const n=lines[i];n.setAttribute('x1',p[a].x);n.setAttribute('y1',p[a].y);n.setAttribute('x2',p[b].x);n.setAttribute('y2',p[b].y);});p.forEach((v,i)=>{const n=nodes[i];n.setAttribute('cx',v.x);n.setAttribute('cy',v.y);n.setAttribute('r',(s.el.dataset.science==='protein'?5:8)*v.s);n.style.opacity=String(.65+.3*v.s);});}
  scenes.forEach(s=>{
   on(s.el.querySelector('[data-science-turn]'),'click',()=>{s.angle+=Math.PI/5;draw(s);});
   on(s.el.querySelector('[data-science-reset]'),'click',()=>{s.angle=0;s.tilt=.2;draw(s);});
   on(s.svg,'pointerdown',e=>{if(e.pointerType==='touch')return;s.drag={x:e.clientX,y:e.clientY,a:s.angle,t:s.tilt};s.svg.setPointerCapture?.(e.pointerId);});
   on(s.svg,'pointermove',e=>{if(!s.drag)return;s.angle=s.drag.a+(e.clientX-s.drag.x)*.009;s.tilt=s.drag.t+(e.clientY-s.drag.y)*.006;draw(s);});
   on(s.svg,'pointerup',()=>{s.drag=null;});on(s.svg,'pointercancel',()=>{s.drag=null;});
  });
  if(w.IntersectionObserver){observer=new w.IntersectionObserver(entries=>entries.forEach(e=>{const s=scenes.find(s=>s.el===e.target);if(s)s.visible=e.isIntersecting;sync();}));scenes.forEach(s=>observer.observe(s.el));}
  else scenes.forEach(s=>s.visible=true);
  function active(){return document.body.dataset.effects==='on'&&!document.hidden&&scenes.some(s=>s.visible);}
  function sync(){if(active()){if(!frame)frame=w.requestAnimationFrame(tick);}else if(frame){w.cancelAnimationFrame?.(frame);frame=0;}}
  function tick(t){frame=0;if(!active())return;if(t-prior>50){const dt=Math.min(t-prior,100);prior=t;if(document.body.dataset.effects==='on'&&!document.hidden)scenes.forEach(s=>{if(s.visible&&!s.drag){s.angle+=dt*.00012;draw(s);}});}frame=w.requestAnimationFrame(tick);}
  let motionObserver;if(w.MutationObserver){motionObserver=new w.MutationObserver(sync);motionObserver.observe(document.body,{attributes:true,attributeFilter:['data-effects','class']});}on(document,'visibilitychange',sync);if(scenes.length&&w.requestAnimationFrame)sync();
  cleanup=()=>{if(frame)w.cancelAnimationFrame?.(frame);observer?.disconnect();motionObserver?.disconnect();removers.forEach(fn=>fn());};
 }
 w.PortfolioScience={icon,art,mount,unmount:()=>cleanup(),geometry,project};
})(window);
