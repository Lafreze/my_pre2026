import * as T from "three";
import type {createSurfaceMaterials} from "../surfaceMaterials";

/** Pleats retain their depth as the fabric is gathered along the rail. */
export function createCurtains(width:number,height:number,finishes:ReturnType<typeof createSurfaceMaterials>){
  const root=new T.Group();root.name="Linen curtains on brass rail";root.position.z=.055;
  const linen=finishes.material("fabric","#e9dfc5").clone();linen.side=T.DoubleSide;linen.roughness=.93;linen.sheen=.8;
  const brass=finishes.material("metal","#ad9160");
  const rail=new T.Mesh(new T.CylinderGeometry(.011,.011,width+.42,20),brass);rail.rotation.z=Math.PI/2;rail.position.set(0,height/2+.115,.16);root.add(rail);
  for(const sign of [-1,1]){const finial=new T.Mesh(new T.SphereGeometry(.023,16,12),brass);finial.position.set(sign*(width/2+.23),rail.position.y,.16);root.add(finial);}
  const panels=[-1,1].map(sign=>{
    const geometry=new T.PlaneGeometry(1,1,72,22), cloth=new T.Mesh(geometry,linen);cloth.castShadow=true;cloth.receiveShadow=true;root.add(cloth);
    const rings=Array.from({length:9},()=>{const ring=new T.Mesh(new T.TorusGeometry(.018,.003,6,16),brass);ring.position.y=rail.position.y-.009;ring.position.z=.16;root.add(ring);return ring;});
    return {sign,geometry,cloth,rings};
  });
  let openness=1,goal=1;
  function shape(){for(const {sign,geometry,rings} of panels){
    const p=geometry.getAttribute("position"),uv=geometry.getAttribute("uv"),span=T.MathUtils.lerp(width/2+.115,.21,openness),outer=width/2+.105;
    for(let i=0;i<p.count;i++){const u=uv.getX(i),v=uv.getY(i);p.setXYZ(i,sign*(outer-u*span),height/2+.075-(1-v)*(height+.11)+Math.sin(u*Math.PI*16)*.007*(1-v),.17+sign*.001+Math.cos(u*Math.PI*16)*(.016+openness*.013)+Math.sin((1-v)*Math.PI)*.014);}
    p.needsUpdate=true;geometry.computeVertexNormals();
    rings.forEach((ring,i)=>ring.position.x=sign*(outer-i/8*span));
  }}
  shape();
  return {root,get open(){return openness;},get target(){return goal;},toggle(){goal=goal?0:1;},update(dt:number,instant:boolean){const old=openness;openness=instant?goal:T.MathUtils.damp(openness,goal,4,dt);if(Math.abs(openness-goal)<.001)openness=goal;if(openness!==old)shape();return openness!==goal;},dispose(){panels.forEach(p=>p.geometry.dispose());linen.dispose();}};
}
