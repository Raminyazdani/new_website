'use client';
import { useRef } from 'react';
import * as THREE from 'three';
import { useMeshStage, type MeshWorld, type StagePose } from './meshStage';

const smooth = (n: number) => { const v = THREE.MathUtils.clamp(n, 0, 1); return v * v * (3 - 2 * v); };
function strandPoint(t: number, progress: number) {
  const j = Math.min(6, Math.floor(t * 7));
  const local = Math.min(1, t * 7 - j);
  const ring = j / 7 * Math.PI * 2 + .3;
  const access = smooth(progress / .48);
  const release = smooth((progress - .32) / .65);
  const center = new THREE.Vector3(Math.cos(ring) * 1.7, Math.sin(ring) * 1.2, Math.sin(ring * 2) * .8);
  center.lerp(new THREE.Vector3((j - 3) * 1.68, .14 * Math.sin(j), 0), access);
  const turn = local * Math.PI * 3.4 + j * .43;
  const wound = center.add(new THREE.Vector3(Math.cos(turn) * .77, (local - .5) * .90, Math.sin(turn) * .77));
  const open = new THREE.Vector3((t - .5) * 12.4, Math.sin(t * Math.PI * 14) * .18, Math.cos(t * Math.PI * 14) * .18);
  return wound.lerp(open, release);
}

