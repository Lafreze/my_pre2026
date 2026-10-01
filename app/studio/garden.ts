import * as THREE from "three";
import {createSongbird} from "./songbird";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { createSurfaceMaterials, metricUV } from "../surfaceMaterials";

// An original, metre-scale garden. Instances share geometry and materials;
// nothing is downloaded and the same seeded planting grows on every visit.
export function buildGarden(finishes: ReturnType<typeof createSurfaceMaterials>) {
  const root = new THREE.Group(), canopy = new THREE.Group(), bird = new THREE.Group();
  root.name = "Seasonal garden"; bird.name = "Free-flying robin";
  const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>(), textures = new Set<THREE.Texture>();
  let seed = 20260928;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const geometry = <T extends THREE.BufferGeometry>(g: T) => { geometries.add(g); return g; };
  const material = <T extends THREE.Material>(m: T) => { materials.add(m); return m; };
  function mesh(g: THREE.BufferGeometry, m: THREE.Material, p: number[], parent: THREE.Object3D = root) {
    const obj = new THREE.Mesh(g, m); obj.position.fromArray(p); obj.castShadow = true; obj.receiveShadow = true; parent.add(obj); return obj;
  }
  const sphere = geometry(new THREE.SphereGeometry(1, 16, 10));
  function ellipsoid(p: number[], scale: number[], m: THREE.Material, parent: THREE.Object3D = root) {
    const obj = mesh(sphere, m, p, parent); obj.scale.fromArray(scale); return obj;
  }
  function box(size: number[], p: number[], m: THREE.Material, radius = .03) {
    return mesh(geometry(metricUV(new RoundedBoxGeometry(size[0], size[1], size[2], 3, radius))), m, p);
  }
  function branch(points: number[][], radius: number, m: THREE.Material) {
    const path = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3().fromArray(p)));
    const tube=new THREE.TubeGeometry(path,16,radius,7,false),positions=tube.getAttribute("position");
    // Taper to fine tips instead of exposing blunt cylinders when leaves fall.
    for(let ring=0;ring<=16;ring++){
      const t=ring/16,center=path.getPointAt(t),scale=1-.88*Math.pow(t,1.15);
      for(let side=0;side<=7;side++){const i=ring*8+side;positions.setXYZ(i,center.x+(positions.getX(i)-center.x)*scale,center.y+(positions.getY(i)-center.y)*scale,center.z+(positions.getZ(i)-center.z)*scale);}
    }
    tube.computeVertexNormals();return mesh(geometry(tube),m,[0,0,0]);
  }
  function painted(draw: (c: CanvasRenderingContext2D) => void, size = 512) {
    const canvas = document.createElement("canvas"); canvas.width = canvas.height = size; draw(canvas.getContext("2d")!);
    const t = new THREE.CanvasTexture(canvas); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; textures.add(t); return t;
  }
  const lawn=finishes.material("grass","#c7d1af");
  const earth=finishes.material("cork","#736c50"),stone=finishes.material("stone","#dfd9c4"),darkWood=finishes.material("oak","#d3bf98"),bark=finishes.material("bark","#b4ab94");
  box([7.95, .26, 7.05], [.10, -.365, .16], earth, .12);
  box([7.92, .11, 7.02], [.10, -.20, .16], lawn, .05);
  // A small arrival path, with irregular, softened sandstone stepping stones.
  for (let i=0;i<5;i++) {
    const shape=new THREE.Shape(),count=9;
    for(let j=0;j<count;j++){const a=j*Math.PI*2/count,r=.18+random()*.04;const x=Math.cos(a)*r,z=Math.sin(a)*r*.55;if(j===0)shape.moveTo(x,z);else shape.lineTo(x,z);}shape.closePath();
    const geo=geometry(metricUV(new THREE.ExtrudeGeometry(shape,{depth:.027,bevelEnabled:true,bevelSize:.009,bevelThickness:.009,bevelSegments:2,steps:1}),.65));
    const step=mesh(geo,stone,[.24+Math.sin(i*.6)*.14,-.10,2.52+i*.25]);step.rotation.x=-Math.PI/2;step.rotation.z=i*.18;
  }
  for (let i = 0; i < 24; i++) {
    const z = -2.5 + random() * 5.85, x = 3.17 + random() * .48;
    ellipsoid([x, -.11, z], [.03 + random() * .065, .025 + random() * .03, .04 + random() * .07], stone);
  }
  // Slatted outdoor bench; warm wood grain is the same scanned PBR as the room.
  for (let i = 0; i < 4; i++) box([1.25, .055, .095], [-1.47, .27, 2.87 + i * .115], darkWood, .012);
  for (const x of [-1.93, -1.01]) for (const z of [2.90, 3.18]) box([.075, .40, .075], [x, .055, z], darkWood, .01);
  box([1.25, .055, .075], [-1.47, .02, 3.07], darkWood, .01);
  // Bench joinery, a book and a linen cushion, with no floating intersections.
  const iron=finishes.material("metal","#4c6256"),linen=finishes.material("wool","#b5ba93");
  for(const x of [-1.99,-.95])for(const z of [2.9,3.18])ellipsoid([x,.304,z],[.009,.003,.009],iron);
  box([.4,.055,.30],[-1.12,.326,3.03],linen,.018);
  box([.23,.025,.18],[-1.77,.315,2.99],finishes.material("paper","#e2dbc4"),.004);
  box([.24,.007,.19],[-1.77,.332,2.99],finishes.material("fabric","#718571"),.004);
  // Soft stone edging and ground-cover clusters frame the cutaway room.
  for(let i=0;i<27;i++){
    const z=-2.9+i*.229,x=3.81+Math.sin(i*.8)*.035;
    const pebble=ellipsoid([x,-.105,z],[.065+(i%3)*.007,.035,.045+(i%4)*.006],stone);pebble.rotation.y=i*.76;
  }
  // Native meadow: tapered blades, seed heads and small ivory / ochre blooms.
  const bladeGeo = geometry(new THREE.BufferGeometry());
  bladeGeo.setAttribute("position", new THREE.Float32BufferAttribute([-.012, 0, 0, .012, 0, 0, -.008, .13, .01, .008, .13, .01, .024, .25, .025], 3));
  bladeGeo.setIndex([0, 1, 2, 1, 3, 2, 2, 3, 4]); bladeGeo.computeVertexNormals();
  const bladeMat = material(new THREE.MeshStandardMaterial({ color: "#7c9460", side: THREE.DoubleSide, roughness: .95 }));
  const blades = new THREE.InstancedMesh(bladeGeo, bladeMat, 720); blades.receiveShadow = true; root.add(blades);
  const dummy = new THREE.Object3D(), color = new THREE.Color();
  const meadow: [number, number][] = [];
  for (let i = 0; i < 720; i++) {
    const [cx,cz,rx,rz]=[[-3.48,1.95,.24,.77],[3.56,-2.1,.25,.75],[3.22,2.79,.58,.30]][i%3];
    const angle=random()*Math.PI*2,r=Math.sqrt(random()),x=cx+Math.cos(angle)*r*rx,z=cz+Math.sin(angle)*r*rz;
    const s = .3 + random() * .72;
    dummy.position.set(x, -.155, z); dummy.rotation.set(0, random() * Math.PI * 2, (random() - .5) * .3); dummy.scale.set(s, s, s); dummy.updateMatrix();
    blades.setMatrixAt(i, dummy.matrix); blades.setColorAt(i, color.setHSL(.22 + random() * .025, .22 + random() * .08, .39 + random() * .12));
    if (i % 14 === 0) meadow.push([x, z]);
  }
  const flowerMat = material(new THREE.MeshStandardMaterial({ color: "#f3ecd1", roughness: .82, side: THREE.DoubleSide }));
  const pollenMat = material(new THREE.MeshStandardMaterial({ color: "#bc8934", roughness: .9 }));
  const petals = new THREE.InstancedMesh(sphere, flowerMat, meadow.length * 5), centers = new THREE.InstancedMesh(sphere, pollenMat, meadow.length);
  const stemGeo = geometry(new THREE.CylinderGeometry(.003, .005, 1, 4));
  const stems = new THREE.InstancedMesh(stemGeo, bladeMat, meadow.length); root.add(petals, centers, stems);
  meadow.forEach(([x, z], i) => {
    const h = .09 + random() * .13, y = -.14 + h;
    dummy.position.set(x, -.14 + h / 2, z); dummy.rotation.set(0, 0, 0); dummy.scale.set(1, h, 1); dummy.updateMatrix(); stems.setMatrixAt(i, dummy.matrix);
    dummy.position.set(x, y, z); dummy.scale.set(.015, .012, .015); dummy.updateMatrix(); centers.setMatrixAt(i, dummy.matrix);
    for (let j = 0; j < 5; j++) {
      const a = j * Math.PI * 2 / 5; dummy.position.set(x + Math.cos(a) * .023, y, z + Math.sin(a) * .023);
      dummy.rotation.set(0, -a, .15); dummy.scale.set(.024, .007, .014); dummy.updateMatrix(); petals.setMatrixAt(i * 5 + j, dummy.matrix);
      petals.setColorAt(i * 5 + j, color.set(i % 4 === 0 ? "#dbc264" : "#fff9e4"));
    }
  });
  // A single airy tree, kept outside the cutaway so every indoor object stays visible.
  const treeX = 3.86, treeZ = -2.7;
  branch([[treeX, -.16, treeZ], [treeX - .06, .7, treeZ], [treeX + .06, 1.5, treeZ + .08], [treeX - .03, 2.6, treeZ]], .067, bark);
  const treeBranch=(points:number[][],radius:number,m:THREE.Material)=>branch(points.map(p=>[treeX+(p[0]-treeX)*.82,1.2+(p[1]-1.2)*.82,treeZ+(p[2]-treeZ)*.82]),radius,m);
  for (let i = 0; i < 7; i++) {
    const a = i * 2.399, h = 1.3 + i * .15;
    treeBranch([[treeX, h, treeZ], [treeX + Math.cos(a) * .25, h + .24, treeZ + Math.sin(a) * .25], [treeX + Math.cos(a) * .67, h + .44, treeZ + Math.sin(a) * .63]], .019, bark);
    for(let fork=0;fork<3;fork++){
      const distance=.28+fork*.13,angle=a+(fork-1)*.48;
      const start=[treeX+Math.cos(a)*distance,h+.24+(distance-.25)*.47,treeZ+Math.sin(a)*distance];
      const tip=[treeX+Math.cos(angle)*(.62+fork*.10),h+.61+fork*.08,treeZ+Math.sin(angle)*(.59+fork*.10)];
      treeBranch([start,[(start[0]+tip[0])*.5,h+.43+fork*.06,(start[2]+tip[2])*.5],tip],.009,bark);
      for(const side of [-1,1])treeBranch([[tip[0]*.35+start[0]*.65,tip[1]*.35+start[1]*.65,tip[2]*.35+start[2]*.65],[tip[0]+Math.cos(angle+side*.7)*.13,tip[1]+.12,tip[2]+Math.sin(angle+side*.7)*.13]],.004,bark);
    }
  }
  canopy.position.set(treeX, 1.2, treeZ);canopy.scale.setScalar(.82); root.add(canopy);
  const leafShape = new THREE.Shape(); leafShape.moveTo(0, -.5); leafShape.bezierCurveTo(-.45, -.15, -.36, .24, 0, .5); leafShape.bezierCurveTo(.36, .24, .45, -.15, 0, -.5);
  const leafGeo = geometry(new THREE.ShapeGeometry(leafShape, 6));
  const leafPosition = leafGeo.getAttribute("position");
  for (let i = 0; i < leafPosition.count; i++) leafPosition.setZ(i, Math.abs(leafPosition.getX(i)) * .27);
  leafGeo.computeVertexNormals();
  const leafMap = painted(c => {
    c.fillStyle = "#c4cf8c"; c.fillRect(0, 0, 512, 512);
    const shade = c.createLinearGradient(0, 0, 512, 0); shade.addColorStop(0, "#749053"); shade.addColorStop(.5, "#d9dfa0"); shade.addColorStop(1, "#8fa963"); c.fillStyle = shade; c.fillRect(0, 0, 512, 512);
    c.strokeStyle = "#e2e5b66b"; c.lineWidth = 2; c.beginPath(); c.moveTo(256, 0); c.lineTo(256, 512); c.stroke();
    c.lineWidth = 1;
    for (let i = 0; i < 12; i++) { c.beginPath(); c.moveTo(256, i * 44); c.lineTo(0, i * 44 + 155); c.moveTo(256, i * 44); c.lineTo(512, i * 44 + 155); c.stroke(); }
  });
  // ShapeGeometry UVs are in local coordinates, so normalize the leaf map once.
  const leafUV = leafGeo.getAttribute("uv"); for (let i = 0; i < leafUV.count; i++) leafUV.setXY(i, leafUV.getX(i) + .5, leafUV.getY(i) + .5);
  const leafMat = material(new THREE.MeshPhysicalMaterial({ color: "#9bb581", map: leafMap, roughness: .84, side: THREE.DoubleSide, sheen: .25, sheenColor: "#bdcc8c" }));
  const leaves = new THREE.InstancedMesh(leafGeo, leafMat, 980); leaves.castShadow = true; leaves.receiveShadow = true; canopy.add(leaves);
  for (let i = 0; i < 980; i++) {
    const a = random() * Math.PI * 2, b = Math.acos(2 * random() - 1), r = Math.cbrt(random());
    dummy.position.set(Math.sin(b) * Math.cos(a) * r * 1.08, .95 + Math.cos(b) * r * .93, Math.sin(b) * Math.sin(a) * r * .85);
    dummy.rotation.set((random() - .5) * 2.7, random() * Math.PI * 2, random() * Math.PI * 2); const s = .15 + random() * .19; dummy.scale.set(s, s, s); dummy.updateMatrix();
    leaves.setMatrixAt(i, dummy.matrix); leaves.setColorAt(i, color.setHSL(.22 + random() * .025, .23 + random() * .08, .43 + random() * .13));
  }
  // Layered leaves form the shrubs, with visible gaps and smaller tips.
  const shrubs=new THREE.InstancedMesh(leafGeo,leafMat,420);shrubs.castShadow=true;shrubs.receiveShadow=true;root.add(shrubs);
  const shrubCenters=[[-3.48,2.62],[3.45,.16],[3.62,-2.65],[-2.83,3.07]];
  for(let i=0;i<420;i++){
    const [x,z]=shrubCenters[i%4],a=i*2.399,r=Math.sqrt(random())*.27,h=.04+(1-r/.32)*.23+random()*.04;
    dummy.position.set(x+Math.cos(a)*r,h-.13,z+Math.sin(a)*r);dummy.rotation.set(.4+random()*.7,a,(random()-.5)*.5);dummy.scale.set(.095+random()*.035,.15+random()*.09,.1);dummy.updateMatrix();shrubs.setMatrixAt(i,dummy.matrix);shrubs.setColorAt(i,color.setHSL(.23+random()*.05,.20+random()*.12,.45+random()*.13));
  }
  // Narrow lavender and perennial beds, planted in small irregular groups.
  const lavender=material(new THREE.MeshStandardMaterial({color:"#9b8da7",roughness:.92})),flowerStem=material(new THREE.MeshStandardMaterial({color:"#607650",roughness:1}));
  for(const [px,pz] of [[3.42,.67],[3.54,2.67],[-3.30,2.87],[-2.68,3.13]]){
    for(let i=0;i<17;i++){
      const a=i*2.399,r=.05+random()*.15,x=px+Math.cos(a)*r,z=pz+Math.sin(a)*r,h=.19+random()*.15;
      branch([[x,-.14,z],[x+.01,h*.45-.14,z],[x+Math.cos(a)*.03,h-.14,z+Math.sin(a)*.035]],.003,flowerStem);
      for(let j=0;j<4;j++)ellipsoid([x+Math.cos(a)*.03,h-.14+j*.015,z+Math.sin(a)*.035],[.011-j*.001,.018,.011-j*.001],lavender);
    }
  }
  const clay=finishes.material("ceramic","#b68b65"),soil=finishes.material("cork","#504632");clay.roughness=.75;clay.clearcoat=.12;
  for(const [px,pz,size] of [[3.29,2.28,1],[-2.66,2.63,.78]]){
    const profile=[[.08,0],[.09,.015],[.14,.24],[.148,.25],[.15,.278],[.132,.278],[.129,.25],[.08,.02]].map(([x,y])=>new THREE.Vector2(x*size,y*size));
    mesh(geometry(new THREE.LatheGeometry(profile,40)),clay,[px,-.13,pz]);
    mesh(geometry(new THREE.CylinderGeometry(.127*size,.127*size,.014,24)),soil,[px,-.13+.247*size,pz]);
    for(let i=0;i<9;i++){const a=i*2.399,h=.15+(i%3)*.05;branch([[px,.12*size-.13,pz],[px+Math.cos(a)*.055,.21*size,pz+Math.sin(a)*.055],[px+Math.cos(a)*.1,.12*size+h,pz+Math.sin(a)*.1]],.003,flowerStem);const leaf=mesh(leafGeo,leafMat,[px+Math.cos(a)*.1,.12*size+h,pz+Math.sin(a)*.1]);leaf.rotation.set(.55,a,-.7);leaf.scale.set(.13,.24,.13);}
  }
  // A shallow stone birdbath: turned rim, recessed water and fine ripples.
  const bath=new THREE.Group();bath.position.set(3.37,-.14,1.54);root.add(bath);
  const bowlProfile=[[0,0],[.17,.01],[.12,.07],[.065,.12],[.065,.25],[.19,.29],[.235,.335],[.24,.37],[.222,.382],[.202,.344],[.08,.315],[0,.315]];
  mesh(geometry(new THREE.LatheGeometry(bowlProfile.map(v=>new THREE.Vector2(v[0],v[1])),48)),stone,[0,0,0],bath);
  const waterMat=material(new THREE.MeshPhysicalMaterial({color:"#86b6ad",roughness:.13,metalness:.18,transparent:true,opacity:.8,clearcoat:1}));
  const water=mesh(geometry(new THREE.CircleGeometry(.207,48)),waterMat,[0,.351,0],bath);water.rotation.x=-Math.PI/2;water.castShadow=false;
  const rippleMat=material(new THREE.MeshBasicMaterial({color:"#dce7cd",transparent:true,opacity:.3,depthWrite:false}));
  const ripples=[0,1].map(i=>{const ring=mesh(geometry(new THREE.TorusGeometry(.12,.0015,4,48)),rippleMat,[0,.353+i*.0003,0],bath);ring.rotation.x=Math.PI/2;ring.castShadow=false;return ring;});
  // Two pale butterflies cross the planting slowly; reduced motion parks them.
  const butterflies:{body:THREE.Group;left:THREE.Mesh;right:THREE.Mesh;phase:number}[]=[];
  const wingShape=new THREE.Shape();wingShape.moveTo(0,0);wingShape.bezierCurveTo(-.06,.015,-.10,.12,-.037,.097);wingShape.bezierCurveTo(.008,.075,-.009,.05,0,0);
  const wingGeo=geometry(new THREE.ShapeGeometry(wingShape,8));
  const butterflyMat=material(new THREE.MeshStandardMaterial({color:"#efe2a6",side:THREE.DoubleSide,roughness:.8}));
  for(let i=0;i<2;i++){const body=new THREE.Group();root.add(body);const left=mesh(wingGeo,butterflyMat,[0,0,0],body),right=mesh(wingGeo,butterflyMat,[0,0,0],body);right.scale.x=-1;ellipsoid([0,.04,0],[.004,.045,.004],iron,body);left.castShadow=right.castShadow=false;butterflies.push({body,left,right,phase:i*2.7});}
  const wind={value:0};
  // Shared wind uniform adds motion without rewriting thousands of instance matrices.
  for(const m of [bladeMat,leafMat,flowerMat,lavender]){
    m.onBeforeCompile=shader=>{shader.uniforms.gardenWind=wind;shader.vertexShader='uniform float gardenWind;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
      #ifdef USE_INSTANCING
      float phase=instanceMatrix[3].x*2.3+instanceMatrix[3].z*1.7;
      transformed.x+=sin(gardenWind*1.3+phase)*max(position.y,0.0)*0.045;
      #endif`);};
    m.customProgramCacheKey=()=>"garden-wind-v1";
  }
  const songbird=createSongbird();bird.add(songbird.root);
  bird.position.set(-1.45,.315,3.03);root.add(bird);
  // Warm, sparse fireflies appear only at dusk. Their positions are animated in one draw call.
  const fireflyGeo = geometry(new THREE.BufferGeometry()), fireflyPositions = new Float32Array(18 * 3);
  const fireflySeeds = Array.from({ length: 18 }, () => [random() * 7 - 3.5, .3 + random() * 1.4, 2.6 + random() * .8, random() * 6.28]);
  fireflyGeo.setAttribute("position", new THREE.BufferAttribute(fireflyPositions, 3));
  const glowMap = painted(c => { const g = c.createRadialGradient(256, 256, 0, 256, 256, 250); g.addColorStop(0, "#fffbd7"); g.addColorStop(.17, "#ffedaaa8"); g.addColorStop(1, "#ffdb7a00"); c.fillStyle = g; c.fillRect(0, 0, 512, 512); });
  const glow = material(new THREE.PointsMaterial({ color: "#ffe69e", size: .1, map: glowMap, transparent: true, depthWrite: false, toneMapped: false, opacity: 0 }));
  const fireflies = new THREE.Points(fireflyGeo, glow); fireflies.frustumCulled = false; root.add(fireflies);
  // Merge static garden details, preserving the independently animated tree and robin.
  root.updateMatrixWorld(true);
  const batches = new Map<THREE.Material, THREE.Mesh[]>();
  root.traverse(o => {
    if (!(o instanceof THREE.Mesh) || o instanceof THREE.InstancedMesh || Array.isArray(o.material)) return;
    for (let p: THREE.Object3D | null = o; p; p = p.parent) if (p === canopy || p === bird || p === bath || butterflies.some(b=>b.body===p)) return;
    const list = batches.get(o.material) || []; list.push(o); batches.set(o.material, list);
  });
  for (const [m, meshes] of batches) {
    if (meshes.length < 2) continue;
    const pieces = meshes.map(obj => (obj.geometry.index ? obj.geometry.toNonIndexed() : obj.geometry.clone()).applyMatrix4(obj.matrixWorld));
    const merged = mergeGeometries(pieces); pieces.forEach(g => g.dispose());
    if (merged) { mesh(geometry(merged), m, [0, 0, 0]); meshes.forEach(o => o.removeFromParent()); }
  }
  const perches=[[-1.45,.315,3.03],[3.3,.65,2.95],[3.65,1.75,-.4],[3.8,1.15,2.6]].map(p=>new THREE.Vector3(...p));
  let lifeTime=0;
  return {
    root, bird,
    setSeason(season:"spring"|"summer"|"autumn"|"winter",weather:string){
      leafMat.color.set({spring:"#b8c49a",summer:"#9bb581",autumn:"#d7a15c",winter:"#b8b8a4"}[season]);
      leaves.visible=season!=="winter";for(const flowers of [petals,centers,stems])flowers.visible=season!=="winter";butterflies.forEach(b=>b.body.visible=season!=="winter"&&weather!=="storm"&&weather!=="snow");
      bladeMat.color.set(season==="winter"?"#c6c4b0":season==="autumn"?"#b4b68d":"#a9bf88");
      lawn.color.set(weather==="snow"?"#e2e4d9":season==="winter"?"#c0c1a8":"#c7d1af");
    },
    update(dt: number, breeze: boolean, dusk: number) {
      if(breeze)lifeTime+=dt;
      const time=lifeTime,index=Math.floor(time/15)%perches.length,phase=time%15;
      const flight=THREE.MathUtils.clamp((phase-7)/8,0,1),u=flight*flight*(3-2*flight);
      const from=perches[index],to=perches[(index+1)%perches.length];
      bird.position.lerpVectors(from,to,u);bird.position.y+=Math.sin(flight*Math.PI)*1.15;
      bird.rotation.y=flight>0&&flight<1?Math.atan2(to.x-from.x,to.z-from.z):.25+Math.sin(time*.9)*.17;
      songbird.update(time,flight>0&&flight<1);
      bird.rotation.z=flight>0?Math.sin(time*2)*.04:Math.sin(time*1.5)*.018;
      if(breeze)wind.value=time;
      ripples.forEach((ring,i)=>{const phase=(time*.3+i*.5)%1;ring.scale.setScalar(.25+phase*1.35);});
      butterflies.forEach(({body,left,right,phase},i)=>{
        const t=time;
        body.position.set(i===0?3.4+Math.sin(t*.31+phase)*.28:-2.65+Math.sin(t*.26+phase)*.35,.33+Math.sin(t*.8+phase)*.1,i===0?.57+Math.cos(t*.25+phase)*.43:3.0+Math.cos(t*.32+phase)*.16);
        body.rotation.set(-.4,Math.sin(t*.31+phase)*.65,Math.sin(t*.8+phase)*.15);
        left.rotation.y=Math.sin(t*11+phase)*.75;right.rotation.y=-left.rotation.y;
      });
      canopy.rotation.z = Math.sin(time * .7) * .009;
      canopy.rotation.x = Math.sin(time * .45) * .006;
      glow.opacity = dusk * .85;
      fireflySeeds.forEach(([x, y, z, phase], i) => { fireflyPositions[i * 3] = x + Math.sin(time * .35 + phase) * .15; fireflyPositions[i * 3 + 1] = y + Math.sin(time * .65 + phase) * .14; fireflyPositions[i * 3 + 2] = z + Math.cos(time * .4 + phase) * .1; });
      fireflyGeo.attributes.position.needsUpdate = true;
      return flight>0&&flight<1;
    },
    dispose() { songbird.dispose();geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); textures.forEach(t => t.dispose()); },
  };
}
