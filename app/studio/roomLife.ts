import * as T from "three";
import {RoundedBoxGeometry} from "three/addons/geometries/RoundedBoxGeometry.js";
import {createSteamEffect} from "./steamEffect";

/** Floor route clears the rug, table legs, desk chair and plant pots by the robot radius. */
export function createRoomLife() {
  const root=new T.Group();root.name="Room life";
  const robot=new T.Group();root.add(robot);robot.scale.y=.72;robot.name="Robot vacuum";
  const ivory=new T.MeshStandardMaterial({color:"#e3e4d9",roughness:.38,metalness:.05}),rubber=new T.MeshStandardMaterial({color:"#303d39",roughness:.9}),silver=new T.MeshStandardMaterial({color:"#92a59a",roughness:.25,metalness:.7}),lens=new T.MeshPhysicalMaterial({color:"#1d3434",roughness:.16,clearcoat:1}),led=new T.MeshBasicMaterial({color:"#a3d3c1"});
  function mesh(g:T.BufferGeometry,m:T.Material,p:[number,number,number],parent:T.Object3D=robot){const o=new T.Mesh(g,m);o.position.set(...p);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
  const cylinder=(r:number,h:number,y:number,m:T.Material,parent=robot)=>mesh(new T.CylinderGeometry(r,r,h,64),m,[0,y,0],parent);
  cylinder(.183,.028,.05,rubber);cylinder(.18,.065,.091,ivory);cylinder(.176,.008,.128,silver);cylinder(.171,.006,.133,ivory);
  cylinder(.039,.029,.153,ivory);cylinder(.034,.012,.165,lens);cylinder(.03,.004,.173,ivory);
  const bumper=new T.Mesh(new T.TorusGeometry(.181,.008,8,64,Math.PI),rubber);bumper.rotation.set(Math.PI/2,0,Math.PI);bumper.position.y=.073;robot.add(bumper);
  for(const x of [-.177,.177]){const wheel=mesh(new T.CylinderGeometry(.034,.034,.023,16),rubber,[x,.035,0]);wheel.rotation.z=Math.PI/2;}
  for(const x of [-.065,.065]){const eye=mesh(new T.SphereGeometry(.014,12,8),lens,[x,.084,.163]);eye.scale.set(1,.5,.38);}
  mesh(new RoundedBoxGeometry(.024,.002,.012,2,.004),led,[.066,.139,.01]);
  mesh(new RoundedBoxGeometry(.024,.002,.012,2,.004),silver,[.066,.139,-.02]);
  for(let i=0;i<9;i++)mesh(new T.BoxGeometry(.028,.004,.004),rubber,[-.055+i*.013,.136,-.105]);
  const brush=new T.Group();brush.position.set(.145,.019,.10);robot.add(brush);
  for(let i=0;i<3;i++)for(let j=0;j<5;j++){
    const a=i*Math.PI*2/3+(j-2)*.07;
    const bristle=mesh(new T.CylinderGeometry(.0014,.0014,.064,4),rubber,[Math.cos(a)*.033,0,Math.sin(a)*.033],brush);bristle.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),new T.Vector3(Math.cos(a),0,Math.sin(a)));
  }
  const dock=new T.Group();dock.position.set(2.08,.028,-2.27);root.add(dock);dock.name="Charging dock";
  mesh(new RoundedBoxGeometry(.42,.024,.3,3,.01),rubber,[0,.013,.015],dock);
  mesh(new RoundedBoxGeometry(.33,.20,.076,3,.018),ivory,[0,.11,-.10],dock);
  for(const x of [-.08,.08])mesh(new T.BoxGeometry(.035,.016,.014),silver,[x,.05,-.052],dock);
  mesh(new T.BoxGeometry(.026,.007,.003),led,[0,.182,-.06],dock);
  const cable=new T.CatmullRomCurve3([new T.Vector3(2.23,.04,-2.36),new T.Vector3(2.4,.038,-2.42),new T.Vector3(2.5,.10,-2.44)]);
  mesh(new T.TubeGeometry(cable,20,.004,6,false),rubber,[0,0,0],root);
  const route=new T.CatmullRomCurve3([[1.18,-1.1],[1.18,-.45],[1.18,.45],[1.18,1.5],[.78,1.90],[-.78,1.90],[-1.12,1.55],[-1.12,.64],[-.90,-.04],[.35,-.12],[.9,-.65]].map(([x,z])=>new T.Vector3(x,.029,z)),true,"centripetal");
  const steam=createSteamEffect({count:12,height:.28,width:.055,seed:3});steam.root.position.set(-.79,.865,-1.34);root.add(steam.root);
  // Second quiet movement: bubbles in the cup are intentionally omitted; freshly poured coffee only steams.
  let elapsed=0;
  return {root,robot,update(dt:number,motion:boolean,paused=false,coffee=false){
    if(motion&&!paused)elapsed+=dt;
    const t=(elapsed/130)%1,point=route.getPointAt(t),tangent=route.getTangentAt(t);robot.position.copy(point);robot.rotation.y=Math.atan2(tangent.x,tangent.z);
    if(motion&&!paused)brush.rotation.y+=dt*4.5;
    steam.update(dt,coffee?1.15:.85,!motion&&!coffee);
  },snapshot:()=>({robot:robot.position.toArray(),steam:steam.snapshot(),time:elapsed}),dispose(){steam.dispose();root.traverse(o=>{if(o instanceof T.Mesh){o.geometry.dispose();(o.material as T.Material).dispose();}});root.removeFromParent();}};
}
