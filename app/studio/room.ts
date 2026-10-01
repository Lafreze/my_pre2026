import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import type { ObjectId, ViewId } from "./content";
import { createSurfaceMaterials, metricUV } from "../surfaceMaterials";
import { drawTransformerNotes } from "./chalkboard";
import { buildGarden } from "./garden";
import { createWindow } from "./windowEnvironment";
import { createRoomLife } from "./roomLife";
import {createCurtains} from "./curtains";
import {createSofa} from "./sofa";
import {createGramophone} from "./gramophone";
import type {ScenePropId} from "./interactions";
import { createHologram } from "./hologram";
import { sunDirection, type Environment } from "./environment";

// Metres; floor 6 × 5, desk .74 high, seat .45 high. Everything is locally built.
export function buildRoom(invalidate: () => void = () => {}, anisotropy = 4) {
  const root = new THREE.Group();
  const finishes = createSurfaceMaterials(invalidate, anisotropy);
  const materials = new Map<string, THREE.MeshStandardMaterial>();
  const geometries = new Map<string, THREE.BufferGeometry>();
  const textures: THREE.Texture[] = [];
  const mat = (color: string, roughness = .65, metalness = 0) => {
    const key = color + roughness + metalness;
    if (!materials.has(key)) { const m = finishes.material(metalness > .1 ? "metal" : "rubber", color).clone(); m.roughness = roughness; m.metalness = metalness; materials.set(key, m); }
    return materials.get(key)!;
  };
  const cream = finishes.material("plaster", "#fffaf0"), wood = finishes.material("oak", "#ebd9b9"), edge = finishes.material("oak", "#c7ad86"), graphite = finishes.material("rubber", "#202c2b"), metal = finishes.material("metal", "#a3adaa"), paper = finishes.material("paper", "#faf5e8"), blue = finishes.material("fabric", "#2c49a5"), terracotta = finishes.material("leather", "#ae5539"), olive = mat("#486140");
  const brass = finishes.material("metal", "#ad8850"), ceramic = finishes.material("ceramic", "#e4ddcc"), upholstery = finishes.material("leather", "#a85435");
  function mesh(geometry: THREE.BufferGeometry, material: THREE.Material, p: number[], parent: THREE.Object3D = root) {
    const m = new THREE.Mesh(geometry, material); m.position.set(p[0], p[1], p[2]); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
  }
  function box(size: number[], p: number[], material: THREE.Material, parent: THREE.Object3D = root, radius = .025) {
    const r = Math.min(radius, Math.min(...size) / 3);
    const surfaceScale = ["fabric", "wool", "leather"].includes(material.userData.surface) ? .35 : 1;
    const key = [...size, r, surfaceScale].join(",");
    if (!geometries.has(key)) geometries.set(key, metricUV(new RoundedBoxGeometry(size[0], size[1], size[2], r >= .03 ? 4 : 2, r), surfaceScale));
    return mesh(geometries.get(key)!, material, p, parent);
  }
  function cyl(rt: number, rb: number, h: number, p: number[], material: THREE.Material, parent: THREE.Object3D = root) {
    const key = `c${rt},${rb},${h}`;
    if (!geometries.has(key)) geometries.set(key, new THREE.CylinderGeometry(rt, rb, h, 40));
    return mesh(geometries.get(key)!, material, p, parent);
  }
  function sphere(size: number[], p: number[], material: THREE.Material, parent: THREE.Object3D = root) {
    if (!geometries.has("sphere")) geometries.set("sphere", new THREE.SphereGeometry(1, 20, 12));
    const m = mesh(geometries.get("sphere")!, material, p, parent); m.scale.set(...size as [number, number, number]); return m;
  }
  function rod(a: number[], b: number[], radius: number, material: THREE.Material, parent: THREE.Object3D = root) {
    const av = new THREE.Vector3(...a as [number, number, number]), bv = new THREE.Vector3(...b as [number, number, number]);
    const mid = av.clone().add(bv).multiplyScalar(.5); const m = cyl(radius, radius, av.distanceTo(bv), mid.toArray(), material, parent);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), bv.sub(av).normalize()); return m;
  }
  function group(p: number[], id?: ObjectId) { const g = new THREE.Group(); g.position.set(...p as [number, number, number]); if (id) g.userData.objectId = id; root.add(g); return g; }
  function tube(points: number[][], radius: number, material: THREE.Material, parent: THREE.Object3D, closed = false) {
    const path = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p as [number, number, number])), closed);
    const geometry = new THREE.TubeGeometry(path, Math.max(24, points.length * 5), radius, 6, closed);
    geometries.set(`tube${geometries.size}`, geometry); return mesh(geometry, material, [0,0,0], parent);
  }
  function turned(profile: number[][], p: number[], material: THREE.Material, parent: THREE.Object3D) {
    const geometry = new THREE.LatheGeometry(profile.map(v => new THREE.Vector2(v[0],v[1])), 48);
    geometries.set(`lathe${geometries.size}`, geometry); return mesh(geometry, material, p, parent);
  }
  function texture(draw: (c: CanvasRenderingContext2D) => void, w = 1024, h = 512) {
    const canvas = document.createElement("canvas"); canvas.width = w; canvas.height = h;
    draw(canvas.getContext("2d")!); const t = new THREE.CanvasTexture(canvas); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; textures.push(t); return t;
  }
  function surface(w: number, h: number, p: number[], tex: THREE.Texture, parent: THREE.Object3D = root, horizontal = false, emissive = false) {
    const geometry = new THREE.PlaneGeometry(w, h); geometries.set(`plane${geometries.size}`, geometry);
    const material = new THREE.MeshPhysicalMaterial({ map: tex, side: THREE.DoubleSide, roughness: emissive ? .3 : .9, specularIntensity: emissive ? 1 : .15, metalness: emissive ? .05 : 0, bumpMap: emissive ? null : paper.bumpMap, bumpScale: .00035, clearcoat: emissive ? .35 : 0, clearcoatRoughness: .2, emissiveMap: emissive ? tex : null, emissive: emissive ? "#ffffff" : "#000000", emissiveIntensity: .28 });
    const m = mesh(geometry, material, p, parent); m.castShadow = false; if (horizontal) m.rotation.x = -Math.PI / 2; return m;
  }
  function folioTexture(title: string, sub: string, bg: string, fg: string) {
    return texture(c=>{
      c.fillStyle=bg;c.fillRect(0,0,768,1024);c.strokeStyle=fg;c.lineWidth=2;c.strokeRect(35,35,698,954);c.strokeRect(46,46,676,932);
      c.fillStyle=fg;c.textAlign="center";c.font="19px sans-serif";c.fillText("THE STUDIO COLLECTION",384,120);
      c.beginPath();for(let i=0;i<8;i++){const a=i*Math.PI/4,r=i%2?28:85;c.lineTo(384+Math.cos(a)*r,355+Math.sin(a)*r);}c.closePath();c.fill();
      c.font="64px Georgia";const words=title.split(" ");const middle=Math.ceil(words.length/2);c.fillText(words.slice(0,middle).join(" "),384,570);c.fillText(words.slice(middle).join(" "),384,649);
      c.font="19px sans-serif";c.fillText(sub,384,839);c.fillRect(349,904,70,2);
    },768,1024);
  }
  // Architectural section: rear and left walls; clean solid floor edge.
  box([6.12,.2,5.12], [0,-.11,0], mat("#3b4f44"), root, .07);
  const floorColors = ["#fff7e6", "#f7edda", "#fff8e8", "#f3e6cd", "#faf1dd"];
  for (let i = 0; i < 15; i++) {
    const cuts = [-2.5, -2.5 + .55 + (i % 3) * .43, -.1 + (i % 3) * .43, 1.4 + (i % 2) * .3, 2.5];
    for (let j = 0; j < cuts.length - 1; j++) {
      const length = cuts[j+1] - cuts[j] - .008;
      const plank = box([.394,.04,length], [-2.79 + i * .4,.005,(cuts[j+1]+cuts[j])/2], finishes.material("floor", floorColors[(i+j)%5]), root, .004);
      plank.geometry = metricUV(plank.geometry.clone(), 3.2, "uv", (i * .127 + j * .23) % 1);
      geometries.set(`plank-${i}-${j}`, plank.geometry);
    }
  }
  const rearWall=finishes.material("plaster", "#385d50");
  // A genuine second aperture behind the monitor, with wall sections around its frame.
  box([.49,2.85,.13],[-2.795,1.43,-2.55],rearWall,root,.012);
  box([3.59,2.85,.13],[1.245,1.43,-2.55],rearWall,root,.012);
  box([2,1.13,.13],[-1.55,.565,-2.55],rearWall,root,.012);
  box([2,.165,.13],[-1.55,2.7725,-2.55],rearWall,root,.012);
  // Left wall is built around the window opening, not a luminous plane on a solid wall.
  box([.13,2.85,2.9],[-3.05,1.43,1.05],cream);
  box([.13,2.85,.65],[-3.05,1.43,-2.2],cream);
  box([.13,.93,1.5],[-3.05,.465,-1.15],cream);
  box([.13,.5,1.5],[-3.05,2.6,-1.15],cream);
  box([5.97,.1,.035],[0,.09,-2.46],paper);
  box([.035,.1,4.98],[-2.97,.09,0],paper);
  const windows=[createWindow(new THREE.Vector3(-3.05,1.64,-1.15),Math.PI/2,1.34,1.26,wood,invalidate),createWindow(new THREE.Vector3(-1.55,1.91,-2.55),0,1.84,1.40,wood,invalidate)];
  const curtains=[createCurtains(1.34,1.26,finishes),createCurtains(1.84,1.40,finishes)];
  windows.forEach((w,i)=>{root.add(w.root,w.shaftRoot);w.root.add(curtains[i].root);});
  // One thin woven object: body, sewn binding and fringe share a transform.
  const rug=group([.02,.035,.55]);rug.name="Bound wool rug";rug.rotation.y=-.045;
  const rugBody=box([2.62,.012,2.04],[0,.006,0],finishes.material("wool","#b8af93"),rug,.003);
  rugBody.name="woven-rug-body";rugBody.castShadow=false;
  const binding=finishes.material("fabric","#767d62"),thread=finishes.material("wool","#d4c9a9");
  for(const x of [-1.282,1.282])box([.035,.0025,2.0],[x,.013,0],binding,rug,.001);
  for(const z of [-.99,.99])box([2.57,.0025,.035],[0,.013,z],binding,rug,.001);
  for(const z of [-.945,.945])box([2.47,.001,.007],[0,.0135,z],thread,rug,.0002);
  for(let i=0;i<70;i++)for(const side of [-1,1]){
    const x=-1.24+i*.036;
    tube([[x,.009,side*1.015],[x+.002,.008,side*1.035],[x+.007,.004,side*(1.058+(i%3)*.006)]],.0018,thread,rug);
  }
  // Desk, exactly 1.4 × .70 × .74, rear left. Wall clearance for monitor leads.
  const desk = group([-1.35,0,-1.65]);
  box([1.46,.065,.76],[0,.727,0],wood,desk,.034);
  for(const x of [-.63,.63]) for(const z of [-.27,.27]) box([.065,.685,.065],[x,.365,z],edge,desk,.014);
  box([1.3,.09,.035],[0,.635,-.29],edge,desk);
  // A shallow drawer with an actual empty interior, mounted on side runners.
  for(const x of [.247,.673])box([.018,.17,.50],[x,.603,.015],wood,desk,.005);
  box([.42,.018,.50],[.46,.52,.015],wood,desk,.005);
  const deskDrawer=new THREE.Group();deskDrawer.position.set(.46,.59,.015);desk.add(deskDrawer);
  box([.396,.013,.45],[0,-.047,0],wood,deskDrawer,.004);
  for(const x of [-.192,.192])box([.012,.087,.45],[x,-.005,0],wood,deskDrawer,.003);
  box([.396,.087,.012],[0,-.005,-.219],wood,deskDrawer,.003);
  box([.426,.14,.027],[0,.011,.24],wood,deskDrawer,.008);
  box([.105,.014,.024],[0,.019,.266],brass,deskDrawer,.005);
  box([.23,.019,.17],[-.035,-.029,-.02],paper,deskDrawer,.003);
  for(let i=0;i<3;i++)rod([.12,-.029,-.14+i*.025],[.12,-.029,.06+i*.025],.0035,[edge,olive,brass][i],deskDrawer);
  box([.89,.012,.34],[-.15,.768,.1],finishes.material("leather", "#34483e"),desk,.025);
  for(const x of [-.63,.63]) box([.046,.075,.69],[x,.64,0],edge,desk,.009);
  for(const x of [-.55,.55]) { const screw = cyl(.009,.009,.003,[x,.763,-.29],brass,desk); screw.name="desk-joinery"; }
  // Monitor: back shell, bezel, screen, tilt joint, upright and base.
  const monitor = group([-.98,.76,-1.82],"monitor");
  box([.34,.024,.22],[0,.013,.035],graphite,monitor);
  cyl(.037,.045,.23,[0,.135,-.01],metal,monitor);
  box([.639,.372,.047],[0,.452,0],graphite,monitor,.013);
  box([.42,.2,.028],[0,.445,-.035],graphite,monitor);
  const screenTex = texture(c => { c.fillStyle="#243a38";c.fillRect(0,0,1024,512);c.fillStyle="#95c8be";c.font="24px monospace";c.fillText("WORKSPACE / 01",50,63);c.fillStyle="#edf0df";c.font="48px Arial";c.fillText("Agent workbench",50,154);c.font="30px Arial";c.fillText("Context / Model / Tools",50,218);const colors=["#82b3a6","#b7cfbb","#dab28b"];for(let i=0;i<5;i++){c.fillStyle=colors[i%3];c.fillRect(53,290+i*28,360+(i%3)*115,8);} c.strokeStyle="#93b7a6";c.lineWidth=3;c.strokeRect(731,259,173,195);c.font="65px Georgia";c.fillText("✦",787,377); });
  const monitorFace=surface(.616,.347,[0,.453,.025],screenTex,monitor,false,true);
  for(let i=0;i<15;i++) box([.019,.002,.009],[-.21+i*.03,.59,-.052],metal,monitor,.001);
  sphere([.004,.004,.002],[0,.632,.026],graphite,monitor);
  box([.065,.004,.002],[0,.269,.026],metal,monitor,.001);
  sphere([.004,.004,.003],[.276,.273,.026],mat("#9fd9b7"),monitor);
  const keyboard=group([-1.14,.784,-1.48]);
  box([.43,.019,.145],[0,0,0],mat("#cbd0c2"),keyboard,.012);
  const keyRows=["1234567890−+","QWERTYUIOP[]","ASDFGHJKL;↵·","⌘⌥          "];
  const legends=texture(c=>{c.fillStyle="#f6f0e1";c.fillRect(0,0,1024,512);c.fillStyle="#47564d";c.textAlign="center";c.font="42px monospace";keyRows.forEach((line,row)=>[...line].forEach((letter,col)=>c.fillText(letter,(col+.5)*1024/12,row*128+80)));});
  const keyInk=new THREE.MeshStandardMaterial({map:legends,roughness:.68});
  for(let row=0;row<4;row++) for(let col=0;col<12;col++){
    if(row===3&&col>=3&&col<=8)continue;
    box([.026,.008,.025],[-.191+col*.033,.014,-.05+row*.033],paper,keyboard,.004);
    const face=new THREE.PlaneGeometry(.021,.020),uv=face.getAttribute("uv");
    for(let v=0;v<uv.count;v++)uv.setXY(v,(col+uv.getX(v))/12,1-(row+1-uv.getY(v))/4);
    geometries.set(`key-${row}-${col}`,face);const legend=mesh(face,keyInk,[-.191+col*.033,.0181,-.05+row*.033],keyboard);legend.rotation.x=-Math.PI/2;legend.castShadow=false;
  }
  box([.19,.008,.025],[-.0095,.014,.049],paper,keyboard,.004);
  sphere([.037,.019,.055],[-.76,.787,-1.41],graphite);
  box([.007,.006,.019],[-.76,.805,-1.426],metal,root,.003);
  // Chair: proper seat, curved padded back, frame and five-star wheeled base.
  const chair=group([-1.32,0,-.6]);chair.rotation.y=-.13;
  box([.46,.075,.45],[0,.45,0],upholstery,chair,.067);
  box([.455,.37,.10],[0,.745,.20],upholstery,chair,.065);
  const piping=finishes.material("leather", "#76412d");
  tube([[-.19,.466,-.19],[.19,.466,-.19],[.21,.466,-.16],[.21,.466,.16],[.18,.466,.19],[-.18,.466,.19],[-.21,.466,.16],[-.21,.466,-.16]],.0028,piping,chair,true);
  tube([[-.19,.60,.145],[-.19,.88,.145],[-.16,.909,.145],[.16,.909,.145],[.19,.88,.145],[.19,.60,.145],[.16,.585,.145],[-.16,.585,.145]],.0025,piping,chair,true);
  for(const x of [-.11,0,.11]) sphere([.006,.006,.003],[x,.76,.146],piping,chair);
  for(const x of [-.2,.2]){rod([x,.43,.15],[x,.79,.22],.018,metal,chair);rod([x,.47,-.1],[x,.6,-.1],.013,metal,chair);box([.043,.032,.26],[x,.608,-.02],graphite,chair);}
  cyl(.032,.05,.31,[0,.253,0],metal,chair);
  for(let i=0;i<5;i++){
    const a=i*Math.PI*2/5,x=Math.cos(a)*.27,z=Math.sin(a)*.27;rod([0,.14,0],[x,.08,z],.023,metal,chair);
    for(const offset of [-.017,.017]){const wheel=cyl(.037,.037,.018,[x,.052,z+offset],graphite,chair);wheel.rotation.x=Math.PI/2;}
    const hub=cyl(.013,.013,.056,[x,.052,z],metal,chair);hub.rotation.x=Math.PI/2;
  }
  // Notebook: paper block and hinged cover pivot at the binding.
  const notebook=group([-2.64,1.082,.24],"library");notebook.rotation.y=Math.PI/2;
  box([.25,.013,.32],[0,0,0],terracotta,notebook,.006);
  box([.235,.024,.3],[.003,.017,0],paper,notebook,.005);
  for(let i=0;i<6;i++) box([.233,.0007,.298],[.003,.006+i*.004,0],mat("#c8bc9f"),notebook,.0001);
  box([.018,.002,.35],[.072,.03,.028],finishes.material("fabric", "#334f46"),notebook,.001);
  const noteTex=texture(c=>{c.fillStyle="#f5edda";c.fillRect(0,0,1024,512);c.fillStyle="#496d6b";c.font="58px Georgia";c.fillText("Small ideas",75,110);for(let i=0;i<4;i++){c.fillStyle="#bbb8a6";c.fillRect(75,180+i*65,750-i%2*130,3);}c.fillStyle="#cc916a";c.beginPath();c.arc(818,120,44,0,Math.PI*2);c.fill();});
  surface(.225,.285,[.005,.032,0],noteTex,notebook,true);
  const cover=new THREE.Group();cover.position.set(-.125,.033,0);notebook.add(cover);box([.25,.01,.32],[.125,0,0],terracotta,cover,.005);
  surface(.22,.285,[.125,.006,0],folioTexture("REFERENCE NOTES","PAPERS & IDEAS","#a65336","#ead5ae"),cover,true);
  rod([-.12,.035,-.14],[-.12,.035,.14],.008,edge,notebook);
  // Nameplate at the desk front, backed and supported by a wooden wedge.
  const name=group([-1.63,.786,-1.31]);
  const plate=box([.28,.08,.037],[0,.026,0],wood,name,.007);plate.rotation.x=-.22;
  const nameFace=surface(.26,.066,[0,.027,.021],texture(c=>{c.fillStyle="#d1ba87";c.fillRect(0,0,1024,256);c.fillStyle="#283e33";c.textAlign="center";c.font="90px Georgia";c.fillText("WANG BO",512,129);c.font="23px sans-serif";c.fillText("IMAGE PROCESSING / ADC",512,198);},1024,256),name);nameFace.rotation.x=-.22;
  for(const x of [-.12,.12])sphere([.003,.003,.002],[x,.027,.023],brass,name);
  // Jointed task lamp with actual shade, internal bulb, and warm pool.
  const lamp=group([-1.93,.765,-1.91]);cyl(.10,.105,.025,[0,.014,0],graphite,lamp);
  rod([0,.02,0],[.035,.31,-.035],.014,metal,lamp);rod([.035,.31,-.035],[.16,.42,.04],.012,metal,lamp);
  sphere([.025,.025,.025],[.035,.31,-.035],graphite,lamp);
  const shade=cyl(.052,.095,.11,[.17,.378,.057],graphite,lamp);shade.rotation.z=.2;
  cyl(.076,.076,.008,[.179,.324,.057],mat("#ffe5a9"),lamp);
  const bulb=new THREE.PointLight("#ffdba2",.45,1.6,2);bulb.position.set(.18,.31,.06);lamp.add(bulb);
  // Mug: hollow rim, dark tea and handle.
  const mug=group([-.79,.769,-1.34]);turned([[0,.004],[.033,.004],[.039,.012],[.043,.087],[.044,.095],[.040,.099],[.037,.094],[.035,.018],[0,.018]],[0,0,0],ceramic,mug);
  cyl(.036,.036,.002,[0,.081,0],finishes.material("ceramic", "#36251b"),mug);
  const torus=new THREE.TorusGeometry(.027,.007,12,32);geometries.set("mugHandle",torus);mesh(torus,ceramic,[.047,.052,0],mug);
  cyl(.065,.065,.006,[0,.001,0],finishes.material("cork", "#967c54"),mug);
  // Monitor cable runs to the rear and down to the power strip under the desk.
  const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(-.98,1,-1.86),new THREE.Vector3(-.94,.82,-2),new THREE.Vector3(-.9,.62,-2.02),new THREE.Vector3(-1.2,.59,-1.94)]);
  const cable=new THREE.TubeGeometry(curve,20,.006,6,false);geometries.set("cable",cable);mesh(cable,graphite,[0,0,0]);box([.3,.04,.065],[-1.25,.59,-1.94],paper);
  // A chalk study with temporary handwriting on the same texture as the board.
  const board=group([.99,1.85,-2.44]);board.name="Transformer chalkboard";
  box([2.22,1.18,.06],[0,0,0],edge,board,.014);
  box([2.12,1.08,.018],[0,0,.04],finishes.material("plaster","#263f36"),board,.004);
  const chalkTexture=texture(drawTransformerNotes,1600,800);
  const chalkFace=surface(2.09,1.045,[0,0,.051],chalkTexture,board);
  const chalkboard={face:chalkFace,canvas:chalkTexture.image as HTMLCanvasElement,texture:chalkTexture,width:2.09,height:1.045};
  board.scale.setScalar(.86);
  box([2.19,.032,.13],[0,-.592,.065],edge,board,.005);
  for(const [x,length] of [[-.6,.08],[-.47,.052],[.40,.07]]){const chalk=cyl(.006,.006,length,[x,-.569,.09],paper,board);chalk.rotation.z=Math.PI/2;chalk.userData.chalkTool="chalk";}
  box([.13,.032,.052],[.77,-.56,.078],finishes.material("wool","#8c9c89"),board,.006).userData.chalkTool="eraser";
  box([.13,.015,.052],[.77,-.537,.078],edge,board,.004).userData.chalkTool="eraser";
  // Invisible pick volumes make thin physical chalk usable without visible markers.
  const chalkPick=new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false,colorWrite:false});
  for(const [x,y,w,h,tool] of [[-.6,-.569,.11,.036,"chalk"],[-.47,-.569,.09,.036,"chalk"],[.40,-.569,.11,.036,"chalk"],[.77,-.55,.16,.055,"eraser"]] as const){
    const pick=box([w,h,.08],[x,y,.09],chalkPick,board,.001);pick.castShadow=false;pick.receiveShadow=false;pick.userData.chalkTool=tool;pick.userData.pickArea=true;
  }
  // Wall time is the device's actual local time, independent of environment previews.
  const clock=group([2.32,2.26,-2.43]);const clockRim=cyl(.19,.19,.045,[0,0,0],finishes.material("wood","#c7b58d"),clock);clockRim.rotation.x=Math.PI/2;
  const clockTex=texture(c=>{c.fillStyle="#efeada";c.fillRect(0,0,512,512);c.strokeStyle="#56665a";c.lineWidth=9;c.beginPath();c.arc(256,256,235,0,7);c.stroke();for(let i=0;i<12;i++){const a=i*Math.PI/6;c.beginPath();c.moveTo(256+Math.sin(a)*197,256-Math.cos(a)*197);c.lineTo(256+Math.sin(a)*214,256-Math.cos(a)*214);c.stroke();}},512,512);
  const clockGeo=new THREE.CircleGeometry(.169,48);geometries.set("clock",clockGeo);mesh(clockGeo,new THREE.MeshStandardMaterial({map:clockTex,roughness:.55}),[0,0,.025],clock);
  const clockHour=new THREE.Group(),clockMinute=new THREE.Group();clockHour.position.z=.031;clockMinute.position.z=.032;clock.add(clockHour,clockMinute);
  box([.009,.090,.002],[0,.037,0],graphite,clockHour,.002);box([.005,.128,.002],[0,.054,0],graphite,clockMinute,.001);
  sphere([.011,.011,.007],[0,0,.033],brass,clock);
  // Side bookcase: back, sides, shelves and visible supported grouped books.
  const library=group([-2.7,0,.58],"library");library.rotation.y=Math.PI/2;
  box([1.14,1.91,.065],[0,1.05,-.195],wood,library);
  for(const x of [-.55,.55])box([.065,2,.43],[x,1.03,0],wood,library);
  for(const y of [.11,.57,1.04,1.51,2.02])box([1.17,.055,.44],[0,y,0],wood,library);
  const bookColors=[blue,terracotta,olive,mat("#d5bd88"),paper];
  for(let row=0;row<4;row++){const count=row===2?3:row===3?4:5;for(let i=0;i<count;i++){
    const h=.27+(i%3)*.037,x=-.45+i*.11,y=[.14,.6,1.07,1.54][row]+h/2;
    const binding=bookColors[(i+row)%5];
    box([.066,h-.012,.217],[x,y,.03],paper,library,.002);
    for(const side of [-1,1])box([.005,h,.24],[x+side*.035,y,.035],binding,library,.002);
    box([.075,h,.015],[x,y,.15],binding,library,.006);
    for(const band of [-.34,.32])box([.059,.007,.003],[x,y+h*band,.159],brass,library,.001);
    box([.044,.036,.003],[x,y+h*.15,.159],paper,library,.001);
    for(let page=0;page<4;page++)box([.0008,.001,.2],[x-.024+page*.016,y+h/2-.005,.035],mat("#bcb6a6"),library,.0001);
  }}
  for(const x of [-.45,.45])box([.07,.1,.32],[x,.04,0],edge,library);
  // Low exhibition table for the application clipboard.
  const exhibit=group([.05,0,.75]);
  box([1.72,.075,1.05],[0,.617,0],wood,exhibit,.04);
  for(const x of [-.71,.71])for(const z of [-.37,.37]){const leg=box([.09,.56,.09],[x,.303,z],edge,exhibit);leg.rotation.z=x>0?-.055:.055;}
  box([1.44,.05,.04],[0,.22,-.34],edge,exhibit);
  box([1.46,.008,.82],[0,.66,0],finishes.material("wool", "#d4cbb8"),exhibit,.018);
  for(const z of [-.385,.385])box([1.38,.002,.008],[0,.665,z],finishes.material("fabric", "#8e9078"),exhibit,.002);
  const deskTray=group([-.50,.675,.90]);deskTray.rotation.y=.1;
  box([.46,.016,.30],[0,.012,0],edge,deskTray,.018);
  for(const x of [-.215,.215])box([.018,.035,.30],[x,.026,0],edge,deskTray,.005);
  for(const z of [-.14,.14])box([.44,.035,.018],[0,.026,z],edge,deskTray,.005);
  box([.29,.04,.22],[-.015,.042,0],finishes.material("wool","#718071"),deskTray,.006);
  for(const x of [-.12,-.10])box([.006,.001,.21],[x,.063,0],paper,deskTray,.0002);
  const pencilJar=group([-.55,.685,.47]);
  turned([[.03,0],[.048,.008],[.047,.11],[.043,.115],[.037,.112],[.037,.02],[.03,.01]],[0,0,0],ceramic,pencilJar);
  for(let i=0;i<3;i++){const x=(i-1)*.016;rod([x,.015,0],[x+(i-1)*.024,.195+i*.012,.01],.004,[edge,olive,brass][i],pencilJar);}
  const hourglass=group([.58,.685,.46]);hourglass.name="Brass sand timer";
  const sandFrame=new THREE.Group();sandFrame.position.y=.136;hourglass.add(sandFrame);
  for(const y of [-.122,.122]){cyl(.056,.056,.012,[0,y,0],brass,sandFrame);cyl(.047,.047,.006,[0,y+(y<0?.008:-.008),0],edge,sandFrame);}
  for(let i=0;i<3;i++){const a=i*Math.PI*2/3;rod([Math.cos(a)*.045,-.115,Math.sin(a)*.045],[Math.cos(a)*.045,.115,Math.sin(a)*.045],.0025,brass,sandFrame);}
  const timerGlass=new THREE.MeshPhysicalMaterial({color:"#e6ede4",roughness:.09,metalness:0,transparent:true,opacity:.25,side:THREE.DoubleSide,depthWrite:false});
  const glassProfile=new THREE.SplineCurve([[.033,-.106],[.039,-.085],[.031,-.045],[.009,-.012],[.006,0],[.009,.012],[.031,.045],[.039,.085],[.033,.106]].map(([x,y])=>new THREE.Vector2(x,y)));
  turned(glassProfile.getPoints(64).map(p=>[Math.max(.005,p.x),p.y]),[0,0,0],timerGlass,sandFrame);
  const sand=finishes.material("cork","#d5bb7c");
  const upperSand=cyl(.032,.002,.103,[0,.0515,0],sand,sandFrame),lowerSand=cyl(.002,.033,.070,[0,-.070,0],sand,sandFrame);
  const fallingSand=cyl(.0015,.0015,.14,[0,-.022,0],sand,sandFrame);fallingSand.castShadow=false;
  const hologram=createHologram(finishes);root.add(hologram.base,hologram.panel);
  const checklist=hologram.panel,checklistFace=hologram.face;
  const leafTexture=texture(c=>{
    const gradient=c.createLinearGradient(0,0,256,0);gradient.addColorStop(0,"#416a35");gradient.addColorStop(.48,"#719152");gradient.addColorStop(.52,"#36572e");gradient.addColorStop(1,"#598344");c.fillStyle=gradient;c.fillRect(0,0,256,512);
    c.strokeStyle="#a6b777";c.lineWidth=2;c.beginPath();c.moveTo(128,0);c.lineTo(128,512);c.stroke();
    for(let i=0;i<18;i++){c.strokeStyle="rgba(171,190,116,.32)";c.lineWidth=1;c.beginPath();c.moveTo(128,i*29);c.quadraticCurveTo(70,i*29+24,0,i*29+83);c.moveTo(128,i*29);c.quadraticCurveTo(185,i*29+24,256,i*29+83);c.stroke();}
  },256,512);
  const leafGeometry=new THREE.PlaneGeometry(1,1,8,16),leafPositions=leafGeometry.getAttribute("position"),leafUV=leafGeometry.getAttribute("uv");
  for(let i=0;i<leafPositions.count;i++){
    const t=leafUV.getY(i),side=(leafUV.getX(i)-.5)*2;
    leafPositions.setXYZ(i,side*.115*Math.pow(Math.sin(Math.PI*t),.75),t*.48,Math.sin(t*Math.PI)*.055+Math.abs(side)*.035*Math.sin(t*Math.PI));
  }
  leafGeometry.computeVertexNormals();geometries.set("botanical-leaf",leafGeometry);
  const leafMaterials=["#ffffff","#d4e3ba","#b6cca4"].map(color=>new THREE.MeshPhysicalMaterial({color,map:leafTexture,roughness:.48,side:THREE.DoubleSide,clearcoat:.15,clearcoatRoughness:.5}));
  function plant(p:number[],scale:number){
    const g=group(p);g.scale.setScalar(scale);
    const pot=finishes.material("ceramic", "#b66c49");pot.roughness=.52;pot.clearcoat=.12;
    turned([[.13,.014],[.14,.015],[.195,.295],[.205,.31],[.205,.331],[.181,.331],[.177,.301],[.125,.03]],[0,0,0],pot,g);
    cyl(.18,.18,.013,[0,.309,0],finishes.material("cork", "#3b3025"),g);
    cyl(.16,.17,.022,[0,.018,0],pot,g);
    for(let i=0;i<11;i++){
      const a=i*2.399,x=Math.cos(a)*(.12+(i%3)*.06),z=Math.sin(a)*(.12+(i%3)*.06),y=.48+(i%4)*.13;
      tube([[0,.31,0],[x*.35,y*.8,z*.35],[x,y,z]],.006,olive,g);
      const leaf=mesh(leafGeometry,leafMaterials[i%3],[x,y,z],g);leaf.rotation.set(.35+(i%3)*.2,a,-.45+(i%4)*.22);leaf.scale.setScalar(.74+(i%3)*.16);
    }
    return g;
  }
  const tallPlant=plant([2.67,.026,-1.38],.9);const entryPlant=plant([-2.48,.026,1.93],.8);
  // Architectural joinery, storage and a sculptural reading lamp.
  box([6.08,.045,.19],[0,2.85,-2.53],mat("#233f34"),root,.012);
  box([.19,.045,5.08],[-3.045,2.85,0],wood,root,.012);
  const storage=group([1.1,0,-2.15]);
  // An actual carcass: opening a door reveals shelves rather than a solid block.
  box([2.7,.54,.024],[0,.39,-.22],wood,storage,.006);
  for(const x of [-1.33,0,1.33])box([.032,.53,.43],[x,.395,-.012],wood,storage,.008);
  for(const y of [.136,.648])box([2.7,.03,.43],[0,y,-.012],wood,storage,.008);
  box([1.29,.025,.40],[-.663,.388,-.01],wood,storage,.004);
  for(let i=0;i<11;i++){
    const album=group([.15+i*.078,.153,.015]);storage.add(album);album.rotation.z=i===10?-.075:0;
    const jacket=finishes.material("fabric",["#69786a","#b99a72","#d8c8a5","#617478","#8d5d45"][i%5]);
    box([.025,.348,.326],[0,.174,0],jacket,album,.002);
    box([.013,.057,.001],[0,.24,.164],paper,album,.0003);
    box([.018,.002,.001],[0,.067,.164],brass,album,.0003);
  }
  for(let i=0;i<4;i++)box([.49,.023,.30],[-.76,.175+i*.026,.013],[paper,olive,edge,paper][i],storage,.003);
  box([.72,.183,.32],[-.72,.498,.005],finishes.material("fabric","#baae94"),storage,.014);
  box([.19,.041,.006],[-.72,.51,.169],brass,storage,.004);
  box([.16,.021,.007],[-.72,.51,.174],paper,storage,.002);
  box([2.77,.05,.49],[0,.68,0],wood,storage,.025);
  for(const x of [-1.16,1.16])for(const z of [-.12,.12])cyl(.028,.035,.12,[x,.075,z],graphite,storage);
  const doors=[{x:-1.32,sign:-1},{x:-.012,sign:1},{x:.012,sign:-1},{x:1.32,sign:1}].map(({x,sign},index)=>{
    const door=new THREE.Group();door.position.set(x,.39,.207);door.userData.doorIndex=index;storage.add(door);
    // Four 64.5 cm leaves, with meeting gaps and hinges on the cabinet partitions.
    box([.645,.46,.018],[-sign*.3225,0,0],wood,door,.006);
    for(let i=0;i<9;i++)box([.034,.425,.018],[-sign*(.032+i*.072),0,.015],edge,door,.004);
    sphere([.013,.013,.014],[-sign*.594,.065,.036],brass,door);
    for(const y of [-.155,.155])cyl(.004,.004,.035,[-sign*.012,y,-.003],brass,door);
    return {door,sign};
  });
  const gramophone=createGramophone(finishes);root.add(gramophone.root);

  // Slender floor lamp, held by a weighted disc and a curved steel neck.
  const floorLamp=group([2.60,0,1.90]);
  cyl(.18,.2,.045,[0,.05,0],graphite,floorLamp);
  rod([0,.08,0],[0,1.64,0],.013,metal,floorLamp);
  const lampCurve=new THREE.CatmullRomCurve3([new THREE.Vector3(0,1.61,0),new THREE.Vector3(-.02,1.78,0),new THREE.Vector3(-.2,1.84,0),new THREE.Vector3(-.34,1.77,0)]);
  const lampTube=new THREE.TubeGeometry(lampCurve,24,.013,8,false);geometries.set("floorLamp",lampTube);mesh(lampTube,metal,[0,0,0],floorLamp);
  turned([[.19,0],[.085,.19],[.08,.19],[.184,0]],[-.34,1.59,0],finishes.material("fabric", "#ede4cf"),floorLamp);
  for(const y of [1.59,1.78]){const rim=new THREE.TorusGeometry(y===1.59?.188:.082,.003,6,40);geometries.set(`lamp-rim-${y}`,rim);mesh(rim,brass,[-.34,y,0],floorLamp).rotation.x=Math.PI/2;}
  const warm= new THREE.MeshStandardMaterial({color:"#ffdfae",emissive:"#ffc67d",emissiveIntensity:.6});
  sphere([.036,.045,.036],[-.34,1.65,0],warm,floorLamp);
  const readingLight=new THREE.PointLight("#ffdab0",.32,2.4,2);readingLight.position.set(-.34,1.59,0);floorLamp.add(readingLight);
  // A personal journal starts the route, on the central coffee table.
  const journal=group([.10,.684,.78],"name");journal.rotation.y=-.08;
  box([.49,.012,.35],[0,0,0],finishes.material("leather","#476a51"),journal,.007);
  box([.46,.020,.325],[.005,.014,0],paper,journal,.004);
  for(let i=0;i<5;i++)box([.456,.0006,.322],[.005,.008+i*.004,0],mat("#c7bfa9"),journal,.0001);
  const journalFace=surface(.442,.307,[.005,.025,0],folioTexture("WANG BO","PERSONAL JOURNAL","#f6eedb","#3d5c44"),journal,true);
  const journalCover=group([-.245,.025,0]);journal.add(journalCover);box([.49,.012,.35],[.245,0,0],finishes.material("leather","#476a51"),journalCover,.005);
  surface(.46,.32,[.245,.007,0],folioTexture("ABOUT ME","WORK & CURIOSITY","#35583f","#ede3bf"),journalCover,true);
  rod([-.238,.025,-.155],[-.238,.025,.155],.008,brass,journal);
  // Tilted research volume, file boxes and horizontal reading stacks.
  for(const z of [.27,.53])rod([-2.48,1.069,z],[-2.42,1.18,z],.008,brass);
  for(let i=0;i<3;i++){box([.26,.027,.21],[.32,.62+i*.031,.035],[paper,olive,terracotta][i],library,.004);}
  box([.26,.32,.24],[.31,1.25,.01],finishes.material("fabric","#d7d2b9"),library,.005);box([.12,.055,.003],[.31,1.26,.133],paper,library,.001);
  // Work-in-progress notes on the desk, with recognisable image patches.
  const researchSheet=group([-1.72,.773,-1.73]);researchSheet.rotation.y=-.13;
  box([.28,.002,.24],[0,0,0],paper,researchSheet,.001);
  surface(.26,.22,[0,.002,0],texture(c=>{c.fillStyle="#f4eeda";c.fillRect(0,0,512,512);c.fillStyle="#345640";c.font="25px Arial";c.fillText("IMAGE STUDY",35,60);for(let i=0;i<16;i++){c.fillStyle=i===5?"#bc9a55":i%3?"#46745e":"#789278";c.fillRect(40+i%4*105,110+Math.floor(i/4)*85,98,78);}c.fillStyle="#647552";c.font="18px Arial";c.fillText("VGG / ViT / ResNet",35,490);},512,512),researchSheet,true);
  surface(.20,.14,[-1.73,.774,-1.38],texture(c=>{c.fillStyle="#eaddb2";c.fillRect(0,0,512,512);c.fillStyle="#486247";c.font="48px Arial";c.fillText("TO CHECK",35,95);["data split","pre-training","evaluation"].forEach((v,i)=>{c.strokeStyle="#82794c";c.strokeRect(35,155+i*90,30,30);c.font="29px Arial";c.fillText(v,92,184+i*90);});},512,512),root,true);
  // Reading materials and a living plant belong beside the optical instrument.
  const bookStack=group([.10,.724,-2.15]);bookStack.rotation.y=.08;
  for(let i=0;i<3;i++){const volume=new THREE.Group();volume.position.y=i*.045;volume.rotation.y=(i-1)*.10;bookStack.add(volume);
    const coverMat=finishes.material("fabric",["#526e55","#c0ad8c","#79533c"][i]);
    box([.40,.035,.28],[0,.018,0],paper,volume,.002);
    for(const y of [0,.038])box([.42,.006,.29],[0,y,0],coverMat,volume,.003);
    box([.009,.041,.29],[-.21,.019,0],coverMat,volume,.002);
  }
  const cabinetPlant=plant([.10,.865,-2.15],.36);
  const sofa=createSofa(finishes);root.add(sofa.root);
  const propState={deskLamp:true,floorLamp:true,record:false,robotPaused:false,cabinetOpen:false,doorsOpen:[false,false,false,false],drawerOpen:false,timerFlips:0,timerRemaining:0,chairTurn:false,coffee:0,plant:0};
  const targets={} as Record<ScenePropId,{object:THREE.Object3D;center:THREE.Vector3;direction:THREE.Vector3;distance:number}>;
  function interactive(id:ScenePropId,object:THREE.Object3D,center:number[],distance:number,direction=[.25,.32,1]){
    object.userData.interactionId=id;targets[id]={object,center:new THREE.Vector3(...center),direction:new THREE.Vector3(...direction).normalize(),distance};
  }
  interactive("rear-curtain",windows[1].root,[-1.55,1.91,-2.4],3.4,[0,.02,1]);
  interactive("left-curtain",windows[0].root,[-2.9,1.64,-1.15],2.9,[1,.04,.08]);
  interactive("desk-lamp",lamp,[-1.85,1.03,-1.84],1.35,[.5,.35,1]);
  interactive("floor-lamp",floorLamp,[2.35,1.22,1.90],2.65,[.3,.24,1]);
  interactive("chalkboard",board,[.99,1.85,-2.38],3.05,[0,0,1]);
  interactive("gramophone",gramophone.root,[2.18,1.12,-2.03],1.65,[.2,.3,1]);
  interactive("coffee",mug,[-.79,.85,-1.34],.62,[.5,.8,1]);
  interactive("sofa",sofa.root,[1.91,.53,.80],2.7,[-1,.6,.8]);
  interactive("chair",chair,[-1.32,.5,-.60],1.95,[.55,.35,1]);
  interactive("plant",cabinetPlant,[.1,1.01,-2.15],1.3);
  [tallPlant,entryPlant,bookStack].forEach(o=>o.userData.interactionId="plant");
  interactive("cabinet",storage,[1.1,.39,-2.15],3.9);
  interactive("desk-drawer",deskDrawer,[-.89,.59,-1.47],1.4,[.3,.32,1]);
  interactive("hourglass",hourglass,[.58,.82,.46],.70,[.3,.25,1]);
  interactive("clock",clock,[2.32,2.26,-2.39],.95,[0,0,1]);
  // Small reactions preserve each object's scale and physical placement.
  function activate(id:ScenePropId,detail?:number){
    if(id==="sofa")sofa.touch();else if(id==="rear-curtain")curtains[1].toggle();else if(id==="left-curtain")curtains[0].toggle();
    else if(id==="desk-lamp")propState.deskLamp=!propState.deskLamp;
    else if(id==="floor-lamp")propState.floorLamp=!propState.floorLamp;
    else if(id==="chair")propState.chairTurn=!propState.chairTurn;
    else if(id==="cabinet"){const index=detail??0;propState.doorsOpen[index]=!propState.doorsOpen[index];propState.cabinetOpen=propState.doorsOpen.some(Boolean);}
    else if(id==="desk-drawer")propState.drawerOpen=!propState.drawerOpen;
    else if(id==="hourglass"){propState.timerFlips++;propState.timerRemaining=30;}
    else if(id==="robot")propState.robotPaused=!propState.robotPaused;
    else if(id==="coffee")propState.coffee=8;
    else if(id==="plant")propState.plant=2;
    invalidate();
  }
  const surfaces: Partial<Record<ViewId,{face:THREE.Object3D;group:THREE.Group;width:number;height:number}>> = {
    name:{face:journalFace,group:journal,width:.442,height:.307},
    notebook:{face:journalFace,group:journal,width:.442,height:.307},
    board:{face:monitorFace,group:monitor,width:.616,height:.347},
    monitor:{face:monitorFace,group:monitor,width:.616,height:.347},
    checklist:{face:checklistFace,group:checklist,width:hologram.width,height:hologram.height},
  };
  // The objects have one fixed, readable aspect ratio in every view. Only their
  // articulated covers move; the camera no longer stretches the physical models.
  for(const s of Object.values(surfaces))s.group.scale.x=s.height*1.76/s.width;
  function readingFrame(view:ViewId) {
    const s=surfaces[view];if(!s)return null;
    const position=s.group.position;
    const orientation=s.group.quaternion;
    const matrix=new THREE.Matrix4().compose(position,orientation,s.group.scale);
    s.face.updateMatrix();matrix.multiply(s.face.matrix);
    const center=new THREE.Vector3(),rotation=new THREE.Quaternion(),scale=new THREE.Vector3();matrix.decompose(center,rotation,scale);
    return {center,normal:new THREE.Vector3(0,0,1).applyQuaternion(rotation),up:new THREE.Vector3(0,1,0).applyQuaternion(rotation),height:s.height*scale.y};
  }
  // Subtle foundation shadow anchors the complete diorama to the page.
  const foundationTex=texture(c=>{const grad=c.createRadialGradient(256,256,30,256,256,255);grad.addColorStop(0,"rgba(44,52,35,.32)");grad.addColorStop(.55,"rgba(44,52,35,.16)");grad.addColorStop(1,"rgba(44,52,35,0)");c.fillStyle=grad;c.fillRect(0,0,512,512);},512,512);
  const foundationGeo=new THREE.PlaneGeometry(11.6,10.5);geometries.set("foundationShadow",foundationGeo);const foundation=mesh(foundationGeo,new THREE.MeshBasicMaterial({map:foundationTex,transparent:true,depthWrite:false}),[.25,-.51,.18]);foundation.rotation.x=-Math.PI/2;foundation.castShadow=false;
  // Soft contact pools augment the directional shadows without full-screen effects.
  const shadowTex=texture(c=>{const g=c.createRadialGradient(256,256,0,256,256,250);g.addColorStop(0,"rgba(52,44,33,.28)");g.addColorStop(1,"rgba(52,44,33,0)");c.fillStyle=g;c.fillRect(0,0,512,512);},512,512);
  for(const [x,z,w,h] of [[-1.35,-1.65,2,1.3],[-1.32,-.6,.8,.8],[.05,.75,2.3,1.6],[-2.7,.58,.8,1.8],[2.51,-1.96,.85,.85],[1.91,.8,1.05,1.9]]){const geo=new THREE.PlaneGeometry(w,h);geometries.set(`shadow${x}`,geo);const m=mesh(geo,new THREE.MeshBasicMaterial({map:shadowTex,transparent:true,depthWrite:false}),[x,.032,z]);m.rotation.x=-Math.PI/2;m.castShadow=false;}
  const hemi=new THREE.HemisphereLight("#f6f0e5","#7a8070",1.25);root.add(hemi);
  const sun=new THREE.DirectionalLight("#fff0d8",3.1);sun.position.set(-3.7,6.5,4.8);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-4.8;sun.shadow.camera.right=4.8;sun.shadow.camera.top=4.8;sun.shadow.camera.bottom=-4.8;sun.shadow.normalBias=.012;sun.shadow.bias=-.00015;sun.shadow.radius=4;root.add(sun);
  const fill=new THREE.DirectionalLight("#fff3dc",.6);fill.position.set(5,4,2);root.add(fill);
  // Batch static meshes by material and interaction owner. Animated joints stay separate.
  const dynamic=new Set<THREE.Object3D>([cover,journalCover,journal,name,notebook,board,monitor,checklist,hologram.base,clock,sofa.root,chair,lamp,floorLamp,mug,storage,gramophone.root,cabinetPlant,tallPlant,entryPlant,bookStack,deskDrawer,hourglass,...windows.flatMap(w=>[w.root,w.shaftRoot])]);
  const batches=new Map<string,{material:THREE.Material;id?:string;shadow:boolean;meshes:THREE.Mesh[]}>();
  root.updateMatrixWorld(true);
  root.traverse(o=>{if(!(o instanceof THREE.Mesh)||Array.isArray(o.material))return;let parent:THREE.Object3D|null=o,id:string|undefined;while(parent){if(dynamic.has(parent))return;if(parent.userData.objectId)id=parent.userData.objectId;parent=parent.parent;}const key=o.material.uuid+id+o.castShadow;let b=batches.get(key);if(!b){b={material:o.material,id,shadow:o.castShadow,meshes:[]};batches.set(key,b);}b.meshes.push(o);});
  for(const b of batches.values()){if(b.meshes.length<2)continue;const pieces=b.meshes.map(m=>{const g=m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone();return g.applyMatrix4(m.matrixWorld);});const combined=mergeGeometries(pieces);pieces.forEach(g=>g.dispose());if(!combined)continue;const m=mesh(combined,b.material,[0,0,0]);m.castShadow=b.shadow;if(b.id)m.userData.objectId=b.id;b.meshes.forEach(o=>o.removeFromParent());geometries.set(`batch${geometries.size}`,combined);}
  const garden = buildGarden(finishes); root.add(garden.root);
  const life=createRoomLife();root.add(life.root);
  interactive("robot",life.robot,[2.08,.12,-1.78],1.45,[.3,.8,1]);
  let screenStep=-2,robotPreviewMotion=false,allowReactions=true;
  const interactions={targets,doors,activate,setRecord(playing:boolean){propState.record=playing;invalidate();},
    snapshot:()=>({...propState,curtains:curtains.map(c=>({open:c.open,target:c.target})),lampIntensity:[bulb.intensity,readingLight.intensity],ink:chalkboard.canvas.dataset.strokes||"0"}),
    update(dt:number,instant:boolean,inspection:ScenePropId|null){robotPreviewMotion=inspection==="robot"&&!instant;allowReactions=!instant;let changing=sofa.update(dt,instant);curtains.forEach(c=>{if(c.update(dt,instant))changing=true;});
      const chairGoal=propState.chairTurn?.55:-.13;chair.rotation.y=instant?chairGoal:THREE.MathUtils.damp(chair.rotation.y,chairGoal,4,dt);changing ||=Math.abs(chair.rotation.y-chairGoal)>.001;
      doors.forEach(({door,sign},i)=>{const goal=propState.doorsOpen[i]?sign*1.12:0;door.rotation.y=instant?goal:THREE.MathUtils.damp(door.rotation.y,goal,4,dt);changing ||=Math.abs(door.rotation.y-goal)>.001;});
      const drawerGoal=propState.drawerOpen?.30:.015;
      deskDrawer.position.z=instant?drawerGoal:THREE.MathUtils.damp(deskDrawer.position.z,drawerGoal,5,dt);changing ||=Math.abs(deskDrawer.position.z-drawerGoal)>.001;
      const flipGoal=propState.timerFlips*Math.PI;
      sandFrame.rotation.z=instant?flipGoal:THREE.MathUtils.damp(sandFrame.rotation.z,flipGoal,5,dt);changing ||=Math.abs(sandFrame.rotation.z-flipGoal)>.001;
      if(propState.timerRemaining>0&&!instant){propState.timerRemaining=Math.max(0,propState.timerRemaining-dt);changing=true;}
      const amount=propState.timerFlips?propState.timerRemaining/30:1,odd=propState.timerFlips%2,side=odd?-1:1;
      const upperFill=Math.cbrt(amount),lowerFill=Math.cbrt(1-amount);
      upperSand.scale.setScalar(Math.max(.001,upperFill));lowerSand.scale.setScalar(Math.max(.001,lowerFill));
      upperSand.position.y=side*.0515*upperFill;lowerSand.position.y=side*(-.105+.035*lowerFill);
      upperSand.rotation.z=lowerSand.rotation.z=odd*Math.PI;fallingSand.position.y=-side*.022;
      fallingSand.visible=propState.timerRemaining>0&&!instant;
      if(propState.plant>0){propState.plant=Math.max(0,propState.plant-dt);[cabinetPlant,tallPlant,entryPlant].forEach(p=>p.rotation.z=instant?0:Math.sin(propState.plant*12)*.018*Math.min(1,propState.plant));changing=true;}
      propState.coffee=Math.max(0,propState.coffee-dt);
      changing=gramophone.update(dt,propState.record,instant)||changing;
      return changing||propState.coffee>0&&!instant||propState.record&&!instant||robotPreviewMotion&&!propState.robotPaused;
    }};
  return { root, sun, garden, surfaces, readingFrame, hologram, life, clock, interactions, chalkboard,
    fitSurfaces(view:ViewId,dt:number,instant:boolean,motion:boolean,reveal=1) {
      const changing=hologram.update(view==="checklist"?reveal:0,dt,instant,motion);
      root.updateMatrixWorld(true);return changing;
    }, setEnvironment(env:Environment,dt:number,motion:boolean) {
      const direction=new THREE.Vector3(...sunDirection(env));sun.position.copy(direction).multiplyScalar(8);
      const daylight=THREE.MathUtils.smoothstep(env.altitude,-9,18),night=1-daylight;
      sun.visible=env.altitude>0;sun.intensity=3.5*Math.sqrt(Math.max(0,direction.y))*(1-env.cloud*.91);
      sun.color.set(env.altitude<16?"#ffd2a0":"#fff2dc");
      hemi.color.set(night>.5?"#889daf":"#eef2e6");hemi.intensity=.20+daylight*1.0;
      fill.color.set(night>.5?"#b7c3d7":"#f9efdc");fill.intensity=.10+daylight*.45;
      readingLight.intensity=propState.floorLamp?.38+night*1.8:0;bulb.intensity=propState.deskLamp?.32+night*.85:0;warm.emissiveIntensity=propState.floorLamp?.5+night*1.4:0;
      const now=new Date(),minutes=now.getMinutes()+now.getSeconds()/60;clockHour.rotation.z=-((now.getHours()%12)+minutes/60)*Math.PI/6;clockMinute.rotation.z=-minutes*Math.PI/30;clock.userData.time=now.toTimeString().slice(0,8);
      windows.forEach((w,i)=>w.update(env,dt,motion,curtains[i].open));life.update(dt,motion||robotPreviewMotion,propState.robotPaused,propState.coffee>0&&allowReactions);garden.setSeason(env.season,env.weather);
      return night;
  }, animate(journalOpen:number,agentStep:number) {
    journalCover.rotation.z=journalOpen*3.02;
    if(agentStep>=0&&agentStep!==screenStep){screenStep=agentStep;const c=(screenTex.image as HTMLCanvasElement).getContext("2d")!;c.fillStyle="#183731";c.fillRect(0,0,1024,512);c.fillStyle="#dbe8bc";c.font="32px monospace";c.fillText("AGENT / EXECUTION LOOP",48,75);c.font="60px Georgia";c.fillText(["Goal","Generate","Inspect","Observe","Revise","Verify","Deliver"][agentStep],48,165);["Context","Model","Tools"].forEach((v,i)=>{c.strokeStyle="#a9c596";c.lineWidth=2;c.strokeRect(48+i*312,245,255,110);c.fillStyle="#e2ebd1";c.font="28px Arial";c.fillText(v,75+i*312,310);});c.strokeStyle="#d6c38f";c.beginPath();c.moveTo(855,368);c.lineTo(855,428);c.lineTo(165,428);c.lineTo(165,368);c.stroke();screenTex.needsUpdate=true;}

  }, dispose(){
    garden.root.removeFromParent(); garden.dispose();curtains.forEach(c=>c.dispose());windows.forEach(w=>w.dispose());life.dispose();hologram.dispose();
    const allMats=new Set<THREE.Material>();root.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>allMats.add(m));}});geometries.forEach(g=>g.dispose());allMats.forEach(m=>m.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());finishes.dispose();
  } };
}
