'use client';
import {useEffect,useRef} from 'react';
import * as THREE from 'three';

export const yarnColors:Record<string,string>={omics:'#e3d7af',structural:'#a6bcbd',ml:'#b9a0a2',software:'#c59957',biotech:'#9ca77e'};
type Props={progress:number;tension:number;focus:string;motifs:string[];onReady:()=>void;onUnavailable:()=>void};
type Thread={geo:THREE.BufferGeometry;warp:boolean;index:number;category:string;mesh:THREE.Mesh};
const TAU=Math.PI*2;

export function LoomScene(props:Props){
  const host=useRef<HTMLDivElement>(null),current=useRef(props),update=useRef<(()=>void)|null>(null);
  useEffect(()=>{current.current=props;update.current?.();},[props]);
  useEffect(()=>{
    const el=host.current;if(!el)return;
    let renderer:THREE.WebGLRenderer;
    try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});}catch{current.current.onUnavailable();return;}
    renderer.setClearColor(0,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;
    const canvas=renderer.domElement;canvas.style.cssText='width:100%;height:100%;display:block;touch-action:pan-y';canvas.setAttribute('aria-hidden','true');el.append(canvas);
    const scene=new THREE.Scene(),world=new THREE.Group();scene.add(world);
    const camera=new THREE.OrthographicCamera(-8,8,4,-4,.1,100);camera.position.set(7.8,7.9,10.8);camera.lookAt(0,.05,0);
    scene.add(new THREE.HemisphereLight('#fff0ca','#07223d',2.5));const key=new THREE.DirectionalLight('#ffefca',3.6);key.position.set(-5,10,6);scene.add(key);const rim=new THREE.DirectionalLight('#719dbb',2.8);rim.position.set(5,3,-6);scene.add(rim);
    const brass=new THREE.MeshStandardMaterial({color:'#ad864a',metalness:.7,roughness:.3});const wood=new THREE.MeshStandardMaterial({color:'#6e4d32',metalness:.02,roughness:.72});const dark=new THREE.MeshStandardMaterial({color:'#173549',metalness:.2,roughness:.6});
    const frame=new THREE.Group();world.add(frame);
    function beam(x:number,z:number,w:number,d:number){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,.22,d),wood);mesh.position.set(x,-.26,z);frame.add(mesh);return mesh;}
    beam(-4.35,0,.27,6.8);beam(4.35,0,.27,6.8);beam(0,-3.25,8.9,.32);beam(0,3.25,8.9,.32);
    for(const z of [-3.1,3.1]){const roller=new THREE.Mesh(new THREE.CylinderGeometry(.2,.2,8.9,20),brass);roller.rotation.z=Math.PI/2;roller.position.set(0,-.06,z);frame.add(roller);}
    for(const x of [-4.35,4.35])for(const z of [-3.15,3.15]){const pin=new THREE.Mesh(new THREE.CylinderGeometry(.10,.10,.33,12),brass);pin.position.set(x,-.02,z);frame.add(pin);}
    const shuttle=new THREE.Group();const boat=new THREE.Mesh(new THREE.CylinderGeometry(.11,.11,1.45,10),brass);boat.rotation.z=Math.PI/2;shuttle.add(boat);const core=new THREE.Mesh(new THREE.CylinderGeometry(.16,.16,.6,14),wood);core.rotation.z=Math.PI/2;shuttle.add(core);world.add(shuttle);
    const threads:Thread[]=[];const samples=80,sides=5;const warpCount=44,weftCount=42;
    const mats=Object.fromEntries(Object.entries(yarnColors).map(([k,c])=>[k,new THREE.MeshStandardMaterial({color:c,roughness:.85,metalness:0})]));
    const muted=new THREE.MeshStandardMaterial({color:'#466578',roughness:1});
    function thread(warp:boolean,index:number){const count=(samples+1)*sides;const pos=new Float32Array(count*3),ind:number[]=[];for(let i=0;i<samples;i++)for(let j=0;j<sides;j++){const a=i*sides+j,b=i*sides+(j+1)%sides,c=(i+1)*sides+j,d=(i+1)*sides+(j+1)%sides;if(warp)ind.push(a,b,c,b,d,c);else ind.push(a,c,b,b,c,d);}const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));geo.setIndex(ind);const category=current.current.motifs[index%Math.max(1,current.current.motifs.length)]??'omics';const mesh=new THREE.Mesh(geo,mats[category]??mats.omics);mesh.frustumCulled=false;world.add(mesh);threads.push({geo,warp,index,category,mesh});}
    for(let i=0;i<warpCount;i++)thread(true,i);for(let i=0;i<weftCount;i++)thread(false,i);
    const reed=new THREE.Group();world.add(reed);for(let i=0;i<warpCount;i++){const eye=new THREE.Mesh(new THREE.TorusGeometry(.047,.009,5,12),brass);eye.rotation.x=Math.PI/2;eye.position.set(-3.85+i/(warpCount-1)*7.7,.06,-2.83);reed.add(eye);}
    const clothGeo=new THREE.PlaneGeometry(7.65,5.4,60,45);clothGeo.rotateX(-Math.PI/2);const clothMat=new THREE.MeshStandardMaterial({color:'#c3b78f',side:THREE.DoubleSide,roughness:1,transparent:true,opacity:.16});const cloth=new THREE.Mesh(clothGeo,clothMat);cloth.position.y=-.068;world.add(cloth);
    let p=current.current.progress,tension=current.current.tension,frameId=0,seen=true,ready=false,last=0;let w=1,h=1;
    const media=window.matchMedia('(prefers-reduced-motion: reduce)');const urlMode=new URLSearchParams(window.location.search).get('motion');const urlStill=urlMode==='still'||urlMode==='off',urlFull=urlMode==='full';
    const height=(x:number,z:number,pr:number,te:number)=>{const fold=Math.max(0,(pr-.55)/.45);return -.09*Math.cos(x*.6)+fold*(.36*Math.sin(x*.85+z*.4)+.12*Math.sin(z*2))+((1-te)*.2)*Math.sin(z*.65);};
    function pose(pr:number,te:number){
      const woven=-2.8+pr*6.15;
      for(const thread of threads){const {geo,warp,index}=thread;const arr=geo.attributes.position.array as Float32Array;const row=warp?-3.85+index/(warpCount-1)*7.7:-2.7+index/(weftCount-1)*5.4;
        for(let i=0;i<=samples;i++){const u=i/samples;let x=warp?row:-3.85+u*7.7,z=warp?-2.7+u*5.4:row;
          const crossing=warp?Math.cos((z+2.7)/5.4*(weftCount-1)*Math.PI+index*Math.PI):Math.cos((x+3.85)/7.7*(warpCount-1)*Math.PI+index*Math.PI);
          const set=warp?1:THREE.MathUtils.smoothstep(woven-row,-.24,.24);const unravel=warp?0:(1-set);let y=height(x,z,pr,te)+(warp?1:-1)*crossing*(.048+.022*(1-te));
          if(!warp){y+=unravel*(.65+.6*Math.sin(u*Math.PI)+index*.018);z+=unravel*(.18*Math.sin(u*TAU+index*.35));x+=(1-set)*.19*Math.sin(index*.73);}
          else y+=(1-pr)*.19*Math.sin(u*Math.PI)*(index%2?1:-1)*(1-te);
          const radius=warp?.026:.032;
          for(let j=0;j<sides;j++){const a=j*TAU/sides,at=(i*sides+j)*3;arr[at]=x+(warp?Math.cos(a)*radius:0);arr[at+1]=y+Math.sin(a)*radius;arr[at+2]=z+(warp?0:Math.cos(a)*radius);}
        }geo.attributes.position.needsUpdate=true;geo.computeVertexNormals();thread.mesh.material=current.current.focus==='all'||thread.category===current.current.focus?mats[thread.category]??mats.omics:muted;
      }
      const arr=clothGeo.attributes.position.array as Float32Array;for(let i=0;i<arr.length;i+=3){const x=arr[i],z=arr[i+2];arr[i+1]=height(x,z,pr,te)-.05;}clothGeo.attributes.position.needsUpdate=true;clothGeo.computeVertexNormals();clothMat.opacity=.08+Math.max(0,pr-.3)*.48;
      shuttle.position.set(Math.sin(pr*Math.PI*4)*3.3,.3+(1-te)*.55,woven-.05);shuttle.rotation.y=Math.sin(pr*Math.PI*4)*.1;
      world.rotation.y=-.14+pr*.25;world.rotation.z=(1-te)*.035;reed.position.y=(1-te)*.18;
    }
    function request(){if(!frameId&&seen&&!document.hidden)frameId=requestAnimationFrame(draw);}
    function draw(now:number){frameId=0;if(document.hidden||!seen)return;const dt=last?Math.min(.05,(now-last)/1000):.016;last=now;const q=current.current;const k=(media.matches&&!urlFull)||urlStill?1:1-Math.exp(-dt*8);p=Math.abs(q.progress-p)<.0005?q.progress:THREE.MathUtils.lerp(p,q.progress,k);tension=Math.abs(q.tension-tension)<.0005?q.tension:THREE.MathUtils.lerp(tension,q.tension,k);pose(p,tension);renderer.render(scene,camera);if(!ready){ready=true;q.onReady();}if(p!==q.progress||tension!==q.tension)request();else last=0;}
    function resize(){w=el!.clientWidth;h=el!.clientHeight;if(!w||!h)return;const aspect=w/h;const vh=Math.max(6.7,10.6/aspect);camera.left=-vh*aspect/2;camera.right=vh*aspect/2;camera.top=vh/2;camera.bottom=-vh/2;camera.updateProjectionMatrix();renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.6));renderer.setSize(w,h,false);request();}
    const ro=new ResizeObserver(resize);ro.observe(el);const io=new IntersectionObserver((es)=>{seen=es[0]?.isIntersecting??true;if(seen)request();else if(frameId){cancelAnimationFrame(frameId);frameId=0;}});io.observe(el);
    function visibility(){if(document.hidden){if(frameId)cancelAnimationFrame(frameId);frameId=0;last=0;}else request();}function lost(e:Event){e.preventDefault();current.current.onUnavailable();}document.addEventListener('visibilitychange',visibility);canvas.addEventListener('webglcontextlost',lost);media.addEventListener('change',request);update.current=request;resize();
    return()=>{update.current=null;if(frameId)cancelAnimationFrame(frameId);ro.disconnect();io.disconnect();document.removeEventListener('visibilitychange',visibility);canvas.removeEventListener('webglcontextlost',lost);media.removeEventListener('change',request);const gs=new Set<THREE.BufferGeometry>(),ms=new Set<THREE.Material>();scene.traverse((o)=>{if(o instanceof THREE.Mesh){gs.add(o.geometry);(Array.isArray(o.material)?o.material:[o.material]).forEach((m)=>ms.add(m));}});gs.forEach((g)=>g.dispose());ms.forEach((m)=>m.dispose());Object.values(mats).forEach((m)=>m.dispose());muted.dispose();dark.dispose();renderer.dispose();canvas.remove();};
  },[]);
  return <div ref={host} style={{position:'absolute',inset:0}}/>;
}
export default LoomScene;
