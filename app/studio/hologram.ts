import * as T from "three";
import {RoundedBoxGeometry} from "three/addons/geometries/RoundedBoxGeometry.js";

/** A fixed optical base projects a separate light field. No physical object changes dimensions. */
export function createHologram() {
  const base=new T.Group();base.position.set(1.26,.709,-2.13);base.userData.objectId="checklist";base.name="Holographic projector";
  const metal=new T.MeshStandardMaterial({color:"#c3cbbd",roughness:.3,metalness:.55}),dark=new T.MeshStandardMaterial({color:"#25483f",roughness:.45}),glass=new T.MeshPhysicalMaterial({color:"#67b6a7",roughness:.12,metalness:.25,transparent:true,opacity:.7,clearcoat:1});
  const glow=new T.MeshBasicMaterial({color:"#9debd8",transparent:true,opacity:.6});
  function mesh(g:T.BufferGeometry,m:T.Material,x:number,y:number,z:number,parent:T.Object3D=base){const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=!(m instanceof T.MeshBasicMaterial);o.receiveShadow=true;parent.add(o);return o;}
  mesh(new T.CylinderGeometry(.22,.235,.054,64),dark,0,.03,0);mesh(new T.CylinderGeometry(.217,.22,.025,64),metal,0,.07,0);
  const lens=mesh(new T.SphereGeometry(.115,40,20,0,Math.PI*2,0,Math.PI/2),glass,0,.084,0);lens.scale.y=.24;
  for(const r of [.13,.192]){const ring=mesh(new T.TorusGeometry(r,.0035,8,64),glow,0,.087,0);ring.rotation.x=Math.PI/2;}
  for(let i=0;i<28;i++){const a=i*Math.PI*2/28;const vent=mesh(new RoundedBoxGeometry(.018,.018,.003,2,.001),dark,Math.sin(a)*.218,.038,Math.cos(a)*.218);vent.rotation.y=a;}
  const button=mesh(new T.CylinderGeometry(.014,.014,.002,20),glow,.095,.085,.138);button.name="Projector power";
  const panel=new T.Group();panel.name="Projected light field";panel.position.set(1.26,1.48,-1.12);panel.rotation.y=-.35;panel.userData.objectId="checklist";
  const width=1.1264,height=.64;
  const face=new T.Object3D();panel.add(face);
  const screenMat=new T.MeshBasicMaterial({color:"#bbf3df",transparent:true,opacity:0,side:T.DoubleSide,depthWrite:false});
  const screen=mesh(new T.PlaneGeometry(width,height),screenMat,0,0,0,panel);screen.castShadow=false;screen.receiveShadow=false;screen.raycast=()=>{};
  const edgeMat=new T.LineBasicMaterial({color:"#b1efdd",transparent:true,opacity:0,depthWrite:false});
  const corners:T.Vector3[]=[];
  for(const x of [-1,1])for(const y of [-1,1]){corners.push(new T.Vector3(x*(width/2-.09),y*height/2,.002),new T.Vector3(x*width/2,y*height/2,.002),new T.Vector3(x*width/2,y*(height/2-.065),.002));}
  // Separate corner brackets leave the content free of decorative scan lines.
  for(let i=0;i<4;i++){const line=new T.Line(new T.BufferGeometry().setFromPoints(corners.slice(i*3,i*3+3)),edgeMat);line.raycast=()=>{};panel.add(line);}
  const beamMat=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,uniforms:{strength:{value:0}},vertexShader:`varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`varying vec2 v;uniform float strength;void main(){float edge=pow(abs(v.x-.5)*2.,4.);gl_FragColor=vec4(.48,.86,.76,strength*(.2+edge*.5)*(1.-v.y*.8));}`});
  const bottomLeft=new T.Vector3(-width/2,-height/2,0).applyEuler(panel.rotation).add(panel.position).sub(base.position);
  const bottomRight=new T.Vector3(width/2,-height/2,0).applyEuler(panel.rotation).add(panel.position).sub(base.position);
  const beamGeo=new T.BufferGeometry();beamGeo.setAttribute("position",new T.Float32BufferAttribute([-.10,.106,0,.10,.106,0,...bottomRight.toArray(),...bottomLeft.toArray()],3));beamGeo.setAttribute("uv",new T.Float32BufferAttribute([0,0,1,0,1,1,0,1],2));beamGeo.setIndex([0,1,2,0,2,3]);
  const beam=mesh(beamGeo,beamMat,0,0,0);beam.castShadow=false;beam.receiveShadow=false;beam.raycast=()=>{};
  const standby=new T.Group();standby.position.y=.27;base.add(standby);
  const wire=new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(.14,.14,.14)),new T.LineBasicMaterial({color:"#8edac5",transparent:true,opacity:.65}));standby.add(wire);
  let open=0,clock=0;
  return {base,panel,face,width,height,update(active:boolean,dt:number,instant:boolean,motion:boolean){
    const goal=active?1:0;open=instant?goal:T.MathUtils.damp(open,goal,5,dt);if(Math.abs(open-goal)<.002)open=goal;
    if(motion)clock+=dt;
    screenMat.opacity=open*.16;edgeMat.opacity=open*.65;beamMat.uniforms.strength.value=.055+open*.065;
    standby.visible=open<.95;standby.scale.setScalar(1-open);wire.rotation.set(.25,clock*.22,.12);
    glow.opacity=.5+Math.sin(clock*1.1)*.08;
    return Math.abs(open-goal)>.002;
  },get open(){return open;},dispose(){const mats=new Set<T.Material>();for(const root of [base,panel]){root.traverse(o=>{if(o instanceof T.Mesh||o instanceof T.Line){o.geometry.dispose();mats.add(o.material as T.Material);}});root.removeFromParent();}mats.forEach(m=>m.dispose());}};
}
