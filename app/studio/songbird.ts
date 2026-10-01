import * as T from "three";

/** Articulated songbird with overlapping flight feathers and modeled toes. */
export function createSongbird() {
  const root=new T.Group();root.name="Articulated garden robin";root.scale.setScalar(.78);
  const canvas=document.createElement("canvas");canvas.width=128;canvas.height=512;const c=canvas.getContext("2d")!;
  c.fillStyle="#d7d2c6";c.fillRect(0,0,128,512);c.lineWidth=.7;
  for(let y=0;y<510;y+=5){c.strokeStyle=y%10?"#eee5d1":"#b4ad9f";c.beginPath();c.moveTo(64,y);c.lineTo(0,y-31);c.moveTo(64,y);c.lineTo(128,y-31);c.stroke();}
  c.strokeStyle="#dfd9c9";c.lineWidth=2;c.beginPath();c.moveTo(64,0);c.lineTo(64,512);c.stroke();
  const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;
  const feather=new T.MeshPhysicalMaterial({color:"#b4a591",map,roughness:.7,sheen:.45,sheenColor:"#bcaf95",side:T.DoubleSide});
  const buff=new T.MeshPhysicalMaterial({color:"#afa38a",roughness:.83,sheen:.45}),chest=new T.MeshPhysicalMaterial({color:"#bd7549",roughness:.83,sheen:.4});
  const eye=new T.MeshPhysicalMaterial({color:"#101512",roughness:.07,clearcoat:1}),bill=new T.MeshStandardMaterial({color:"#574d42",roughness:.48});
  const pale=new T.MeshStandardMaterial({color:"#e6d7b6",roughness:.8}),glint=new T.MeshBasicMaterial({color:"#f4eee1"});
  const geometries=new Set<T.BufferGeometry>(),materials=[feather,buff,chest,eye,bill,pale,glint];
  const sphere=new T.SphereGeometry(1,24,16);geometries.add(sphere);
  function mesh(g:T.BufferGeometry,m:T.Material,p:number[],parent:T.Object3D=root){geometries.add(g);const o=new T.Mesh(g,m);o.position.set(...p as [number,number,number]);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
  const oval=(p:number[],size:number[],m:T.Material,parent:T.Object3D=root)=>{const o=mesh(sphere,m,p,parent);o.scale.set(...size as [number,number,number]);return o;};
  const plumage=new T.MeshPhysicalMaterial({color:"#ffffff",vertexColors:true,roughness:.83,sheen:.35,bumpMap:map,bumpScale:.00045});materials.push(plumage);
  const warm=new T.Color("#b78357"),back=new T.Color("#8b8672"),belly=new T.Color("#c9c2ad");
  function body(p:number[],size:number[],isHead=false,parent:T.Object3D=root){
    const g=sphere.clone(),position=g.getAttribute("position"),colors:number[]=[];
    for(let i=0;i<position.count;i++){
      const y=position.getY(i),z=position.getZ(i),x=position.getX(i);
      const mask=T.MathUtils.smoothstep(z,.28,.65)*(isHead?1-T.MathUtils.smoothstep(y,-.05,.28):T.MathUtils.smoothstep(y,-.8,-.1));
      const color=back.clone().lerp(belly,isHead?0:T.MathUtils.smoothstep(-y,.15,.85)).lerp(warm,mask);
      const fine=1+Math.sin(y*135+x*18)*.022;color.multiplyScalar(fine);colors.push(color.r,color.g,color.b);
    }
    g.setAttribute("color",new T.Float32BufferAttribute(colors,3));const o=mesh(g,plumage,p,parent);o.scale.set(...size as [number,number,number]);return o;
  }
  body([0,.119,-.009],[.064,.087,.090]).rotation.x=-.26;
  const head=new T.Group();head.position.set(0,.205,.040);root.add(head);
  body([0,0,0],[.050,.049,.052],true,head);
  for(const sign of [-1,1]){oval([sign*.041,.006,.027],[.0087,.0091,.006],pale,head);oval([sign*.045,.007,.031],[.0064,.0072,.005],eye,head);oval([sign*.047,.010,.034],[.0016,.0016,.0016],glint,head);}
  for(const lower of [false,true]){const beak=mesh(new T.ConeGeometry(lower?.006:.008,.031,16),bill,[0,lower?-.013:-.010,.060],head);beak.rotation.x=Math.PI/2;beak.scale.x=.66;beak.scale.z=lower?.45:.65;}
  const featherGeo=new T.BufferGeometry(),positions:number[]=[],uv:number[]=[],indices:number[]=[];
  for(let row=0;row<=16;row++)for(let col=0;col<=4;col++){
    const t=row/16,u=col/4,x=(u-.5)*Math.pow(Math.sin(Math.PI*t),.65);
    positions.push(x,-t,Math.sin(t*Math.PI)*.07+(1-Math.abs(u-.5)*2)*.025);uv.push(u,1-t);
    if(row<16&&col<4){const k=row*5+col;indices.push(k,k+5,k+1,k+1,k+5,k+6);}
  }
  featherGeo.setAttribute("position",new T.Float32BufferAttribute(positions,3));featherGeo.setAttribute("uv",new T.Float32BufferAttribute(uv,2));featherGeo.setIndex(indices);featherGeo.computeVertexNormals();geometries.add(featherGeo);
  const wings=[new T.Group(),new T.Group()];
  wings.forEach((wing,i)=>{const sign=i?1:-1;wing.position.set(sign*.055,.159,-.005);root.add(wing);
    oval([sign*.008,-.027,-.015],[.012,.053,.028],buff,wing);
    for(let j=0;j<9;j++){const f=mesh(featherGeo,feather,[sign*(.009+j*.003),-.009,-.006-j*.005],wing);f.scale.set(.032,.102+j*.004,.045);f.rotation.set(.40+j*.034,sign*.15,sign*(j*.022));}
    for(let j=0;j<6;j++){const f=mesh(featherGeo,feather,[sign*.016,-.014,-.010-j*.005],wing);f.scale.set(.027,.07,.045);f.rotation.x=.40;}
  });
  const tail=new T.Group();tail.position.set(0,.075,-.068);tail.rotation.x=1.28;root.add(tail);
  for(let i=0;i<6;i++){const f=mesh(featherGeo,feather,[(i-2.5)*.009,0,0],tail);f.scale.set(.024,.117-Math.abs(i-2.5)*.008,.045);f.rotation.z=(i-2.5)*.045;}
  function rod(a:number[],b:number[],r:number){const start=new T.Vector3(...a),end=new T.Vector3(...b),o=mesh(new T.CylinderGeometry(r*.65,r,start.distanceTo(end),8),bill,start.clone().add(end).multiplyScalar(.5).toArray());o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),end.sub(start).normalize());}
  for(const x of [-.026,.026]){rod([x,.065,.005],[x,.017,.018],.003);for(const s of [-1,0,1]){rod([x,.017,.018],[x+s*.015,.003,.043],.002);rod([x+s*.015,.003,.043],[x+s*.016,.002,.050],.0012);}rod([x,.017,.018],[x,.003,-.010],.002);}
  return {root,update(time:number,flying:boolean){
    const spread=flying?1.05+Math.sin(time*22)*.66:.07;
    wings[0].rotation.z=-spread;wings[1].rotation.z=spread;
    wings.forEach((w,i)=>{w.rotation.x=flying?-.32:.10;w.rotation.y=flying?0:(i?1:-1)*.85;});head.rotation.y=flying?0:Math.sin(time*.7)*.16;tail.rotation.x=flying?1.55:1.28;
    root.rotation.x=flying?.17:0;
  },dispose(){geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());map.dispose();}};
}
