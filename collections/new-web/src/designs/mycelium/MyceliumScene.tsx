'use client';
import {useRef} from 'react';
import * as THREE from 'three';
import {hash01} from '@/lib/derive';
import {useMeshStage,type MeshWorld,type StagePose} from '../chromatin/meshStage';
const clamp=(n:number)=>THREE.MathUtils.clamp(n,0,1);
const point=(t:number,lane:number)=>new THREE.Vector3(-6.6+t*13.2,-.7-Math.sin(t*Math.PI)*(.3+lane*.06)+Math.sin(t*17+lane)*.13,Math.sin(t*9+lane*.7)*.32+(lane-3)*.34);
function build():MeshWorld{
const scene=new THREE.Scene();const camera=new THREE.OrthographicCamera(-8,8,4,-4,.1,60);camera.position.set(0,3.5,12);camera.lookAt(0,-.6,0);
scene.add(new THREE.HemisphereLight('#e4d1a2','#18251b',2.8));
for(const [color,intensity,x,y,z]of[['#fff0c2',3.7,-5,7,7],['#bfac75',2.4,7,3,-5],['#779a77',1.4,-3,-2,3]]as const){const light=new THREE.DirectionalLight(color,intensity);light.position.set(x,y,z);scene.add(light);}
const world=new THREE.Group();scene.add(world);
const soilGeometry=new THREE.BoxGeometry(16,.30,5.5,70,1,20);
const positions=soilGeometry.attributes.position;
const colors=new Float32Array(positions.count*3);const color=new THREE.Color();
for(let i=0;i<positions.count;i++){const x=positions.getX(i),z=positions.getZ(i);positions.setY(i,positions.getY(i)+Math.sin(x*1.6)*.07+Math.sin(z*3+x)*.035);color.setHSL(.11+hash01(String(i),1)*.025,.15,.14+hash01(String(i),5)*.08);color.toArray(colors,i*3);}
soilGeometry.setAttribute('color',new THREE.BufferAttribute(colors,3));soilGeometry.computeVertexNormals();
const soil=new THREE.Mesh(soilGeometry,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,metalness:0,transparent:true,opacity:.78}));soil.position.y=.13;world.add(soil);
const grainGeo=new THREE.IcosahedronGeometry(.04,0);const grains=new THREE.InstancedMesh(grainGeo,new THREE.MeshStandardMaterial({color:'#a59266',roughness:1}),230);const dummy=new THREE.Object3D();
for(let i=0;i<230;i++){dummy.position.set((hash01(String(i),11)-.5)*15.6,.36+hash01(String(i),14)*.04,(hash01(String(i),18)-.5)*5.1);dummy.scale.setScalar(.25+hash01(String(i),22)*1.3);dummy.updateMatrix();grains.setMatrixAt(i,dummy.matrix);}
world.add(grains);
type Fiber={mesh:THREE.Mesh<THREE.TubeGeometry,THREE.MeshStandardMaterial>;start:number;end:number;node:number};
const fibers:Fiber[]=[];
const materials=[new THREE.MeshStandardMaterial({color:'#d8c795',roughness:.6}),new THREE.MeshStandardMaterial({color:'#f0dec0',roughness:.55}),new THREE.MeshStandardMaterial({color:'#acb08b',roughness:.65})];
function addFiber(points:THREE.Vector3[],radius:number,start:number,end:number,node=-1){
const curve=new THREE.CatmullRomCurve3(points);const geometry=new THREE.TubeGeometry(curve,72,radius,5,false);const mesh=new THREE.Mesh(geometry,materials[fibers.length%3]);mesh.frustumCulled=false;world.add(mesh);fibers.push({mesh,start,end,node});
}
for(let lane=0;lane<7;lane++){
addFiber(Array.from({length:45},(_,i)=>point(i/44,lane)),lane===3?.041:.021,0,1);
for(let j=0;j<6;j++){
const t=.08+j*.15+hash01('f'+lane,j)*.04;const base=point(t,lane);const side=(lane+j)%2?1:-1;
const points=Array.from({length:14},(_,i)=>{const f=i/13;return base.clone().add(new THREE.Vector3(Math.sin(f*2)*.65+f*.63,-Math.sin(f*Math.PI/2)*(.25+hash01('r'+lane,j)*.44),side*f*(.45+hash01('d'+lane,j)*.65)));});
addFiber(points,.009+hash01('radius'+lane,j)*.008,t,Math.min(1,t+.20));
}
}
const endpoints=Array.from({length:7},(_,i)=>point(.10+i*.13,3).add(new THREE.Vector3(0,-.18,(i%2?1:-1)*.85)));
const markers:THREE.Group[]=[];const fruits:THREE.Group[]=[];
const markerGeo=new THREE.SphereGeometry(.13,14,10);const markerMat=new THREE.MeshStandardMaterial({color:'#dbbc7b',emissive:'#94713e',emissiveIntensity:.15,roughness:.5});
const capGeo=new THREE.SphereGeometry(.30,24,12,0,Math.PI*2,0,Math.PI*.60);const capMat=new THREE.MeshPhysicalMaterial({color:'#ac8653',roughness:.55,clearcoat:.12});
for(let i=0;i<7;i++){
const start=point(.10+i*.13,3);const end=endpoints[i];
addFiber(Array.from({length:12},(_,j)=>{const p=start.clone().lerp(end,j/11);p.y-=Math.sin(j/11*Math.PI)*.15;return p;}),.024,.10+i*.13,.19+i*.13,i);
const marker=new THREE.Group();const ball=new THREE.Mesh(markerGeo,markerMat);const ring=new THREE.Mesh(new THREE.TorusGeometry(.23,.012,6,28),new THREE.MeshBasicMaterial({color:'#e2cc92'}));ring.rotation.x=-.25;marker.add(ball,ring);marker.position.copy(end);marker.traverse(o=>{o.userData.record=i;});world.add(marker);markers.push(marker);
const fruit=new THREE.Group();const stem=new THREE.Mesh(new THREE.CylinderGeometry(.047,.068,.52,12),new THREE.MeshStandardMaterial({color:'#e6d5b3',roughness:.7}));stem.position.y=.26;fruit.add(stem);
const cap=new THREE.Mesh(capGeo,capMat);cap.position.y=.52;cap.scale.y=.58;fruit.add(cap);
for(let k=0;k<14;k++){const a=k/14*Math.PI*2;const gill=new THREE.Mesh(new THREE.BoxGeometry(.008,.012,.22),new THREE.MeshStandardMaterial({color:'#715c3c',roughness:1}));gill.rotation.y=a;gill.position.set(Math.sin(a)*.13,.50,Math.cos(a)*.13);fruit.add(gill);}
fruit.position.set(end.x,.3,end.z);fruit.traverse(o=>{o.userData.record=i;});world.add(fruit);fruits.push(fruit);
}
let width=1,height=1;
function update(p:StagePose){
const growth=.40+p.progress*.60;const fruit=clamp((p.progress-.60)/.40);
world.rotation.y=p.angle*.22;
fibers.forEach(f=>{const fraction=clamp((growth-f.start)/(f.end-f.start));const full=f.mesh.geometry.index?.count??0;f.mesh.geometry.setDrawRange(0,Math.floor(full*fraction/30)*30);const active=f.node===p.selected;f.mesh.scale.setScalar(active?1.006:1);});
markers.forEach((m,i)=>{m.visible=i<(p.count??7)&&growth>.19+i*.13;m.scale.setScalar(i===p.selected?1.55:1);});
fruits.forEach((g,i)=>{g.visible=i<(p.count??7)&&fruit>.001;g.scale.setScalar(Math.max(.001,fruit*(.7+hash01('fruit',i)*.5)));});
const span=width<650?11.5:16.2;const scale=Math.min(width/span,height/5.3);
camera.left=-width/scale/2;camera.right=width/scale/2;camera.top=height/scale/2;camera.bottom=-height/scale/2;
camera.position.set(-2.5*(1-p.progress),3.5-p.progress*1.1,12-p.progress*.8);camera.lookAt(-2.5*(1-p.progress),-.45-p.progress*.16,0);camera.updateProjectionMatrix();
}
return{scene,camera,resize:(w,h)=>{width=w;height=h;},update,pick:ray=>{const hit=ray.intersectObjects([...markers,...fruits].filter(m=>m.visible),true)[0];return hit?Number(hit.object.userData.record):null;}};
}
export function MyceliumScene({progress,selected,count,onSelect}:{progress:number;selected:number;count:number;onSelect:(n:number)=>void}){
const host=useRef<HTMLDivElement>(null);const status=useMeshStage(host,build,{progress,view:0,angle:0,selected,count:Math.min(7,count)},onSelect);
return <div ref={host} className="my-canvas" data-status={status}>{status!=='ready'&&<svg className="my-fallback" viewBox="0 0 1200 420" aria-hidden="true"><path d="M0 135Q300 90 600 122T1200 110V150H0" fill="#494735"/><g fill="none" stroke="#d4bf8c" strokeWidth="2">{Array.from({length:14},(_,i)=><path key={i} d={`M70 ${180+i*3}C300 ${115+i*8} 490 ${290-i*3} 1100 ${205+i*3}`} pathLength="100" strokeDasharray={`${24+progress*76} 100`}/>)}</g><g fill="#c9a570">{Array.from({length:7},(_,i)=><circle key={i} cx={145+i*135} cy={240+Math.sin(i)*30} r={i===selected?10:6}/>)}</g></svg>}</div>;
}
