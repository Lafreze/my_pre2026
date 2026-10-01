import * as T from "three";
import {RoundedBoxGeometry} from "three/addons/geometries/RoundedBoxGeometry.js";
import {metricUV, type createSurfaceMaterials} from "../surfaceMaterials";

export function createGramophone(finishes:ReturnType<typeof createSurfaceMaterials>){
  const root=new T.Group();root.name="Walnut and brass gramophone";root.position.set(2.18,.71,-2.12);root.rotation.y=-.18;
  const walnut=finishes.material("wood","#967452"),gold=finishes.material("metal","#c49a55"),dark=finishes.material("rubber","#1d2522"),label=finishes.material("paper","#9b553b");
  function mesh(g:T.BufferGeometry,m:T.Material,p:number[],parent:T.Object3D=root){const o=new T.Mesh(g,m);o.position.set(p[0],p[1],p[2]);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
  const box=(w:number,h:number,d:number,y:number)=>mesh(metricUV(new RoundedBoxGeometry(w,h,d,4,.012),1.2),walnut,[0,y,0]);
  box(.53,.09,.43,.075);box(.56,.028,.46,.129);box(.55,.022,.45,.022);
  for(const x of [-.2,.2])for(const z of [-.15,.15])mesh(new T.SphereGeometry(.024,16,10),gold,[x,.006,z]).scale.set(1,.55,1);
  for(const x of [-.24,.24])mesh(new T.BoxGeometry(.006,.041,.003),gold,[x,.075,.217]);
  mesh(new T.BoxGeometry(.086,.025,.004),gold,[0,.076,.217]);
  mesh(new T.CylinderGeometry(.187,.187,.009,80),gold,[-.028,.15,.017]);
  const record=new T.Group();record.position.set(-.028,.16,.017);root.add(record);
  mesh(new T.CylinderGeometry(.18,.18,.004,96),dark,[0,0,0],record);
  for(let i=0;i<23;i++){const groove=mesh(new T.TorusGeometry(.072+i*.0045,.0005,3,96),finishes.material("metal","#37413a"),[0,.0026,0],record);groove.rotation.x=Math.PI/2;}
  mesh(new T.CylinderGeometry(.046,.046,.001,48),label,[0,.003,0],record);
  mesh(new T.CylinderGeometry(.006,.006,.018,16),gold,[0,.008,0],record);
  const arm=new T.Group();arm.position.set(.19,.19,-.14);root.add(arm);
  mesh(new T.CylinderGeometry(.025,.03,.063,24),gold,[0,-.013,0],arm);
  const armCurve=new T.CatmullRomCurve3([new T.Vector3(),new T.Vector3(-.01,.026,.1),new T.Vector3(-.045,.013,.235),new T.Vector3(-.071,-.002,.265)]);
  mesh(new T.TubeGeometry(armCurve,32,.009,12,false),gold,[0,0,0],arm);
  const soundbox=mesh(new T.CylinderGeometry(.027,.027,.013,32),gold,[-.071,-.006,.265],arm);soundbox.rotation.x=Math.PI/2;
  mesh(new T.CylinderGeometry(.018,.018,.014,24),dark,[-.071,-.006,.268],arm).rotation.x=Math.PI/2;
  mesh(new T.CylinderGeometry(.0015,.0015,.018,8),gold,[-.071,-.024,.269],arm);
  // Continuous narrow neck into a double-sided flared bell, with a rolled lip.
  const neck=new T.CatmullRomCurve3([new T.Vector3(.17,.17,-.15),new T.Vector3(.19,.33,-.17),new T.Vector3(.12,.49,-.12),new T.Vector3(.04,.52,-.01)]);
  mesh(new T.TubeGeometry(neck,48,.026,16,false),gold,[0,0,0]);
  const bell=new T.Group();bell.position.set(.04,.52,-.01);bell.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),new T.Vector3(-.2,.38,1).normalize());root.add(bell);
  mesh(new T.CylinderGeometry(.020,.020,.004,32),dark,[0,.002,0],bell);
  const profile=[[.025,0],[.033,.035],[.05,.082],[.077,.132],[.121,.194],[.179,.253],[.235,.296],[.248,.30],[.247,.308],[.231,.305],[.174,.263],[.116,.205],[.073,.14],[.046,.09],[.029,.039],[.021,0]];
  mesh(new T.LatheGeometry(profile.map(([r,y])=>new T.Vector2(r,y)),96),gold,[0,0,0],bell);
  mesh(new T.TorusGeometry(.245,.004,8,96),gold,[0,.307,0],bell).rotation.x=Math.PI/2;
  for(let i=0;i<12;i++){const a=i*Math.PI/6;const points=profile.slice(1,7).map(([r,y])=>new T.Vector3(Math.sin(a)*(r+.001),y,Math.cos(a)*(r+.001)));mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),24,.0009,4,false),gold,[0,0,0],bell);}
  const crank=new T.CatmullRomCurve3([new T.Vector3(.267,.07,0),new T.Vector3(.33,.07,0),new T.Vector3(.33,.035,.045)]);mesh(new T.TubeGeometry(crank,12,.007,10,false),gold,[0,0,0]);mesh(new T.SphereGeometry(.018,16,12),walnut,[.33,.035,.045]).scale.set(1,1,1.7);
  return {root,update(dt:number,playing:boolean,instant:boolean){if(playing&&!instant)record.rotation.y-=dt*1.7;arm.rotation.y=T.MathUtils.damp(arm.rotation.y,playing?-.38:0,5,dt);return Math.abs(arm.rotation.y-(playing?-.38:0))>.001;}};
}
