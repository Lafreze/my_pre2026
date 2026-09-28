import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import type { ObjectId } from "./content";

// Metres; floor 6 × 5, desk .74 high, seat .45 high. Everything is locally built.
export function buildRoom() {
  const root = new THREE.Group();
  const materials = new Map<string, THREE.MeshStandardMaterial>();
  const geometries = new Map<string, THREE.BufferGeometry>();
  const textures: THREE.Texture[] = [];
  const mat = (color: string, roughness = .65, metalness = 0) => {
    const key = color + roughness + metalness;
    if (!materials.has(key)) materials.set(key, new THREE.MeshStandardMaterial({ color, roughness, metalness }));
    return materials.get(key)!;
  };
  const cream = mat("#ede7d8"), wood = mat("#bd8b55"), edge = mat("#976a40"), graphite = mat("#242e2b"), metal = mat("#566361", .38, .42), paper = mat("#faf5e8"), blue = mat("#3655c4"), terracotta = mat("#b45531"), olive = mat("#486140");
  function mesh(geometry: THREE.BufferGeometry, material: THREE.Material, p: number[], parent: THREE.Object3D = root) {
    const m = new THREE.Mesh(geometry, material); m.position.set(p[0], p[1], p[2]); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
  }
  function box(size: number[], p: number[], material: THREE.Material, parent: THREE.Object3D = root, radius = .025) {
    const r = Math.min(radius, Math.min(...size) / 3); const key = [...size, r].join(",");
    if (!geometries.has(key)) geometries.set(key, new RoundedBoxGeometry(size[0], size[1], size[2], r >= .03 ? 4 : 2, r));
    return mesh(geometries.get(key)!, material, p, parent);
  }
  function cyl(rt: number, rb: number, h: number, p: number[], material: THREE.Material, parent: THREE.Object3D = root) {
    const key = `c${rt},${rb},${h}`;
    if (!geometries.has(key)) geometries.set(key, new THREE.CylinderGeometry(rt, rb, h, 24));
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
  function texture(draw: (c: CanvasRenderingContext2D) => void, w = 1024, h = 512) {
    const canvas = document.createElement("canvas"); canvas.width = w; canvas.height = h;
    draw(canvas.getContext("2d")!); const t = new THREE.CanvasTexture(canvas); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; textures.push(t); return t;
  }
  function surface(w: number, h: number, p: number[], tex: THREE.Texture, parent: THREE.Object3D = root, horizontal = false) {
    const geometry = new THREE.PlaneGeometry(w, h); geometries.set(`plane${geometries.size}`, geometry);
    const material = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide });
    const m = mesh(geometry, material, p, parent); m.castShadow = false; if (horizontal) m.rotation.x = -Math.PI / 2; return m;
  }
  function labelTexture(title: string, sub: string, bg = "#e9e2d4", fg = "#374744") {
    return texture(c => { c.fillStyle = bg; c.fillRect(0, 0, 1024, 512); c.strokeStyle = fg; c.lineWidth = 2; c.strokeRect(30,30,964,452); c.fillStyle = fg; c.font = "500 80px Georgia"; c.fillText(title, 70, 230); c.font = "26px sans-serif"; c.fillText(sub,70,310); });
  }
  // Architectural section: rear and left walls; clean solid floor edge.
  box([6.12,.2,5.12], [0,-.11,0], mat("#3b4f44"), root, .07);
  const floor = mat("#c3a77e");
  for (let i = 0; i < 15; i++) box([.394,.04,5], [-2.79 + i * .4,.005,0], floor, root, .008);
  const grain = texture(c => { c.fillStyle="#d7bd9c";c.fillRect(0,0,1024,512); for(let i=0;i<95;i++){ c.strokeStyle=`rgba(109,78,46,${.025+(i%5)*.012})`;c.beginPath();c.moveTo(0,i*6);c.bezierCurveTo(300,i*6+7,700,i*6-5,1024,i*6+4);c.stroke(); } });
  wood.map = grain; wood.color.set("#c8a578");
  box([6.08,2.85,.13],[0,1.43,-2.55],mat("#31594b"),root,.025);
  // Left wall is built around the window opening, not a luminous plane on a solid wall.
  box([.13,2.85,2.9],[-3.05,1.43,1.05],cream);
  box([.13,2.85,.65],[-3.05,1.43,-2.2],cream);
  box([.13,.93,1.5],[-3.05,.465,-1.15],cream);
  box([.13,.5,1.5],[-3.05,2.6,-1.15],cream);
  box([5.97,.1,.035],[0,.09,-2.46],paper);
  box([.035,.1,4.98],[-2.97,.09,0],paper);
  const window = group([-3,1.65,-1.15]);
  box([.1,1.48,1.55],[0,0,0],wood,window);
  box([.115,1.28,1.33],[.015,0,0],mat("#c8dfe0"),window);
  for (const z of [-.70,0,.70]) box([.15,1.48,.045],[.075,0,z],paper,window);
  box([.17,.045,1.46],[.08,.15,0],paper,window);
  box([.33,.065,1.68],[.09,-.74,0],paper,window);
  // Window highlights and distant architectural silhouettes, kept very soft.
  for(let i=0;i<5;i++) box([.012,.22+(i%3)*.1,.13],[.076,-.42+(i%3)*.05,-.53+i*.25],mat("#b5ceca"),window,.002);
  const rug = box([2.7,.024,2.25],[.05,.042,.65],mat("#b7b596"),root,.14);
  rug.rotation.y = -.045;
  for(let i=0;i<19;i++) box([.045,.008,2.03],[-1.15+i*.13,.058,.65],mat("#c5c4a8"),root,.002);
  // Desk, exactly 1.4 × .70 × .74, rear left. Wall clearance for monitor leads.
  const desk = group([-1.35,0,-1.65]);
  box([1.46,.065,.76],[0,.727,0],wood,desk,.034);
  for(const x of [-.63,.63]) for(const z of [-.27,.27]) box([.065,.685,.065],[x,.365,z],edge,desk,.014);
  box([1.3,.09,.035],[0,.635,-.29],edge,desk);
  box([.41,.17,.5],[.46,.603,.015],wood,desk);
  box([.12,.018,.026],[.46,.615,.278],metal,desk,.008);
  box([.89,.012,.34],[-.15,.768,.1],mat("#394b44"),desk,.025);
  // Monitor: back shell, bezel, screen, tilt joint, upright and base.
  const monitor = group([-.98,.76,-1.82],"monitor");
  box([.34,.024,.22],[0,.013,.035],graphite,monitor);
  cyl(.037,.045,.23,[0,.135,-.01],metal,monitor);
  box([.665,.4,.047],[0,.452,0],graphite,monitor,.022);
  box([.42,.2,.028],[0,.445,-.035],graphite,monitor);
  const screenTex = texture(c => { c.fillStyle="#243a38";c.fillRect(0,0,1024,512);c.fillStyle="#95c8be";c.font="24px monospace";c.fillText("WORKSPACE / 01",50,63);c.fillStyle="#edf0df";c.font="54px Georgia";c.fillText("Make something",50,154);c.fillText("worth trying.",50,218);const colors=["#82b3a6","#b7cfbb","#dab28b"];for(let i=0;i<5;i++){c.fillStyle=colors[i%3];c.fillRect(53,290+i*28,360+(i%3)*115,8);} c.strokeStyle="#93b7a6";c.lineWidth=3;c.strokeRect(731,259,173,195);c.font="65px Georgia";c.fillText("✦",787,377); });
  surface(.616,.347,[0,.453,.025],screenTex,monitor);
  sphere([.005,.005,.005],[.276,.277,.026],mat("#9fd9b7"),monitor);
  const keyboard=group([-1.14,.784,-1.48]);
  box([.43,.019,.145],[0,0,0],mat("#cbd0c2"),keyboard,.012);
  for(let row=0;row<4;row++) for(let col=0;col<12;col++){
    if(row===3&&col>=3&&col<=8)continue;
    box([.026,.008,.025],[-.191+col*.033,.014,-.05+row*.033],paper,keyboard,.004);
  }
  box([.19,.008,.025],[-.0095,.014,.049],paper,keyboard,.004);
  sphere([.037,.019,.055],[-.76,.787,-1.41],graphite);
  box([.007,.006,.019],[-.76,.805,-1.426],metal,root,.003);
  // Chair: proper seat, curved padded back, frame and five-star wheeled base.
  const chair=group([-1.32,0,-.6]);chair.rotation.y=-.13;
  box([.46,.075,.45],[0,.45,0],mat("#bb603b",.92),chair,.067);
  box([.455,.37,.10],[0,.745,.20],mat("#bb603b",.92),chair,.065);
  for(const x of [-.2,.2]){rod([x,.43,.15],[x,.79,.22],.018,metal,chair);rod([x,.47,-.1],[x,.6,-.1],.013,metal,chair);box([.043,.032,.26],[x,.608,-.02],graphite,chair);}
  cyl(.032,.05,.31,[0,.253,0],metal,chair);
  for(let i=0;i<5;i++){const a=i*Math.PI*2/5;const x=Math.cos(a)*.27,z=Math.sin(a)*.27;rod([0,.14,0],[x,.08,z],.023,metal,chair);sphere([.045,.04,.03],[x,.05,z],graphite,chair);}
  // Notebook: paper block and hinged cover pivot at the binding.
  const notebook=group([-1.79,.776,-1.58],"notebook");notebook.rotation.y=-.15;
  box([.25,.013,.32],[0,0,0],terracotta,notebook,.006);
  box([.235,.024,.3],[.003,.017,0],paper,notebook,.005);
  const noteTex=texture(c=>{c.fillStyle="#f5edda";c.fillRect(0,0,1024,512);c.fillStyle="#496d6b";c.font="58px Georgia";c.fillText("Small ideas",75,110);for(let i=0;i<4;i++){c.fillStyle="#bbb8a6";c.fillRect(75,180+i*65,750-i%2*130,3);}c.fillStyle="#cc916a";c.beginPath();c.arc(818,120,44,0,Math.PI*2);c.fill();});
  surface(.225,.285,[.005,.032,0],noteTex,notebook,true);
  const cover=new THREE.Group();cover.position.set(-.125,.033,0);notebook.add(cover);box([.25,.01,.32],[.125,0,0],terracotta,cover,.005);
  surface(.22,.285,[.125,.006,0],labelTexture("NOTES","IDEAS, IN PROGRESS","#c65d36","#f4e7d3"),cover,true);
  rod([-.12,.035,-.14],[-.12,.035,.14],.008,edge,notebook);
  // Nameplate at the desk front, backed and supported by a wooden wedge.
  const name=group([-1.63,.786,-1.31],"name");
  const plate=box([.28,.08,.037],[0,.026,0],wood,name,.007);plate.rotation.x=-.22;
  const nameFace=surface(.26,.066,[0,.027,.021],labelTexture("WANG BO","MAKE / TRY / IMPROVE"),name);nameFace.rotation.x=-.22;
  // Jointed task lamp with actual shade, internal bulb, and warm pool.
  const lamp=group([-1.93,.765,-1.91]);cyl(.10,.105,.025,[0,.014,0],graphite,lamp);
  rod([0,.02,0],[.035,.31,-.035],.014,metal,lamp);rod([.035,.31,-.035],[.16,.42,.04],.012,metal,lamp);
  sphere([.025,.025,.025],[.035,.31,-.035],graphite,lamp);
  const shade=cyl(.052,.095,.11,[.17,.378,.057],graphite,lamp);shade.rotation.z=.2;
  cyl(.076,.076,.008,[.179,.324,.057],mat("#ffe5a9"),lamp);
  const bulb=new THREE.PointLight("#ffdba2",.45,1.6,2);bulb.position.set(.18,.31,.06);lamp.add(bulb);
  // Mug: hollow rim, dark tea and handle.
  const mug=group([-.78,.769,-1.87]);cyl(.045,.038,.09,[0,.048,0],cream,mug);cyl(.034,.034,.002,[0,.094,0],mat("#625342"),mug);
  const torus=new THREE.TorusGeometry(.027,.009,8,20);geometries.set("mugHandle",torus);mesh(torus,cream,[.047,.052,0],mug);
  // Monitor cable runs to the rear and down to the power strip under the desk.
  const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(-.98,1,-1.86),new THREE.Vector3(-.94,.82,-2),new THREE.Vector3(-.9,.62,-2.02),new THREE.Vector3(-1.2,.59,-1.94)]);
  const cable=new THREE.TubeGeometry(curve,20,.006,6,false);geometries.set("cable",cable);mesh(cable,graphite,[0,0,0]);box([.3,.04,.065],[-1.25,.59,-1.94],paper);
  // Research board has a frame, cork face, four mounts, cards and physical pins.
  const board=group([.62,1.81,-2.44],"board");box([2.22,1.18,.06],[0,0,0],edge,board,.018);
  box([2.1,1.06,.018],[0,0,.04],mat("#d6c7ab"),board,.005);
  const boardTex=texture(c=>{c.fillStyle="#e6dcc8";c.fillRect(0,0,1024,512);c.fillStyle="#67796e";c.font="20px monospace";c.fillText("FIELD NOTES  /  THE WAY WE WORK",50,58);c.fillStyle="#354942";c.font="54px Georgia";c.fillText("From answers to actions.",50,137);const labels=["GENERATE","USE TOOLS","ITERATE"];const subs=["LLM","Tool Use","Agent"];for(let i=0;i<3;i++){let x=50+i*318;c.fillStyle=["#f7eed9","#dae7df","#a8c8c2"][i];c.fillRect(x,210,285,224);c.fillStyle="#43594e";c.font="19px monospace";c.fillText("0"+(i+1),x+22,251);c.font="38px Georgia";c.fillText(subs[i],x+22,321);c.font="20px sans-serif";c.fillText(labels[i],x+22,385);} });
  surface(2.05,1.02,[0,0,.051],boardTex,board);
  for(const x of [-1,1])for(const y of [-.48,.48])sphere([.014,.014,.009],[x,y,.066],metal,board);
  const boardPins:THREE.Mesh[]=[];for(let i=0;i<3;i++)boardPins.push(sphere([.023,.023,.014],[-.7+i*.66,.085,.075],terracotta,board));
  // A small wall clock, deliberately quiet; decorative, not a false live clock.
  const clock=group([2.32,2.26,-2.43]);const clockRim=cyl(.19,.19,.045,[0,0,0],wood,clock);clockRim.rotation.x=Math.PI/2;
  const clockTex=texture(c=>{c.fillStyle="#efeada";c.fillRect(0,0,512,512);c.strokeStyle="#56665a";c.lineWidth=9;c.beginPath();c.arc(256,256,235,0,7);c.stroke();for(let i=0;i<12;i++){let a=i*Math.PI/6;c.beginPath();c.moveTo(256+Math.sin(a)*197,256-Math.cos(a)*197);c.lineTo(256+Math.sin(a)*214,256-Math.cos(a)*214);c.stroke();}c.lineWidth=12;c.beginPath();c.moveTo(180,195);c.lineTo(256,256);c.lineTo(341,180);c.stroke();},512,512);
  const clockGeo=new THREE.CircleGeometry(.169,48);geometries.set("clock",clockGeo);mesh(clockGeo,new THREE.MeshBasicMaterial({map:clockTex}),[0,0,.025],clock);
  // Side bookcase: back, sides, shelves and visible supported grouped books.
  const library=group([-2.7,0,.58],"library");library.rotation.y=Math.PI/2;
  box([1.14,1.91,.065],[0,1.05,-.195],wood,library);
  for(const x of [-.55,.55])box([.065,2,.43],[x,1.03,0],wood,library);
  for(const y of [.11,.57,1.04,1.51,2.02])box([1.17,.055,.44],[0,y,0],wood,library);
  const bookColors=[blue,terracotta,olive,mat("#d5bd88"),paper];
  for(let row=0;row<4;row++){const count=row===3?5:8;for(let i=0;i<count;i++){let h=.27+(i%3)*.037,x=-.45+i*.11;box([.075,h,.24],[x,[.14,.6,1.07,1.54][row]+h/2,.035],bookColors[(i+row)%5],library,.006);box([.059,.013,.003],[x,[.14,.6,1.07,1.54][row]+h*.77,.158],paper,library,.001);}}
  for(const x of [-.45,.45])box([.07,.1,.32],[x,.04,0],edge,library);
  // Low exhibition table. Card box, stack, sliding cards and checklist all rest on it.
  const exhibit=group([1.63,0,1.02]);
  box([1.72,.075,1.05],[0,.617,0],wood,exhibit,.04);
  for(const x of [-.71,.71])for(const z of [-.37,.37]){const leg=box([.09,.56,.09],[x,.303,z],edge,exhibit);leg.rotation.z=x>0?-.055:.055;}
  box([1.44,.05,.04],[0,.22,-.34],edge,exhibit);
  box([1.46,.02,.82],[0,.666,0],mat("#e8e1cd"),exhibit,.025);
  const cards=group([1.29,.687,.78],"cards");
  box([.39,.095,.52],[0,.05,0],mat("#243d94"),cards,.018);
  box([.337,.026,.46],[0,.108,0],paper,cards,.013);
  const lid=new THREE.Group();lid.position.set(0,.12,-.26);cards.add(lid);
  box([.408,.032,.536],[0,0,.26],blue,lid,.015);
  const cardBack=labelTexture("DAY CARD","A MOMENT, JUST FOR YOU","#294ec5","#ede2be");
  surface(.365,.48,[0,.017,.26],cardBack,lid,true);
  const sliding:THREE.Group[]=[];
  const cardFront=labelTexture("A SMALL STEP","MAKE / TRY / IMPROVE","#ede4ca","#54765f");
  for(let i=0;i<3;i++){const g=new THREE.Group();g.position.set(0,.14+i*.006,0);cards.add(g);box([.27,.005,.39],[0,0,0],paper,g,.012);surface(.255,.375,[0,.003,0],cardBack,g,true);const face=surface(.255,.375,[0,-.003,0],cardFront,g);face.rotation.x=Math.PI/2;sliding.push(g);}
  const checklist=group([2.12,.694,1.12],"checklist");checklist.rotation.y=-.1;
  box([.36,.018,.46],[0,0,0],edge,checklist,.013);box([.323,.003,.405],[0,.012,.007],paper,checklist,.004);
  surface(.309,.39,[0,.014,.007],labelTexture("REVIEW","PURPOSE / QUALITY / TRUST","#f2eedf","#435e54"),checklist,true);
  box([.115,.015,.036],[0,.024,-.21],metal,checklist,.007);
  const checks:THREE.Mesh[]=[];for(let i=0;i<3;i++)checks.push(box([.027,.004,.027],[-.115,.02,.015+i*.065],blue,checklist,.004));
  // Framed print and a modest plant make the room feel inhabited, not a showroom.
  const art=group([-1.4,2.1,-2.445]);box([.69,.77,.037],[0,0,0],wood,art,.014);
  surface(.61,.69,[0,0,.02],texture(c=>{c.fillStyle="#ede5d5";c.fillRect(0,0,1024,512);c.fillStyle="#bc7755";c.beginPath();c.arc(490,210,135,0,7);c.fill();c.fillStyle="#6c8872";c.fillRect(225,300,580,65);c.fillStyle="#eee6d6";c.font="24px monospace";c.fillText("SMALL STEPS, EVERY DAY.",305,343);}),art);
  function plant(p:number[],scale:number){const g=group(p);g.scale.setScalar(scale);cyl(.2,.14,.32,[0,.16,0],terracotta,g);cyl(.175,.175,.018,[0,.32,0],mat("#534d3c"),g);for(let i=0;i<7;i++){let a=i*2.4;let x=Math.cos(a)*.24,z=Math.sin(a)*.24,y=.65+(i%3)*.17;rod([0,.31,0],[x,y,z],.012,olive,g);const leaf=sphere([.115,.26,.028],[x,y,z],olive,g);leaf.rotation.set(.5, a, -.45);}}
  plant([2.51,.026,-1.96],1.1);plant([-2.48,.026,1.93],.8);
  // Architectural joinery, storage and a sculptural reading lamp.
  box([6.08,.045,.19],[0,2.85,-2.53],mat("#233f34"),root,.012);
  box([.19,.045,5.08],[-3.045,2.85,0],wood,root,.012);
  for(let i=0;i<7;i++)box([.19,.065,1.44],[-2.89,2.3-i*.067,-1.15],mat("#e1d4b7"),root,.008);
  const storage=group([.8,0,-2.15]);
  box([1.96,.54,.44],[0,.39,0],wood,storage,.025);
  box([2.02,.05,.47],[0,.68,0],wood,storage,.025);
  for(const x of [-.82,.82])for(const z of [-.12,.12])cyl(.028,.035,.14,[x,.085,z],graphite,storage);
  for(let i=0;i<26;i++)box([.037,.44,.012],[-.92+i*.073,.39,.228],edge,storage,.006);
  for(const x of [-.48,.48])sphere([.019,.019,.016],[x,.48,.248],metal,storage);
  for(let i=0;i<3;i++)box([.34,.035,.24],[-.59+i*.015,.724+i*.037,.0],[paper,blue,terracotta][i],storage,.006);
  const vase=cyl(.07,.11,.21,[.52,.81,0],mat("#d7bd8c"),storage);cyl(.066,.066,.006,[.52,.918,0],mat("#73654a"),storage);
  rod([.52,.92,0],[.48,1.17,0],.006,olive,storage);sphere([.08,.12,.018],[.48,1.12,0],olive,storage).rotation.z=.5;
  // Slender floor lamp, held by a weighted disc and a curved steel neck.
  const floorLamp=group([2.5,0,-.78]);
  cyl(.18,.2,.045,[0,.05,0],graphite,floorLamp);
  rod([0,.08,0],[0,1.64,0],.013,metal,floorLamp);
  const lampCurve=new THREE.CatmullRomCurve3([new THREE.Vector3(0,1.61,0),new THREE.Vector3(-.02,1.78,0),new THREE.Vector3(-.2,1.84,0),new THREE.Vector3(-.34,1.77,0)]);
  const lampTube=new THREE.TubeGeometry(lampCurve,24,.013,8,false);geometries.set("floorLamp",lampTube);mesh(lampTube,metal,[0,0,0],floorLamp);
  cyl(.085,.19,.19,[-.34,1.685,0],paper,floorLamp);cyl(.17,.17,.008,[-.34,1.59,0],mat("#f3d099"),floorLamp);
  // A large graphic print establishes the studio's own visual identity.
  surface(.60,.68,[-1.4,2.1,-2.418],texture(c=>{c.fillStyle="#e8dfc6";c.fillRect(0,0,1024,512);c.fillStyle="#2d4cb6";c.font="bold 126px Arial";c.fillText("MAKE.",65,160);c.fillText("PLAY.",65,302);c.fillStyle="#b65a36";c.fillText("REPEAT.",65,444);}),root);
  // Subtle foundation shadow anchors the complete diorama to the page.
  const foundationTex=texture(c=>{const grad=c.createRadialGradient(256,256,30,256,256,255);grad.addColorStop(0,"rgba(44,52,35,.32)");grad.addColorStop(.55,"rgba(44,52,35,.16)");grad.addColorStop(1,"rgba(44,52,35,0)");c.fillStyle=grad;c.fillRect(0,0,512,512);},512,512);
  const foundationGeo=new THREE.PlaneGeometry(10,8.7);geometries.set("foundationShadow",foundationGeo);const foundation=mesh(foundationGeo,new THREE.MeshBasicMaterial({map:foundationTex,transparent:true,depthWrite:false}),[.25,-.221,.18]);foundation.rotation.x=-Math.PI/2;foundation.castShadow=false;
  // Soft contact pools augment the directional shadows without full-screen effects.
  const shadowTex=texture(c=>{const g=c.createRadialGradient(256,256,0,256,256,250);g.addColorStop(0,"rgba(52,44,33,.20)");g.addColorStop(1,"rgba(52,44,33,0)");c.fillStyle=g;c.fillRect(0,0,512,512);},512,512);
  for(const [x,z,w,h] of [[-1.35,-1.65,2,1.3],[-1.32,-.6,.8,.8],[1.63,1.02,2.3,1.6],[-2.7,.58,.8,1.8],[2.51,-1.96,.85,.85]]){const geo=new THREE.PlaneGeometry(w,h);geometries.set(`shadow${x}`,geo);const m=mesh(geo,new THREE.MeshBasicMaterial({map:shadowTex,transparent:true,depthWrite:false}),[x,.032,z]);m.rotation.x=-Math.PI/2;m.castShadow=false;}
  const hemi=new THREE.HemisphereLight("#f4f1e4","#777e6a",1.65);root.add(hemi);
  const sun=new THREE.DirectionalLight("#fff0d3",3.7);sun.position.set(-3.7,6.5,4.8);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-5;sun.shadow.camera.right=5;sun.shadow.camera.top=5;sun.shadow.camera.bottom=-5;sun.shadow.normalBias=.025;sun.shadow.bias=-.00015;sun.shadow.radius=4;root.add(sun);
  const fill=new THREE.DirectionalLight("#d7e2ed",.8);fill.position.set(5,4,2);root.add(fill);
  // Batch static meshes by material and interaction owner. Animated joints stay separate.
  const dynamic=new Set<THREE.Object3D>([cover,lid,name,...sliding,...boardPins,...checks]);
  const batches=new Map<string,{material:THREE.Material;id?:string;shadow:boolean;meshes:THREE.Mesh[]}>();
  root.updateMatrixWorld(true);
  root.traverse(o=>{if(!(o instanceof THREE.Mesh)||Array.isArray(o.material))return;let parent:THREE.Object3D|null=o,id:string|undefined;while(parent){if(dynamic.has(parent))return;if(parent.userData.objectId)id=parent.userData.objectId;parent=parent.parent;}const key=o.material.uuid+id+o.castShadow;let b=batches.get(key);if(!b){b={material:o.material,id,shadow:o.castShadow,meshes:[]};batches.set(key,b);}b.meshes.push(o);});
  for(const b of batches.values()){if(b.meshes.length<2)continue;const pieces=b.meshes.map(m=>{const g=m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone();return g.applyMatrix4(m.matrixWorld);});const combined=mergeGeometries(pieces);pieces.forEach(g=>g.dispose());if(!combined)continue;const m=mesh(combined,b.material,[0,0,0]);m.castShadow=b.shadow;if(b.id)m.userData.objectId=b.id;b.meshes.forEach(o=>o.removeFromParent());geometries.set(`batch${geometries.size}`,combined);}
  let screenStep=-2,frontTheme=-1;
  return { root, sun, animate(open:number,cardOpen:number,selected:number,review:number,hover:ObjectId|null,agentStep:number,cardFlip:number,cardTheme:number) {
    if(frontTheme!==cardTheme){frontTheme=cardTheme;const c=(cardFront.image as HTMLCanvasElement).getContext("2d")!;c.fillStyle="#f3e8c8";c.fillRect(0,0,1024,512);c.strokeStyle="#284ed8";c.lineWidth=3;c.strokeRect(25,25,974,462);c.fillStyle="#284ed8";c.font="58px Georgia";c.fillText(["A LITTLE PAUSE","A SMALL STEP","ANOTHER ANGLE"][cardTheme],60,215);c.font="36px sans-serif";c.fillText(["余白を、一つ。","小さな一歩。","違う角度から。"][cardTheme],60,310);cardFront.needsUpdate=true;}
    cover.rotation.z=open*2.5;
    lid.rotation.x=-cardOpen*1.85;
    const spread=Math.max(0,(cardOpen-.25)/.75),lower=Math.max(0,(spread-.9)/.1);
    sliding.forEach((g,i)=>{g.position.set(spread*((i-1)*.22),.14+i*.006-lower*.13+(i===1?.16*Math.sin(cardFlip*Math.PI):0),spread*(.52+(i-1)*.02));g.rotation.y=spread*(i-1)*.15;g.rotation.z=i===1?cardFlip*Math.PI:0;});
    boardPins.forEach((p,i)=>p.scale.set(.023,.023,.014).multiplyScalar(i===selected?1.6:1));
    checks.forEach((p,i)=>{p.material=review&(1<<i)?olive:blue;});
    name.rotation.y=hover==="name"?.14:0;
    if(agentStep>=0&&agentStep!==screenStep){screenStep=agentStep;const c=(screenTex.image as HTMLCanvasElement).getContext("2d")!;c.fillStyle="#243a38";c.fillRect(0,0,1024,512);c.fillStyle="#93bbaa";c.font="23px monospace";c.fillText("MECHANISM DEMO / NO LIVE AI",45,58);c.fillStyle="#f2edda";c.font="62px Georgia";c.fillText(["Goal","Plan","Act","Observe","Act / Repair","Verify","Deliver"][agentStep],45,152);c.fillStyle="#8daf9e";c.font="25px monospace";c.fillText("Build a small card page.",45,207);const fail=agentStep===2||agentStep===3;c.strokeStyle=fail?"#dba97e":"#8db6a0";c.lineWidth=3;c.strokeRect(50,245,440,202);c.fillStyle=fail?"#c88e6c":"#7ba78f";c.fillRect(75,349,fail?510:389,57);c.fillStyle="#f7f1d9";c.font="27px monospace";c.fillText(fail?"380px > 320px":"fits inside 320px",620,304);c.font="34px Georgia";c.fillText(fail?"Check, then repair.":agentStep>=5?"Ready for review.":"Make. Try. Improve.",595,391);screenTex.needsUpdate=true;}
  }, dispose(){
    const allMats=new Set<THREE.Material>();root.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>allMats.add(m));}});geometries.forEach(g=>g.dispose());allMats.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());
  } };
}
