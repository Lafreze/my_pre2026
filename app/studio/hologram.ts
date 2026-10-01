import * as T from "three";
import {RoundedBoxGeometry} from "three/addons/geometries/RoundedBoxGeometry.js";
import {createSurfaceMaterials,metricUV} from "../surfaceMaterials";

/** A fixed optical instrument; articulated emitters unfold a separate light field. */
export function createHologram(finishes:ReturnType<typeof createSurfaceMaterials>) {
  const base=new T.Group();base.position.set(1.26,.709,-2.13);base.userData.objectId="checklist";base.name="Tri-axis holographic instrument";
  const metal=finishes.material("metal","#788d96"),dark=finishes.material("metal","#263d48"),rubber=finishes.material("rubber","#111f27");
  const glass=new T.MeshPhysicalMaterial({color:"#62c7da",roughness:.09,metalness:.25,transparent:true,opacity:.5,clearcoat:1});
  const glow=new T.MeshBasicMaterial({color:"#8ee9ff",transparent:true,opacity:.8});
  function mesh(g:T.BufferGeometry,m:T.Material,x:number,y:number,z:number,parent:T.Object3D=base){const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=!(m instanceof T.MeshBasicMaterial);o.receiveShadow=true;parent.add(o);return o;}
  function box(w:number,h:number,d:number,x:number,y:number,z:number,m:T.Material,parent:T.Object3D=base){return mesh(metricUV(new RoundedBoxGeometry(w,h,d,3,Math.min(w,h,d)*.18)),m,x,y,z,parent);}
  const ring=(r:number,tube:number,y:number,m:T.Material,parent:T.Object3D=base)=>{const o=mesh(new T.TorusGeometry(r,tube,8,64),m,0,y,0,parent);o.rotation.x=Math.PI/2;return o;};
  mesh(new T.CylinderGeometry(.245,.26,.037,8),rubber,0,.021,0);
  mesh(new T.CylinderGeometry(.225,.245,.055,8),dark,0,.065,0);
  mesh(new T.CylinderGeometry(.215,.225,.016,64),metal,0,.101,0);
  mesh(new T.CylinderGeometry(.16,.16,.005,64),rubber,0,.112,0);
  ring(.204,.003,.109,glow);ring(.165,.0025,.115,glow);ring(.116,.004,.12,metal);
  const lens=mesh(new T.SphereGeometry(.11,40,24,0,Math.PI*2,0,Math.PI/2),glass,0,.115,0);lens.scale.y=.32;
  for(let i=0;i<32;i++){const a=i*Math.PI/16;const vent=box(.015,.025,.009,Math.sin(a)*.229,.059,Math.cos(a)*.229,rubber);vent.rotation.y=a;}
  for(let i=0;i<8;i++){const a=i*Math.PI/4;mesh(new T.CylinderGeometry(.006,.006,.002,12),metal,Math.sin(a)*.189,.113,Math.cos(a)*.189);}
  const arms:T.Group[]=[];
  for(let i=0;i<3;i++){
    const mount=new T.Group();mount.rotation.y=i*Math.PI*2/3;base.add(mount);
    const arm=new T.Group();arm.position.set(0,.105,.17);mount.add(arm);arms.push(arm);
    const hinge=mesh(new T.CylinderGeometry(.022,.022,.074,24),metal,0,0,0,arm);hinge.rotation.z=Math.PI/2;
    box(.033,.158,.032,0,.072,0,dark,arm);box(.005,.10,.002,0,.065,.019,glow,arm);
    const optic=mesh(new T.CylinderGeometry(.029,.032,.039,24),metal,0,.157,0,arm);optic.rotation.x=.55;
    const aperture=mesh(new T.CircleGeometry(.021,24),glow,0,.174,.011,arm);aperture.rotation.x=-1.02;
  }
  const core=new T.Group();core.position.y=.31;base.add(core);
  const crystal=mesh(new T.OctahedronGeometry(.064,0),glass,0,0,0,core);
  const wire=new T.LineSegments(new T.EdgesGeometry(new T.OctahedronGeometry(.065)),new T.LineBasicMaterial({color:"#b0f3ff",transparent:true,opacity:.72}));core.add(wire);
  const gimbals=[ring(.095,.0025,0,glow,core),ring(.113,.0015,0,glow,core)];gimbals[0].rotation.x=.55;gimbals[1].rotation.z=.65;
  const panel=new T.Group();panel.name="Projected light field";panel.position.set(1.26,1.49,-1.12);panel.rotation.y=-.35;
  const width=1.1264,height=.64,face=new T.Object3D();panel.add(face);
  const screenMat=new T.MeshBasicMaterial({color:"#244450",transparent:true,opacity:0,side:T.DoubleSide,depthWrite:false});
  const screen=mesh(new T.PlaneGeometry(width,height),screenMat,0,0,0,panel);screen.castShadow=false;screen.receiveShadow=false;screen.raycast=()=>{};
  const edgeMat=new T.LineBasicMaterial({color:"#83e7ff",transparent:true,opacity:0,depthWrite:false});
  for(const x of [-1,1])for(const y of [-1,1]){const line=new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(x*(width/2-.10),y*height/2,.002),new T.Vector3(x*width/2,y*height/2,.002),new T.Vector3(x*width/2,y*(height/2-.055),.002)]),edgeMat);line.raycast=()=>{};panel.add(line);}
  const scanMat=new T.ShaderMaterial({transparent:true,side:T.DoubleSide,depthWrite:false,blending:T.AdditiveBlending,uniforms:{open:{value:0}},vertexShader:`varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`varying vec2 v;uniform float open;void main(){float a=exp(-abs(v.y-open)*150.)*sin(open*3.14159);gl_FragColor=vec4(.45,.88,1.,a*.65);}`});
  const scan=mesh(new T.PlaneGeometry(width,height),scanMat,0,0,.004,panel);scan.raycast=()=>{};scan.castShadow=false;
  const beamMat=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,uniforms:{strength:{value:0}},vertexShader:`varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`varying vec2 v;uniform float strength;void main(){float edge=pow(abs(v.x-.5)*2.,5.);gl_FragColor=vec4(.35,.78,1.,strength*(.14+edge*.6)*(1.-v.y*.8));}`});
  const left=new T.Vector3(-width/2,-height/2,0).applyEuler(panel.rotation).add(panel.position).sub(base.position),right=new T.Vector3(width/2,-height/2,0).applyEuler(panel.rotation).add(panel.position).sub(base.position);
  const beamGeo=new T.BufferGeometry();beamGeo.setAttribute("position",new T.Float32BufferAttribute([-.08,.14,0,.08,.14,0,...right.toArray(),...left.toArray()],3));beamGeo.setAttribute("uv",new T.Float32BufferAttribute([0,0,1,0,1,1,0,1],2));beamGeo.setIndex([0,1,2,0,2,3]);
  const beam=mesh(beamGeo,beamMat,0,0,0);beam.castShadow=false;beam.receiveShadow=false;beam.raycast=()=>{};
  let open=0,clock=0;
  return {base,panel,face,width,height,focus:base.position.clone().add(new T.Vector3(0,.26,0)),update(goal:number,dt:number,instant:boolean,motion:boolean){
    // Choreography supplies a continuous reveal, after the camera has seen the device.
    open=instant?goal:T.MathUtils.damp(open,goal,13,dt);if(Math.abs(open-goal)<.002)open=goal;
    if(motion||goal>0&&open<1)clock+=dt;
    screenMat.opacity=open*.18;edgeMat.opacity=open*.8;beamMat.uniforms.strength.value=open*.15;scanMat.uniforms.open.value=open;
    arms.forEach(arm=>arm.rotation.x=.48-open*.76);core.position.y=.31+Math.sin(clock*1.5)*.009;
    crystal.rotation.y=clock*.3;wire.rotation.copy(crystal.rotation);gimbals[0].rotation.z=clock*.24;gimbals[1].rotation.y=-clock*.18;
    glow.opacity=.74+Math.sin(clock*1.4)*.06;
    return Math.abs(open-goal)>.002;
  },get open(){return open;},dispose(){const borrowed=new Set<T.Material>([metal,dark,rubber]),mats=new Set<T.Material>();for(const root of [base,panel]){root.traverse(o=>{if(o instanceof T.Mesh||o instanceof T.Line){o.geometry.dispose();if(!borrowed.has(o.material as T.Material))mats.add(o.material as T.Material);}});root.removeFromParent();}mats.forEach(m=>m.dispose());}};
}
