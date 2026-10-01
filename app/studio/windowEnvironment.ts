import * as T from "three";
import {RoundedBoxGeometry} from "three/addons/geometries/RoundedBoxGeometry.js";
import {sunDirection,type Environment} from "./environment";

/** Window-local +Z points into the room; every layer stays inside the real wall aperture. */
export function createWindow(position:T.Vector3,rotation:number,width:number,height:number,oak:T.Material) {
  const root=new T.Group();root.name="Architectural window";root.position.copy(position);root.rotation.y=rotation;
  const white=new T.MeshStandardMaterial({color:"#f4eedc",roughness:.6}),seal=new T.MeshStandardMaterial({color:"#647266",roughness:.84}),brass=new T.MeshStandardMaterial({color:"#aa9671",roughness:.31,metalness:.74});
  function box(w:number,h:number,d:number,x:number,y:number,z:number,m:T.Material,r=.006){const b=new T.Mesh(new RoundedBoxGeometry(w,h,d,2,r),m);b.position.set(x,y,z);b.castShadow=true;b.receiveShadow=true;root.add(b);return b;}
  for(const x of [-width/2-.038,width/2+.038]){
    box(.075,height+.16,.16,x,0,.035,oak);box(.032,height+.055,.05,x-Math.sign(x)*.02,0,.122,white);
    box(.008,height,.02,x-Math.sign(x)*.039,0,.073,seal,.002);
  }
  for(const y of [-height/2-.04,height/2+.04]){box(width,.08,.16,0,y,.035,oak);box(width+.04,.027,.055,0,y-Math.sign(y)*.02,.127,white);}
  box(width+.3,.058,.31,0,-height/2-.094,.085,white,.014);
  box(.034,height,.085,0,0,.09,white);box(width,.026,.065,0,.10,.086,white);
  // Recessed gasket, hinge barrels and a lever attached to the middle stile.
  box(.014,.082,.018,.032,-.16,.146,brass,.004);box(.048,.012,.029,.05,-.14,.168,brass,.004);
  for(const y of [-height*.32,height*.32])for(const x of [-width/2+.017,width/2-.017]){
    const hinge=new T.Mesh(new T.CylinderGeometry(.009,.009,.07,12),brass);hinge.position.set(x,y,.132);root.add(hinge);
  }
  const sky=new T.ShaderMaterial({depthWrite:false,side:T.DoubleSide,uniforms:{clock:{value:0},top:{value:new T.Color()},bottom:{value:new T.Color()},cloud:{value:.1},night:{value:0},sun:{value:new T.Vector2(.3,.7)}},vertexShader:`varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`
    varying vec2 v;uniform vec3 top,bottom;uniform float clock,cloud,night;uniform vec2 sun;
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
    void main(){vec3 c=mix(bottom,top,smoothstep(.1,1.,v.y));vec2 p=v*vec2(3.,6.)+vec2(clock*.007,0.);float n=noise(p)+.5*noise(p*2.1)+.25*noise(p*4.3);float clouds=smoothstep(1.15-cloud*.5,1.45-cloud*.2,n)*smoothstep(.2,.55,v.y);c=mix(c,mix(vec3(.94,.95,.92),vec3(.23,.29,.35),night),clouds*(.18+cloud*.57));
      vec2 q=(v-sun)*vec2(1.45,1.);float disk=1.-smoothstep(.026,.032,length(q));float halo=exp(-length(q)*19.)*.2;c+=vec3(1.,.85,.61)*(disk*.5+halo)*(1.-cloud)* (1.-night);
      float star=step(.997,hash(floor(v*vec2(170.,105.))))*(1.-smoothstep(.025,.07,length(fract(v*vec2(170.,105.))-.5)));c+=vec3(.67,.74,.8)*star*night*(1.-cloud)*smoothstep(.35,.7,v.y);
      vec2 moon=(v-vec2(.78,.79))*vec2(1.45,1.);float crescent=(1.-smoothstep(.026,.029,length(moon)))*smoothstep(.022,.026,length(moon-vec2(.01,.004)));c+=vec3(.8,.85,.73)*crescent*night*(1.-cloud*.8);gl_FragColor=vec4(c,1.);
    }`});
  const skyMesh=new T.Mesh(new T.PlaneGeometry(width,height),sky);skyMesh.position.z=-.10;skyMesh.raycast=()=>{};root.add(skyMesh);
  const canvas=document.createElement("canvas");canvas.width=1024;canvas.height=768;const ctx=canvas.getContext("2d")!;
  const landscapeTexture=new T.CanvasTexture(canvas);landscapeTexture.colorSpace=T.SRGBColorSpace;
  const landscapeMat=new T.MeshBasicMaterial({map:landscapeTexture,transparent:true,depthWrite:false,side:T.DoubleSide});
  const landscape=new T.Mesh(new T.PlaneGeometry(width,height),landscapeMat);landscape.position.z=-.08;landscape.raycast=()=>{};root.add(landscape);
  const glass=new T.Mesh(new T.PlaneGeometry(width,height),new T.MeshPhysicalMaterial({color:"#dfede6",roughness:.1,metalness:.03,transparent:true,opacity:.035,clearcoat:1,depthWrite:false,side:T.DoubleSide}));glass.position.z=.058;glass.raycast=()=>{};root.add(glass);
  // The fragment shader clips the precipitation at the pane edges, including each flake's radius.
  const rain=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,uniforms:{clock:{value:0},rain:{value:0},snow:{value:0},fog:{value:0},night:{value:0}},vertexShader:`varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`
    varying vec2 v;uniform float clock,rain,snow,fog,night;
    float hash(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
    void main(){float a=0.;vec2 p=vec2(v.x*65.+v.y*6.,v.y*8.+clock*3.7);vec2 cell=floor(p),f=fract(p);float drops=(1.-smoothstep(.012,.055,abs(f.x-.5)))*(1.-smoothstep(.05,.65,f.y))*step(.35,hash(cell));a+=drops*rain*.42;
      for(int i=0;i<2;i++){float layer=float(i)+1.;vec2 q=v*vec2(22.,15.)*layer+vec2(sin(clock*.24+v.y*5.)*.27,clock*.55*layer);vec2 j=floor(q),s=fract(q)-.5;float flake=(1.-smoothstep(.018,.075,length(s)))*step(.5,hash(j));a+=flake*snow*.8;}
      a+=fog*(.1+.15*(1.-v.y));a*=smoothstep(0.,.016,v.x)*smoothstep(0.,.016,1.-v.x)*smoothstep(0.,.016,v.y)*smoothstep(0.,.016,1.-v.y);gl_FragColor=vec4(mix(vec3(.84,.9,.93),vec3(.49,.61,.69),night),a);
    }`});
  const weatherMesh=new T.Mesh(new T.PlaneGeometry(width,height),rain);weatherMesh.position.z=.069;weatherMesh.raycast=()=>{};root.add(weatherMesh);
  const shaftRoot=new T.Group();shaftRoot.name="Sun-aligned window light";
  const beams:T.Mesh[]=[];
  for(let i=0;i<2;i++){
    const g=new T.BufferGeometry();g.setAttribute("position",new T.Float32BufferAttribute(new Float32Array(12),3));g.setAttribute("uv",new T.Float32BufferAttribute([0,0,1,0,1,1,0,1],2));g.setIndex([0,1,2,0,2,3]);
    const m=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,uniforms:{strength:{value:0}},vertexShader:`varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`varying vec2 v;uniform float strength;void main(){float soft=sin(v.x*3.14159)*pow(1.-v.y,1.4);gl_FragColor=vec4(1.,.91,.70,soft*strength);}`});
    const b=new T.Mesh(g,m);b.frustumCulled=false;b.raycast=()=>{};shaftRoot.add(b);beams.push(b);
  }
  let key="",clock=0;
  function paint(env:Environment,night:number){
    ctx.clearRect(0,0,1024,768);
    const autumn=env.season==="autumn",winter=env.season==="winter",spring=env.season==="spring";
    const colors=winter?["#acbac0","#cdd7d4","#dce0d6"]:autumn?["#82998b","#8d9c78","#a5ac7f"]:["#799e98","#82a58b","#a5b89a"];
    for(let j=0;j<3;j++){
      ctx.beginPath();ctx.moveTo(0,768);for(let x=0;x<=1024;x+=8)ctx.lineTo(x,335+j*64+Math.sin(x*.004+j*2)*38+Math.sin(x*.011+j)*14);ctx.lineTo(1024,768);ctx.closePath();ctx.fillStyle=colors[j];ctx.fill();
    }
    ctx.fillStyle=winter?"#e4e6dd":"#b4c8be";ctx.beginPath();ctx.moveTo(380,475);ctx.bezierCurveTo(860,565,190,597,700,768);ctx.lineTo(920,768);ctx.bezierCurveTo(410,570,930,556,424,473);ctx.fill();
    for(let i=0;i<24;i++){
      const x=(i*193+36)%1060,y=448+(i*97)%230,h=35+(i*23)%85;
      ctx.strokeStyle="#626f58";ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y-h);ctx.moveTo(x,y-h*.45);ctx.lineTo(x-13,y-h*.73);ctx.moveTo(x,y-h*.55);ctx.lineTo(x+16,y-h*.85);ctx.stroke();
      if(!winter){for(let j=0;j<5;j++){ctx.fillStyle=(spring?["#b7be99","#d4beb2","#9cb48c"]:autumn?["#b79b61","#a97546","#8f9260"]:["#658a66","#83a47b","#74936c"])[(i+j)%3];ctx.beginPath();ctx.ellipse(x+Math.sin(j*2.4)*h*.18,y-h*.78+Math.cos(j*2.4)*h*.16,h*.2,h*.19,0,0,Math.PI*2);ctx.fill();}}
      else{ctx.strokeStyle="#eef0e9";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x-13,y-h*.73);ctx.lineTo(x,y-h*.45);ctx.stroke();}
    }
    // A distant lit house makes scale, rain and nighttime readable through either window.
    ctx.fillStyle=winter?"#d9dace":"#dcd4b7";ctx.fillRect(735,452,84,61);ctx.fillStyle="#647169";ctx.beginPath();ctx.moveTo(726,452);ctx.lineTo(777,416);ctx.lineTo(829,452);ctx.closePath();ctx.fill();
    ctx.fillStyle=night>.3?"#edcc8b":"#839e98";for(const x of [750,787])ctx.fillRect(x,468,16,23);
    if(night>0){ctx.globalCompositeOperation="source-atop";ctx.fillStyle=`rgba(16,30,47,${night*.66})`;ctx.fillRect(0,0,1024,768);ctx.globalCompositeOperation="source-over";ctx.fillStyle=`rgba(247,206,132,${night})`;for(const x of [750,787])ctx.fillRect(x,468,16,23);}
    landscapeTexture.needsUpdate=true;
  }
  return {root,shaftRoot,update(env:Environment,dt:number,motion:boolean){
    if(motion)clock+=dt;
    const night=1-T.MathUtils.smoothstep(env.altitude,-10,8),warm=1-T.MathUtils.smoothstep(env.altitude,3,28);
    const next=[env.season,env.weather,env.time,Math.round(night*20)].join("/");if(key!==next){key=next;paint(env,night);}
    sky.uniforms.clock.value=clock;sky.uniforms.cloud.value=env.cloud;sky.uniforms.night.value=night;
    sky.uniforms.top.value.set(night>.65?"#152e46":env.cloud>.7?"#859ba5":"#8fbbd1");sky.uniforms.bottom.value.set(night>.65?"#5d6471":warm>.65?"#e5bea1":"#e1e9db");const localSun=new T.Vector3(...sunDirection(env)).applyAxisAngle(new T.Vector3(0,1,0),-rotation);
    if(localSun.z<-.05)sky.uniforms.sun.value.set(.5+localSun.x/(-localSun.z)*.5,.48+localSun.y/(-localSun.z)*.5);else sky.uniforms.sun.value.set(-10,-10);
    rain.uniforms.clock.value=clock;rain.uniforms.rain.value=env.weather==="rain"?.65:env.weather==="storm"?1:0;rain.uniforms.snow.value=env.weather==="snow"?1:0;rain.uniforms.fog.value=env.weather==="fog"?1:env.weather==="storm"?.25:0;rain.uniforms.night.value=night;
    const direction=new T.Vector3(...sunDirection(env)).negate(),normal=new T.Vector3(0,0,1).applyAxisAngle(new T.Vector3(0,1,0),rotation);
    const enabled=env.altitude>3&&direction.dot(normal)>.08&&env.cloud<.7;
    shaftRoot.visible=enabled;root.updateMatrixWorld(true);
    beams.forEach((b,i)=>{
      // Left blinds cover the upper part; rays begin below them, never on the wall or frame.
      const localY=rotation?-.22:height*.32;
      const a=new T.Vector3((i?1:-1)*width*.25,localY,.17).applyMatrix4(root.matrixWorld),c=new T.Vector3((i?1:-1)*width*.25+.14,localY,.17).applyMatrix4(root.matrixWorld);
      const end=(p:T.Vector3)=>{let distance=(p.y-.041)/Math.max(.001,-direction.y);for(const [axis,lo,hi] of [["x",-2.95,2.95],["z",-2.44,2.45]] as const){if(Math.abs(direction[axis])>.001){const d=((direction[axis]>0?hi:lo)-p[axis])/direction[axis];if(d>0)distance=Math.min(distance,d);}}return p.clone().addScaledVector(direction,Math.max(0,distance));};
      const positions=b.geometry.attributes.position as T.BufferAttribute;[a,c,end(c),end(a)].forEach((p,j)=>positions.setXYZ(j,p.x,p.y,p.z));positions.needsUpdate=true;
      (b.material as T.ShaderMaterial).uniforms.strength.value=.045*(1-env.cloud);
    });
  },dispose(){root.traverse(o=>{if(o instanceof T.Mesh){o.geometry.dispose();if(o.material!==oak)(o.material as T.Material).dispose();}});shaftRoot.traverse(o=>{if(o instanceof T.Mesh){o.geometry.dispose();(o.material as T.Material).dispose();}});landscapeTexture.dispose();root.removeFromParent();shaftRoot.removeFromParent();}};
}