function createWorld(): MeshWorld {
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-7, 7, 4, -4, .1, 50);
  camera.position.set(0, 1.2, 15); camera.lookAt(0, 0, 0);
  const sculpture = new THREE.Group(); scene.add(sculpture);
  scene.add(new THREE.HemisphereLight('#e9efff', '#1a306e', 2.6));
  for (const [color, strength, x, y, z] of [['#fff1d8', 4.4, -5, 6, 7], ['#ff9278', 1.6, 5, -1, 4], ['#668eea', 3.4, 1, 3, -5]] as const) {
    const light = new THREE.DirectionalLight(color, strength); light.position.set(x,y,z); scene.add(light);
  }
  const coral = new THREE.MeshPhysicalMaterial({color:'#ed8d7f',roughness:.28,metalness:.13,clearcoat:.65,clearcoatRoughness:.3});
  const ivory = new THREE.MeshPhysicalMaterial({color:'#f8efd7',roughness:.29,metalness:.06,clearcoat:.45});
  const warm = new THREE.MeshStandardMaterial({color:'#efa08b',roughness:.42});
  const cores: THREE.Group[] = [];
  const barrel = new THREE.CylinderGeometry(.52,.57,.63,28,1);
  const cap = new THREE.SphereGeometry(.26,14,10);
  const ringGeo = new THREE.TorusGeometry(.56,.055,7,34);
  for(let j=0;j<7;j++){
    const g=new THREE.Group();
    const body=new THREE.Mesh(barrel,coral);g.add(body);
    for(let k=0;k<8;k++){const a=k/4*Math.PI;const bead=new THREE.Mesh(cap,k%2?coral:warm);bead.position.set(Math.cos(a)*.39,k<4?.24:-.24,Math.sin(a)*.39);bead.scale.set(1,.8,1);g.add(bead);}
    for(const y of [-.3,.3]){const rim=new THREE.Mesh(ringGeo,ivory);rim.rotation.x=Math.PI/2;rim.position.y=y;g.add(rim);}
    cores.push(g);sculpture.add(g);
  }
  const geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(Array.from({length:180},(_,i)=>strandPoint(i/179,0))),560,.058,7,false);
  const twinGeometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(Array.from({length:180},(_,i)=>strandPoint(i/179,0))),560,.032,6,false);
  for(const g of [geometry,twinGeometry]){(g.attributes.position as THREE.BufferAttribute).setUsage(THREE.DynamicDrawUsage);(g.attributes.normal as THREE.BufferAttribute).setUsage(THREE.DynamicDrawUsage);}
  const wire=new THREE.Mesh(geometry,ivory);
  const twin=new THREE.Mesh(twinGeometry,new THREE.MeshStandardMaterial({color:'#ffd0aa',roughness:.4}));
  wire.frustumCulled=false;twin.frustumCulled=false;
  sculpture.add(wire,twin);
  const pinGeometry=new THREE.SphereGeometry(.12,16,12);
  const pins=Array.from({length:7},(_,index)=>{
    const pin=new THREE.Mesh(pinGeometry,new THREE.MeshStandardMaterial({color:'#ffeecc',emissive:'#de7654',emissiveIntensity:.18,roughness:.25}));
    pin.userData.record=index;sculpture.add(pin);return pin;
  });
  let last=-1;let width=1;let height=1;
  function update(pose:StagePose){
    const p=pose.progress; const access=smooth(p/.48); const release=smooth((p-.32)/.65);
    sculpture.rotation.set(-.12+p*.18,pose.angle+.16*(1-p),-.20*(1-p));
    if(Math.abs(last-p)>.0008){
      const points=Array.from({length:180},(_,i)=>strandPoint(i/179,p));
      const curve=new THREE.CatmullRomCurve3(points);
      const frames=curve.computeFrenetFrames(560,false);
      const center=new THREE.Vector3();const normal=new THREE.Vector3();
      for(const [g,radial,radius,offset] of [[geometry,7,.058,0],[twinGeometry,6,.032,.10]] as const){
        const positions=g.attributes.position as THREE.BufferAttribute;const normals=g.attributes.normal as THREE.BufferAttribute;
        for(let i=0;i<=560;i++){
          curve.getPointAt(i/560,center);
          if(offset)center.addScaledVector(frames.normals[i],Math.cos(i*.4)*offset).addScaledVector(frames.binormals[i],Math.sin(i*.4)*offset);
          for(let j=0;j<=radial;j++){
            const a=j/radial*Math.PI*2;
            normal.copy(frames.normals[i]).multiplyScalar(-Math.cos(a)).addScaledVector(frames.binormals[i],Math.sin(a));
            const index=i*(radial+1)+j;
            positions.setXYZ(index,center.x+normal.x*radius,center.y+normal.y*radius,center.z+normal.z*radius);
            normals.setXYZ(index,normal.x,normal.y,normal.z);
          }
        }
        positions.needsUpdate=true;normals.needsUpdate=true;
      }
      cores.forEach((g,j)=>{const a=j/7*Math.PI*2+.3;g.position.set(Math.cos(a)*1.7,Math.sin(a)*1.2,Math.sin(a*2)*.8).lerp(new THREE.Vector3((j-3)*1.68,.14*Math.sin(j)-release*1.4,0),access);g.scale.setScalar(1-release*.26);g.rotation.z=release*(j%2?.18:-.18);});
      pins.forEach((pin,i)=>pin.position.copy(strandPoint((i+.5)/7,p)).add(new THREE.Vector3(0,.15,.18)));
      last=p;
    }
    pins.forEach((pin,i)=>{pin.visible=p>.48&&i<Math.round(pose.view);pin.scale.setScalar(i===pose.selected?1.65:1);});
    const span=6.6+6.8*smooth(p/.9);
    const annotations=width>=900?smooth((p-.18)/.40):0;
    const leftRail=170*annotations,rightRail=270*annotations;
    const scale=Math.min((width-leftRail-rightRail)/span,height/(5.5-1.2*p));
    const shift=(rightRail-leftRail)/2/scale;
    camera.left=-width/scale/2+shift;camera.right=width/scale/2+shift;camera.top=height/scale/2;camera.bottom=-height/scale/2;camera.updateProjectionMatrix();
  }
  return {scene,camera,resize:(w,h)=>{width=w;height=h;},update,pick:(ray)=>{const hit=ray.intersectObjects(pins.filter(pin=>pin.visible))[0];return hit?hit.object.userData.record as number:null;}};
}

export function ChromatinScene({progress,selected,count,onSelect}:{progress:number;selected:number;count:number;onSelect:(index:number)=>void}){
  const host=useRef<HTMLDivElement>(null);
  const status=useMeshStage(host,createWorld,{progress,view:Math.min(7,count),angle:0,selected},onSelect);
  return <div className="ch-scene" ref={host} data-status={status}>
    {status!=='ready'&&<svg className="ch-fallback" viewBox="0 0 1000 430" aria-hidden="true"><g fill="none" stroke="#ffe6c6" strokeWidth="5">{Array.from({length:7},(_,i)=>{const x=500+Math.cos(i/7*Math.PI*2)*130*(1-progress)+(i-3)*105*progress;const y=215+Math.sin(i/7*Math.PI*2)*90*(1-progress);return <g key={i}><ellipse cx={x} cy={y} rx={42-progress*22} ry="54" fill="#df8a7c" stroke="#f5b39a"/><path d={`M${x-48} ${y-30}q-20 42 48 45t48-45`} /></g>;})}<path d={`M90 215Q300 ${215-90*(1-progress)} 500 215T910 215`} /></g></svg>}
  </div>;
}
