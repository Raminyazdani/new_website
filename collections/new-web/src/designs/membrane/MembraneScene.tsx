'use client';
import {useRef} from 'react';
import * as THREE from 'three';
import {useMeshStage,type MeshWorld,type StagePose} from '../chromatin/meshStage';
const clamp=(v:number)=>THREE.MathUtils.clamp(v,0,1);
const ease=(v:number)=>{const n=clamp(v);return n*n*(3-2*n);};
const LIPIDS=Array.from({length:2},(_,side)=>Array.from({length:7},(_,row)=>Array.from({length:38},(_,col)=>({side:side===0?1:-1,x:(col-18.5)*.36,z:(row-3)*.36}))).flat()).flat();
function build():MeshWorld{
const scene=new THREE.Scene();const camera=new THREE.OrthographicCamera(-8,8,4,-4,.1,70);camera.position.set(0,3.1,10);camera.lookAt(0,0,0);
scene.add(new THREE.HemisphereLight('#ffffff','#91c9c0',2.8));
for(const [color,power,x,y,z]of[['#ffffff',3.1,-5,8,6],['#7eb9b8',2.6,5,2,-5],['#daf8e8',1.5,-4,-2,2]]as const){const light=new THREE.DirectionalLight(color,power);light.position.set(x,y,z);scene.add(light);}
const world=new THREE.Group();scene.add(world);
const headGeo=new THREE.SphereGeometry(.145,16,11);
const tailGeo=new THREE.CylinderGeometry(.024,.029,.63,6);
const heads=new THREE.InstancedMesh(headGeo,new THREE.MeshPhysicalMaterial({color:'#74b9b0',roughness:.3,metalness:.05,clearcoat:.5}),LIPIDS.length);
const tails=new THREE.InstancedMesh(tailGeo,new THREE.MeshStandardMaterial({color:'#d9bca4',roughness:.5}),LIPIDS.length*2);
heads.instanceMatrix.setUsage(THREE.DynamicDrawUsage);tails.instanceMatrix.setUsage(THREE.DynamicDrawUsage);heads.frustumCulled=false;tails.frustumCulled=false;
world.add(heads,tails);
const gates:THREE.Group[]=[];
const protein=new THREE.MeshPhysicalMaterial({color:'#257c7c',roughness:.29,metalness:.15,clearcoat:.6});
const proteinLight=new THREE.MeshPhysicalMaterial({color:'#55a69a',roughness:.26,clearcoat:.65});
const capsule=new THREE.CapsuleGeometry(.27,1.5,7,16);
for(let i=0;i<6;i++){const g=new THREE.Group();const body=new THREE.Mesh(capsule,i%2?protein:proteinLight);body.rotation.z=(i%2?1:-1)*.07;g.add(body);
for(const y of [-.85,.85]){const collar=new THREE.Mesh(new THREE.SphereGeometry(.34,14,10),protein);collar.position.y=y;collar.scale.set(1,.6,1);g.add(collar);}
world.add(g);gates.push(g);}
const cargo=Array.from({length:4},(_,i)=>{const mesh=new THREE.Mesh(new THREE.IcosahedronGeometry(.12+i*.012,1),new THREE.MeshStandardMaterial({color:'#e7a275',roughness:.32,metalness:.08}));world.add(mesh);return mesh;});
const ringGeo=new THREE.TorusGeometry(.24,.014,7,35);
const markers=Array.from({length:4},(_,i)=>{const g=new THREE.Group();const b=new THREE.Mesh(new THREE.SphereGeometry(.09,12,9),new THREE.MeshStandardMaterial({color:'#f2b18a',emissive:'#ad683c',emissiveIntensity:.12}));const r=new THREE.Mesh(ringGeo,new THREE.MeshBasicMaterial({color:'#2c7975'}));r.rotation.x=-Math.PI/2;g.add(b,r);g.userData.record=i;b.userData.record=i;r.userData.record=i;world.add(g);return g;});
const matrix=new THREE.Matrix4();const rotation=new THREE.Quaternion();const position=new THREE.Vector3();const scale=new THREE.Vector3();
let width=1,height=1,lastP=-1,lastV=-1;
function update(p:StagePose){
const gate=ease(p.progress/.48);const translation=ease((p.progress-.55)/.45);const explode=ease(1-Math.abs(p.view-1));const plan=ease(p.view-1);
world.rotation.y=p.angle*.3;
if(Math.abs(lastP-p.progress)>.0005||Math.abs(lastV-p.view)>.0005){
LIPIDS.forEach((lipid,i)=>{
const hole=Math.hypot(lipid.x,lipid.z)<.85+gate*.10;const cut=p.view<.5&&lipid.z>.65&&Math.abs(lipid.x)<1.8;
const hidden=hole||cut;const offset=lipid.side*(.82+explode*.85+translation*.17);
position.set(lipid.x,offset,lipid.z);scale.setScalar(hidden?.001:1);matrix.compose(position,rotation,scale);heads.setMatrixAt(i,matrix);
for(let k=0;k<2;k++){position.set(lipid.x+(k?1:-1)*.045,offset-lipid.side*.44,lipid.z);scale.set(hidden?.001:1,hidden?.001:1,hidden?.001:1);const q=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),(k?1:-1)*.11);matrix.compose(position,q,scale);tails.setMatrixAt(i*2+k,matrix);}
});
heads.instanceMatrix.needsUpdate=true;tails.instanceMatrix.needsUpdate=true;
gates.forEach((g,i)=>{const a=i/6*Math.PI*2;const radius=.43+gate*.33;g.position.set(Math.cos(a)*radius,0,Math.sin(a)*radius);g.rotation.y=-a;g.scale.y=1+explode*.1;});
cargo.forEach((m,i)=>{const travel=clamp((p.progress-.18)*1.52-i*.11);m.position.set(Math.sin(i*2)*(.14+(1-travel)*.35),2.25-travel*4.5,Math.cos(i*2)*.17);m.scale.setScalar(.8+translation*.35);});
markers.forEach((m,i)=>m.position.set([-3.7,-1.9,2.2,4.6][i],1.07+explode*.85,[-.1,.15,.45,-.45][i]));
lastP=p.progress;lastV=p.view;
}
markers.forEach((m,i)=>{m.visible=i<(p.count??4);m.scale.setScalar(i===p.selected?1.35:1);});
const span=width<650?9.7:15.4;const pixels=Math.min(width/span,height/(plan>0?5.6:5.8));
camera.left=-width/pixels/2;camera.right=width/pixels/2;camera.top=height/pixels/2;camera.bottom=-height/pixels/2;
camera.position.set(0,THREE.MathUtils.lerp(3.1,11,plan),THREE.MathUtils.lerp(10,.7,plan));camera.lookAt(0,0,0);camera.updateProjectionMatrix();
}
return{scene,camera,resize:(w,h)=>{width=w;height=h;},update,pick:ray=>{const hit=ray.intersectObjects(markers.filter(m=>m.visible),true)[0];return hit?Number(hit.object.userData.record):null;}};
}
export function MembraneScene({progress,view,selected,count,onSelect}:{progress:number;view:number;selected:number;count:number;onSelect:(n:number)=>void}){
const host=useRef<HTMLDivElement>(null);const status=useMeshStage(host,build,{progress,view,angle:0,selected,count:Math.min(count,4)},onSelect);
return <div className="mb-canvas" ref={host} data-status={status}>{status!=='ready'&&<svg className="mb-fallback" viewBox="0 0 1100 390" aria-hidden="true"><g fill="#72b3a9" stroke="#227a75">{Array.from({length:38},(_,i)=><g key={i}><circle cx={55+i*27} cy={147-view*9} r="10"/><circle cx={55+i*27} cy={240+view*9} r="10"/><path d={`M${52+i*27} ${157-view*9}v31m6-31v31M${52+i*27} ${230+view*9}v-31m6 31v-31`} stroke="#c7aa8b" strokeWidth="3"/></g>)}</g><path d={`M${520-progress*20} 120v140M${575+progress*20} 120v140`} stroke="#287875" strokeWidth="30" strokeLinecap="round"/><circle cx="549" cy={75+progress*245} r="10" fill="#db9c76"/></svg>}</div>;
}
