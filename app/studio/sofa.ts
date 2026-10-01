import * as T from "three";
import {RoundedBoxGeometry} from "three/addons/geometries/RoundedBoxGeometry.js";
import {metricUV,type createSurfaceMaterials} from "../surfaceMaterials";

export function createSofa(finishes:ReturnType<typeof createSurfaceMaterials>){
  const root=new T.Group();root.position.set(-1.98,.028,.86);root.rotation.y=Math.PI/2;root.name="Linen reading sofa";
  const linen=finishes.material("fabric","#e2d7bd"),seam=finishes.material("wool","#c6bda7"),wood=finishes.material("wood","#a78b66"),green=finishes.material("wool","#798160");
  function box(size:number[],p:number[],m:T.Material,r=.045,parent:T.Object3D=root){const o=new T.Mesh(metricUV(new RoundedBoxGeometry(size[0],size[1],size[2],5,r),.8),m);o.position.set(p[0],p[1],p[2]);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
  box([1.64,.12,.74],[0,.22,0],wood,.022);box([1.60,.16,.72],[0,.32,0],linen);
  for(const x of [-.7,.7])for(const z of [-.27,.27])box([.055,.19,.055],[x,.1,z],wood,.009);
  for(const x of [-.80,.80])box([.15,.48,.76],[x,.48,0],linen,.055);
  box([1.47,.48,.13],[0,.53,-.31],linen,.055).rotation.x=-.09;
  const cushions=[-.37,.37].map(x=>{const g=new T.Group();g.position.set(x,.445,.033);root.add(g);box([.72,.14,.64],[0,0,0],linen,.055,g);
    const corners=[[-.31,-.26],[.31,-.26],[.33,-.24],[.33,.24],[.31,.26],[-.31,.26],[-.33,.24],[-.33,-.24],[-.31,-.26]].map(([a,b])=>new T.Vector3(a,.01,b));
    const piping=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(corners,true),64,.0024,5,true),seam);g.add(piping);return g;
  });
  for(const x of [-.36,.36]){const back=box([.70,.35,.16],[x,.66,-.21],linen,.05);back.rotation.x=-.13;}
  const pillow=box([.30,.31,.13],[.32,.64,-.075],green,.07);pillow.rotation.set(-.22,.12,-.13);
  // A draped wool throw follows the arm and falls toward the floor.
  const geo=new T.PlaneGeometry(.36,1,30,48),p=geo.getAttribute("position"),uv=geo.getAttribute("uv");
  const drape=new T.CatmullRomCurve3([new T.Vector3(-.56,.704,0),new T.Vector3(-.72,.733,0),new T.Vector3(-.845,.725,0),new T.Vector3(-.887,.61,0),new T.Vector3(-.899,.34,0),new T.Vector3(-.904,.105,0)]);
  for(let i=0;i<p.count;i++){const u=uv.getX(i),v=uv.getY(i),point=drape.getPoint(v);const fold=Math.sin(u*Math.PI*6)*.0035;p.setXYZ(i,point.x+fold*v,point.y+fold*(1-v),(u-.5)*.36+.07);}
  geo.computeVertexNormals();const cloth=green.clone();cloth.side=T.DoubleSide;const throwMesh=new T.Mesh(geo,cloth);throwMesh.castShadow=true;throwMesh.receiveShadow=true;root.add(throwMesh);
  for(let i=0;i<15;i++){const fringe=new T.Mesh(new T.CylinderGeometry(.0014,.0014,.022,4),green);fringe.position.set(-.904,.093,-.11+i*.025);root.add(fringe);}
  let remaining=0;
  return {root,touch(){remaining=2.6;},update(dt:number,instant:boolean){remaining=Math.max(0,remaining-dt);const dip=instant?0:Math.sin(Math.min(1,remaining/2.6)*Math.PI)*.024;cushions[1].position.y=.445-dip;cushions[1].scale.y=1-dip*3;return remaining>0&&!instant;}};
}
