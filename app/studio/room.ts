import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import type { ObjectId } from "./content";
import { createSurfaceMaterials, metricUV } from "../surfaceMaterials";

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
  const cream = finishes.material("plaster", "#f0ece1"), wood = finishes.material("wood", "#f5e7d5"), edge = finishes.material("wood", "#d9c9b3"), graphite = finishes.material("rubber", "#202c2b"), metal = finishes.material("metal", "#a3adaa"), paper = finishes.material("paper", "#faf5e8"), blue = finishes.material("fabric", "#2c49a5"), terracotta = finishes.material("leather", "#ae5539"), olive = mat("#486140");
  const brass = finishes.material("metal", "#ad8850"), ceramic = finishes.material("ceramic", "#e4ddcc"), upholstery = finishes.material("leather", "#a85435");
  function mesh(geometry: THREE.BufferGeometry, material: THREE.Material, p: number[], parent: THREE.Object3D = root) {
    const m = new THREE.Mesh(geometry, material); m.position.set(p[0], p[1], p[2]); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
  }
  function box(size: number[], p: number[], material: THREE.Material, parent: THREE.Object3D = root, radius = .025) {
    const r = Math.min(radius, Math.min(...size) / 3);
    const surfaceScale = ["fabric", "leather"].includes(material.userData.surface) ? .35 : 1;
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
  function labelTexture(title: string, sub: string, bg = "#e9e2d4", fg = "#374744") {
    return texture(c => {
      c.fillStyle=bg;c.fillRect(0,0,512,512);c.strokeStyle=fg;c.lineWidth=1;c.strokeRect(20,20,472,472);
      c.fillStyle=fg;c.font="20px monospace";c.fillText(sub.split(" / ")[0],45,95);c.fillRect(45,128,40,3);
      c.font="62px Georgia";c.fillText(title,45,270);c.font="18px sans-serif";c.fillText(sub.split(" / ")[1],45,332);
      c.globalAlpha=.35;c.fillRect(45,390,280,2);c.fillRect(45,412,210,2);
    },512,512);
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
  const floorColors = ["#eee9df", "#e9dfcb", "#f4e9d7", "#e0d4bf", "#f1e6d1"];
  for (let i = 0; i < 15; i++) {
    const cuts = [-2.5, -2.5 + .55 + (i % 3) * .43, -.1 + (i % 3) * .43, 1.4 + (i % 2) * .3, 2.5];
    for (let j = 0; j < cuts.length - 1; j++) {
      const length = cuts[j+1] - cuts[j] - .008;
      const plank = box([.394,.04,length], [-2.79 + i * .4,.005,(cuts[j+1]+cuts[j])/2], finishes.material("floor", floorColors[(i+j)%5]), root, .004);
      plank.geometry = metricUV(plank.geometry.clone(), 3.2, "uv", (i * .127 + j * .23) % 1);
      geometries.set(`plank-${i}-${j}`, plank.geometry);
    }
  }
  box([6.08,2.85,.13],[0,1.43,-2.55],finishes.material("plaster", "#385d50"),root,.025);
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
  const glassGeometry=new THREE.PlaneGeometry(1.29,1.23);geometries.set("window-glass",glassGeometry);
  const glass=mesh(glassGeometry,new THREE.MeshPhysicalMaterial({color:"#d4e8e7",roughness:.12,metalness:.08,transparent:true,opacity:.17,clearcoat:1,clearcoatRoughness:.08,side:THREE.DoubleSide}),[.085,0,0],window);glass.rotation.y=Math.PI/2;glass.castShadow=false;
  box([.018,.11,.016],[.16,-.03,.045],brass,window,.005);
  const rug = box([2.7,.024,2.25],[.05,.042,.65],finishes.material("fabric", "#a9a58b"),root,.14);
  rug.rotation.y = -.045;
  for(let i=0;i<17;i++) box([.025,.002,2.05],[-1.1+i*.14,.056,.65],finishes.material("fabric", "#bbb69d"),root,.001);
  for(const z of [-.40,1.70]) box([2.48,.004,.028],[.05,.057,z],finishes.material("fabric", "#716f58"),root,.002);
  for(let i=0;i<46;i++) for(const z of [-.50,1.80]) rod([-1.18+i*.054,.052,z],[-1.175+i*.054,.047,z+(z<0?-.055:.055)],.0035,paper);
  // Desk, exactly 1.4 × .70 × .74, rear left. Wall clearance for monitor leads.
  const desk = group([-1.35,0,-1.65]);
  box([1.46,.065,.76],[0,.727,0],wood,desk,.034);
  for(const x of [-.63,.63]) for(const z of [-.27,.27]) box([.065,.685,.065],[x,.365,z],edge,desk,.014);
  box([1.3,.09,.035],[0,.635,-.29],edge,desk);
  box([.41,.17,.5],[.46,.603,.015],wood,desk);
  box([.12,.018,.026],[.46,.615,.278],metal,desk,.008);
  box([.89,.012,.34],[-.15,.768,.1],finishes.material("leather", "#34483e"),desk,.025);
  for(const x of [-.63,.63]) box([.046,.075,.69],[x,.64,0],edge,desk,.009);
  for(const x of [-.55,.55]) { const screw = cyl(.009,.009,.003,[x,.763,-.29],brass,desk); screw.name="desk-joinery"; }
  // Monitor: back shell, bezel, screen, tilt joint, upright and base.
  const monitor = group([-.98,.76,-1.82],"monitor");
  box([.34,.024,.22],[0,.013,.035],graphite,monitor);
  cyl(.037,.045,.23,[0,.135,-.01],metal,monitor);
  box([.665,.4,.047],[0,.452,0],graphite,monitor,.022);
  box([.42,.2,.028],[0,.445,-.035],graphite,monitor);
  const screenTex = texture(c => { c.fillStyle="#243a38";c.fillRect(0,0,1024,512);c.fillStyle="#95c8be";c.font="24px monospace";c.fillText("WORKSPACE / 01",50,63);c.fillStyle="#edf0df";c.font="54px Georgia";c.fillText("Make something",50,154);c.fillText("worth trying.",50,218);const colors=["#82b3a6","#b7cfbb","#dab28b"];for(let i=0;i<5;i++){c.fillStyle=colors[i%3];c.fillRect(53,290+i*28,360+(i%3)*115,8);} c.strokeStyle="#93b7a6";c.lineWidth=3;c.strokeRect(731,259,173,195);c.font="65px Georgia";c.fillText("✦",787,377); });
  surface(.616,.347,[0,.453,.025],screenTex,monitor,false,true);
  for(let i=0;i<15;i++) box([.019,.002,.009],[-.21+i*.03,.59,-.052],metal,monitor,.001);
  sphere([.006,.006,.003],[0,.641,.026],graphite,monitor);
  box([.065,.004,.002],[0,.269,.026],metal,monitor,.001);
  sphere([.005,.005,.005],[.276,.277,.026],mat("#9fd9b7"),monitor);
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
  const notebook=group([-1.79,.776,-1.58],"notebook");notebook.rotation.y=-.15;
  box([.25,.013,.32],[0,0,0],terracotta,notebook,.006);
  box([.235,.024,.3],[.003,.017,0],paper,notebook,.005);
  for(let i=0;i<6;i++) box([.233,.0007,.298],[.003,.006+i*.004,0],mat("#c8bc9f"),notebook,.0001);
  box([.018,.002,.35],[.072,.03,.028],finishes.material("fabric", "#334f46"),notebook,.001);
  const noteTex=texture(c=>{c.fillStyle="#f5edda";c.fillRect(0,0,1024,512);c.fillStyle="#496d6b";c.font="58px Georgia";c.fillText("Small ideas",75,110);for(let i=0;i<4;i++){c.fillStyle="#bbb8a6";c.fillRect(75,180+i*65,750-i%2*130,3);}c.fillStyle="#cc916a";c.beginPath();c.arc(818,120,44,0,Math.PI*2);c.fill();});
  surface(.225,.285,[.005,.032,0],noteTex,notebook,true);
  const cover=new THREE.Group();cover.position.set(-.125,.033,0);notebook.add(cover);box([.25,.01,.32],[.125,0,0],terracotta,cover,.005);
  surface(.22,.285,[.125,.006,0],folioTexture("FIELD NOTES","IDEAS, IN PROGRESS","#a65336","#ead5ae"),cover,true);
  rod([-.12,.035,-.14],[-.12,.035,.14],.008,edge,notebook);
  // Nameplate at the desk front, backed and supported by a wooden wedge.
  const name=group([-1.63,.786,-1.31],"name");
  const plate=box([.28,.08,.037],[0,.026,0],wood,name,.007);plate.rotation.x=-.22;
  const nameFace=surface(.26,.066,[0,.027,.021],texture(c=>{c.fillStyle="#d1ba87";c.fillRect(0,0,1024,256);c.fillStyle="#283e33";c.textAlign="center";c.font="90px Georgia";c.fillText("WANG BO",512,129);c.font="23px sans-serif";c.fillText("MAKE / TRY / IMPROVE",512,198);},1024,256),name);nameFace.rotation.x=-.22;
  for(const x of [-.12,.12])sphere([.003,.003,.002],[x,.027,.023],brass,name);
  // Jointed task lamp with actual shade, internal bulb, and warm pool.
  const lamp=group([-1.93,.765,-1.91]);cyl(.10,.105,.025,[0,.014,0],graphite,lamp);
  rod([0,.02,0],[.035,.31,-.035],.014,metal,lamp);rod([.035,.31,-.035],[.16,.42,.04],.012,metal,lamp);
  sphere([.025,.025,.025],[.035,.31,-.035],graphite,lamp);
  const shade=cyl(.052,.095,.11,[.17,.378,.057],graphite,lamp);shade.rotation.z=.2;
  cyl(.076,.076,.008,[.179,.324,.057],mat("#ffe5a9"),lamp);
  const bulb=new THREE.PointLight("#ffdba2",.45,1.6,2);bulb.position.set(.18,.31,.06);lamp.add(bulb);
  // Mug: hollow rim, dark tea and handle.
  const mug=group([-.78,.769,-1.87]);turned([[0,.004],[.033,.004],[.039,.012],[.043,.087],[.044,.095],[.040,.099],[.037,.094],[.035,.018],[0,.018]],[0,0,0],ceramic,mug);
  cyl(.036,.036,.002,[0,.081,0],finishes.material("ceramic", "#36251b"),mug);
  const torus=new THREE.TorusGeometry(.027,.007,12,32);geometries.set("mugHandle",torus);mesh(torus,ceramic,[.047,.052,0],mug);
  cyl(.065,.065,.006,[0,.001,0],finishes.material("cork", "#967c54"),mug);
  // Monitor cable runs to the rear and down to the power strip under the desk.
  const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(-.98,1,-1.86),new THREE.Vector3(-.94,.82,-2),new THREE.Vector3(-.9,.62,-2.02),new THREE.Vector3(-1.2,.59,-1.94)]);
  const cable=new THREE.TubeGeometry(curve,20,.006,6,false);geometries.set("cable",cable);mesh(cable,graphite,[0,0,0]);box([.3,.04,.065],[-1.25,.59,-1.94],paper);
  // Research board has a frame, cork face, four mounts, cards and physical pins.
  const board=group([.62,1.81,-2.44],"board");box([2.22,1.18,.06],[0,0,0],edge,board,.018);
  box([2.1,1.06,.018],[0,0,.04],finishes.material("cork", "#a78c63"),board,.005);
  const boardTex=texture(c=>{c.fillStyle="#ede6d6";c.fillRect(0,0,1536,200);c.fillStyle="#67796e";c.font="23px monospace";c.fillText("FIELD NOTES  /  THE WAY WE WORK",65,47);c.fillStyle="#354942";c.font="72px Georgia";c.fillText("From answers to actions.",65,143);},1536,200);
  box([1.95,.27,.004],[0,.32,.054],paper,board,.001);
  surface(1.92,.25,[0,.32,.057],boardTex,board);
  for(let i=0;i<3;i++) {
    const card = new THREE.Group(); card.position.set(-.66+i*.66,-.17,.063); card.rotation.z=[-.025,.015,-.018][i]; board.add(card);
    box([.59,.59,.006],[0,0,0],paper,card,.003);
    surface(.57,.57,[0,0,.004],labelTexture(["LLM","Tool Use","Agent"][i],["01 / GENERATE","02 / USE TOOLS","03 / ITERATE"][i],["#f7eed9","#dae7df","#a8c8c2"][i]),card);
  }
  for(const x of [-1,1])for(const y of [-.48,.48])sphere([.014,.014,.009],[x,y,.066],metal,board);
  const boardPins:THREE.Mesh[]=[];for(let i=0;i<3;i++)boardPins.push(sphere([.023,.023,.014],[-.66+i*.66,.085,.088],brass,board));
  // A small wall clock, deliberately quiet; decorative, not a false live clock.
  const clock=group([2.32,2.26,-2.43]);const clockRim=cyl(.19,.19,.045,[0,0,0],wood,clock);clockRim.rotation.x=Math.PI/2;
  const clockTex=texture(c=>{c.fillStyle="#efeada";c.fillRect(0,0,512,512);c.strokeStyle="#56665a";c.lineWidth=9;c.beginPath();c.arc(256,256,235,0,7);c.stroke();for(let i=0;i<12;i++){const a=i*Math.PI/6;c.beginPath();c.moveTo(256+Math.sin(a)*197,256-Math.cos(a)*197);c.lineTo(256+Math.sin(a)*214,256-Math.cos(a)*214);c.stroke();}c.lineWidth=12;c.beginPath();c.moveTo(180,195);c.lineTo(256,256);c.lineTo(341,180);c.stroke();},512,512);
  const clockGeo=new THREE.CircleGeometry(.169,48);geometries.set("clock",clockGeo);mesh(clockGeo,new THREE.MeshStandardMaterial({map:clockTex,roughness:.55}),[0,0,.025],clock);
  sphere([.011,.011,.007],[0,0,.033],brass,clock);
  // Side bookcase: back, sides, shelves and visible supported grouped books.
  const library=group([-2.7,0,.58],"library");library.rotation.y=Math.PI/2;
  box([1.14,1.91,.065],[0,1.05,-.195],wood,library);
  for(const x of [-.55,.55])box([.065,2,.43],[x,1.03,0],wood,library);
  for(const y of [.11,.57,1.04,1.51,2.02])box([1.17,.055,.44],[0,y,0],wood,library);
  const bookColors=[blue,terracotta,olive,mat("#d5bd88"),paper];
  for(let row=0;row<4;row++){const count=row===3?5:8;for(let i=0;i<count;i++){
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
  // Low exhibition table. Card box, stack, sliding cards and checklist all rest on it.
  const exhibit=group([1.63,0,1.02]);
  box([1.72,.075,1.05],[0,.617,0],wood,exhibit,.04);
  for(const x of [-.71,.71])for(const z of [-.37,.37]){const leg=box([.09,.56,.09],[x,.303,z],edge,exhibit);leg.rotation.z=x>0?-.055:.055;}
  box([1.44,.05,.04],[0,.22,-.34],edge,exhibit);
  box([1.46,.008,.82],[0,.66,0],finishes.material("fabric", "#d4cbb8"),exhibit,.018);
  for(const z of [-.385,.385])box([1.38,.002,.008],[0,.665,z],finishes.material("fabric", "#8e9078"),exhibit,.002);
  const cards=group([1.29,.687,.78],"cards");
  box([.39,.095,.52],[0,.05,0],finishes.material("fabric", "#243d94"),cards,.018);
  box([.37,.003,.50],[0,.094,0],brass,cards,.006);
  box([.337,.026,.46],[0,.108,0],paper,cards,.013);
  const lid=new THREE.Group();lid.position.set(0,.12,-.26);cards.add(lid);
  box([.408,.032,.536],[0,0,.26],blue,lid,.015);
  const cardBack=folioTexture("DAY CARD","A MOMENT, JUST FOR YOU","#294bb1","#e4ce93");
  surface(.365,.48,[0,.017,.26],cardBack,lid,true);
  const lining=surface(.355,.47,[0,-.017,.26],folioTexture("ONE SMALL MOMENT","MAKE ROOM FOR POSSIBILITY","#e9dfc6","#5a7359"),lid);lining.rotation.x=Math.PI/2;
  const sliding:THREE.Group[]=[];
  const cardFront=folioTexture("A SMALL STEP","MAKE / TRY / IMPROVE","#ede4ca","#54765f");
  for(let i=0;i<3;i++){const g=new THREE.Group();g.position.set(0,.14+i*.006,0);cards.add(g);box([.27,.005,.39],[0,0,0],paper,g,.012);surface(.255,.375,[0,.003,0],cardBack,g,true);const face=surface(.255,.375,[0,-.003,0],cardFront,g);face.rotation.x=Math.PI/2;sliding.push(g);}
  const checklist=group([2.12,.694,1.12],"checklist");checklist.rotation.y=-.1;
  box([.36,.018,.46],[0,0,0],edge,checklist,.013);box([.323,.003,.405],[0,.012,.007],paper,checklist,.004);
  surface(.309,.39,[0,.014,.007],texture(c=>{
    c.fillStyle="#f2eedf";c.fillRect(0,0,768,1024);c.fillStyle="#435e54";c.font="24px monospace";c.fillText("STUDIO / QUALITY CONTROL",65,110);c.font="77px Georgia";c.fillText("Review",65,228);
    ["Purpose","Quality","Trust"].forEach((title,i)=>{const y=425+i*173;c.strokeStyle="#7b8872";c.lineWidth=2;c.strokeRect(70,y-33,32,32);c.font="43px Georgia";c.fillStyle="#435e54";c.fillText(title,144,y);c.fillStyle="#bbbca9";c.fillRect(144,y+36,440,2);c.fillRect(144,y+59,320,2);});
    c.font="20px monospace";c.fillStyle="#435e54";c.fillText("CHECKED BY A HUMAN.",65,954);
  },768,1024),checklist,true);
  box([.115,.015,.036],[0,.024,-.21],metal,checklist,.007);
  for(const x of [-.043,.043])cyl(.006,.006,.004,[x,.034,-.21],brass,checklist);
  rod([.22,.02,-.17],[.22,.02,.18],.006,wood,checklist);
  rod([.22,.02,.18],[.22,.02,.207],.004,graphite,checklist);
  const checks:THREE.Mesh[]=[];for(let i=0;i<3;i++)checks.push(box([.013,.003,.013],[-.120,.017,-.032+i*.066],blue,checklist,.004));
  // Framed print and a modest plant make the room feel inhabited, not a showroom.
  const art=group([-1.4,2.1,-2.445]);box([.69,.77,.037],[0,0,0],wood,art,.014);
  surface(.61,.69,[0,0,.02],texture(c=>{c.fillStyle="#ede5d5";c.fillRect(0,0,1024,512);c.fillStyle="#bc7755";c.beginPath();c.arc(490,210,135,0,7);c.fill();c.fillStyle="#6c8872";c.fillRect(225,300,580,65);c.fillStyle="#eee6d6";c.font="24px monospace";c.fillText("SMALL STEPS, EVERY DAY.",305,343);}),art);
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
  }
  plant([2.51,.026,-1.96],1.1);plant([-2.48,.026,1.93],.8);
  // Architectural joinery, storage and a sculptural reading lamp.
  box([6.08,.045,.19],[0,2.85,-2.53],mat("#233f34"),root,.012);
  box([.19,.045,5.08],[-3.045,2.85,0],wood,root,.012);
  for(let i=0;i<7;i++)box([.19,.065,1.44],[-2.89,2.3-i*.067,-1.15],finishes.material("fabric", "#ded3b9"),root,.008);
  for(const z of [-1.68,-.62])rod([-2.78,1.85,z],[-2.78,2.33,z],.003,paper);
  const storage=group([.8,0,-2.15]);
  box([1.96,.54,.44],[0,.39,0],wood,storage,.025);
  box([2.02,.05,.47],[0,.68,0],wood,storage,.025);
  for(const x of [-.82,.82])for(const z of [-.12,.12])cyl(.028,.035,.14,[x,.085,z],graphite,storage);
  for(let i=0;i<26;i++)box([.037,.44,.012],[-.92+i*.073,.39,.228],edge,storage,.006);
  box([.009,.44,.012],[0,.39,.236],graphite,storage,.001);
  for(const x of [-.48,.48])sphere([.019,.019,.016],[x,.48,.248],brass,storage);
  for(let i=0;i<3;i++)box([.34,.035,.24],[-.59+i*.015,.724+i*.037,.0],[paper,blue,terracotta][i],storage,.006);
  turned([[.055,0],[.09,.012],[.11,.085],[.08,.155],[.047,.205],[.047,.23],[.036,.23],[.035,.204],[.065,.15],[.08,.08],[.055,.015]],[.52,.705,0],ceramic,storage);
  rod([.52,.92,0],[.48,1.17,0],.004,olive,storage);
  const sprig=mesh(leafGeometry,leafMaterials[1],[.48,1.06,0],storage);sprig.rotation.z=.6;sprig.scale.setScalar(.5);
  // Slender floor lamp, held by a weighted disc and a curved steel neck.
  const floorLamp=group([2.5,0,-.78]);
  cyl(.18,.2,.045,[0,.05,0],graphite,floorLamp);
  rod([0,.08,0],[0,1.64,0],.013,metal,floorLamp);
  const lampCurve=new THREE.CatmullRomCurve3([new THREE.Vector3(0,1.61,0),new THREE.Vector3(-.02,1.78,0),new THREE.Vector3(-.2,1.84,0),new THREE.Vector3(-.34,1.77,0)]);
  const lampTube=new THREE.TubeGeometry(lampCurve,24,.013,8,false);geometries.set("floorLamp",lampTube);mesh(lampTube,metal,[0,0,0],floorLamp);
  turned([[.19,0],[.085,.19],[.08,.19],[.184,0]],[-.34,1.59,0],finishes.material("fabric", "#ede4cf"),floorLamp);
  for(const y of [1.59,1.78]){const rim=new THREE.TorusGeometry(y===1.59?.188:.082,.003,6,40);geometries.set(`lamp-rim-${y}`,rim);mesh(rim,brass,[-.34,y,0],floorLamp).rotation.x=Math.PI/2;}
  const warm= new THREE.MeshStandardMaterial({color:"#ffdfae",emissive:"#ffc67d",emissiveIntensity:.6});
  sphere([.036,.045,.036],[-.34,1.65,0],warm,floorLamp);
  const readingLight=new THREE.PointLight("#ffdab0",.32,2.4,2);readingLight.position.set(-.34,1.59,0);floorLamp.add(readingLight);
  // A large graphic print establishes the studio's own visual identity.
  surface(.60,.68,[-1.4,2.1,-2.418],texture(c=>{c.fillStyle="#e8dfc6";c.fillRect(0,0,1024,512);c.fillStyle="#2d4cb6";c.font="bold 126px Arial";c.fillText("MAKE.",65,160);c.fillText("PLAY.",65,302);c.fillStyle="#b65a36";c.fillText("REPEAT.",65,444);}),root);
  // Subtle foundation shadow anchors the complete diorama to the page.
  const foundationTex=texture(c=>{const grad=c.createRadialGradient(256,256,30,256,256,255);grad.addColorStop(0,"rgba(44,52,35,.32)");grad.addColorStop(.55,"rgba(44,52,35,.16)");grad.addColorStop(1,"rgba(44,52,35,0)");c.fillStyle=grad;c.fillRect(0,0,512,512);},512,512);
  const foundationGeo=new THREE.PlaneGeometry(10,8.7);geometries.set("foundationShadow",foundationGeo);const foundation=mesh(foundationGeo,new THREE.MeshBasicMaterial({map:foundationTex,transparent:true,depthWrite:false}),[.25,-.221,.18]);foundation.rotation.x=-Math.PI/2;foundation.castShadow=false;
  // Soft contact pools augment the directional shadows without full-screen effects.
  const shadowTex=texture(c=>{const g=c.createRadialGradient(256,256,0,256,256,250);g.addColorStop(0,"rgba(52,44,33,.20)");g.addColorStop(1,"rgba(52,44,33,0)");c.fillStyle=g;c.fillRect(0,0,512,512);},512,512);
  for(const [x,z,w,h] of [[-1.35,-1.65,2,1.3],[-1.32,-.6,.8,.8],[1.63,1.02,2.3,1.6],[-2.7,.58,.8,1.8],[2.51,-1.96,.85,.85]]){const geo=new THREE.PlaneGeometry(w,h);geometries.set(`shadow${x}`,geo);const m=mesh(geo,new THREE.MeshBasicMaterial({map:shadowTex,transparent:true,depthWrite:false}),[x,.032,z]);m.rotation.x=-Math.PI/2;m.castShadow=false;}
  const hemi=new THREE.HemisphereLight("#f6f0e5","#7a8070",1.25);root.add(hemi);
  const sun=new THREE.DirectionalLight("#fff0d8",3.1);sun.position.set(-3.7,6.5,4.8);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-4.8;sun.shadow.camera.right=4.8;sun.shadow.camera.top=4.8;sun.shadow.camera.bottom=-4.8;sun.shadow.normalBias=.012;sun.shadow.bias=-.00015;sun.shadow.radius=4;root.add(sun);
  const fill=new THREE.DirectionalLight("#d7e2ed",1.1);fill.position.set(5,4,2);root.add(fill);
  // Batch static meshes by material and interaction owner. Animated joints stay separate.
  const dynamic=new Set<THREE.Object3D>([cover,lid,name,...sliding,...boardPins,...checks]);
  const batches=new Map<string,{material:THREE.Material;id?:string;shadow:boolean;meshes:THREE.Mesh[]}>();
  root.updateMatrixWorld(true);
  root.traverse(o=>{if(!(o instanceof THREE.Mesh)||Array.isArray(o.material))return;let parent:THREE.Object3D|null=o,id:string|undefined;while(parent){if(dynamic.has(parent))return;if(parent.userData.objectId)id=parent.userData.objectId;parent=parent.parent;}const key=o.material.uuid+id+o.castShadow;let b=batches.get(key);if(!b){b={material:o.material,id,shadow:o.castShadow,meshes:[]};batches.set(key,b);}b.meshes.push(o);});
  for(const b of batches.values()){if(b.meshes.length<2)continue;const pieces=b.meshes.map(m=>{const g=m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone();return g.applyMatrix4(m.matrixWorld);});const combined=mergeGeometries(pieces);pieces.forEach(g=>g.dispose());if(!combined)continue;const m=mesh(combined,b.material,[0,0,0]);m.castShadow=b.shadow;if(b.id)m.userData.objectId=b.id;b.meshes.forEach(o=>o.removeFromParent());geometries.set(`batch${geometries.size}`,combined);}
  let screenStep=-2,frontTheme=-1;
  return { root, sun, animate(open:number,cardOpen:number,selected:number,review:number,hover:ObjectId|null,agentStep:number,cardFlip:number,cardTheme:number) {
    if(frontTheme!==cardTheme){frontTheme=cardTheme;const c=(cardFront.image as HTMLCanvasElement).getContext("2d")!;c.fillStyle="#f3e8c8";c.fillRect(0,0,768,1024);c.strokeStyle="#657d61";c.lineWidth=2;c.strokeRect(35,35,698,954);c.textAlign="center";c.fillStyle="#657d61";c.font="21px sans-serif";c.fillText("A MOMENT, JUST FOR YOU",384,127);c.font="110px Georgia";c.fillText("✦",384,360);c.fillStyle="#284aa4";c.font="48px Georgia";c.fillText(["A LITTLE PAUSE","A SMALL STEP","ANOTHER ANGLE"][cardTheme],384,560);c.font="36px sans-serif";c.fillText(["余白を、一つ。","小さな一歩。","違う角度から。"][cardTheme],384,659);c.font="19px sans-serif";c.fillText("MAKE / TRY / IMPROVE",384,900);cardFront.needsUpdate=true;}
    cover.rotation.z=open*2.5;
    lid.rotation.x=-cardOpen*1.85;
    const spread=Math.max(0,(cardOpen-.25)/.75),lower=Math.max(0,(spread-.9)/.1);
    sliding.forEach((g,i)=>{g.position.set(spread*((i-1)*.22),.14+i*.006-lower*.13+(i===1?.16*Math.sin(cardFlip*Math.PI):0),spread*(.52+(i-1)*.02));g.rotation.y=spread*(i-1)*.15;g.rotation.z=i===1?cardFlip*Math.PI:0;});
    boardPins.forEach((p,i)=>p.scale.set(.023,.023,.014).multiplyScalar(i===selected?1.6:1));
    checks.forEach((p,i)=>{p.material=review&(1<<i)?olive:blue;});
    name.rotation.y=hover==="name"?.14:0;
    if(agentStep>=0&&agentStep!==screenStep){screenStep=agentStep;const c=(screenTex.image as HTMLCanvasElement).getContext("2d")!;c.fillStyle="#243a38";c.fillRect(0,0,1024,512);c.fillStyle="#93bbaa";c.font="23px monospace";c.fillText("MECHANISM DEMO / NO LIVE AI",45,58);c.fillStyle="#f2edda";c.font="62px Georgia";c.fillText(["Goal","Plan","Act","Observe","Act / Repair","Verify","Deliver"][agentStep],45,152);c.fillStyle="#8daf9e";c.font="25px monospace";c.fillText("Build a small card page.",45,207);const fail=agentStep===2||agentStep===3;c.strokeStyle=fail?"#dba97e":"#8db6a0";c.lineWidth=3;c.strokeRect(50,245,440,202);c.fillStyle=fail?"#c88e6c":"#7ba78f";c.fillRect(75,349,fail?510:389,57);c.fillStyle="#f7f1d9";c.font="27px monospace";c.fillText(fail?"380px > 320px":"fits inside 320px",620,304);c.font="34px Georgia";c.fillText(fail?"Check, then repair.":agentStep>=5?"Ready for review.":"Make. Try. Improve.",595,391);screenTex.needsUpdate=true;}
  }, dispose(){
    const allMats=new Set<THREE.Material>();root.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>allMats.add(m));}});geometries.forEach(g=>g.dispose());allMats.forEach(m=>m.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());finishes.dispose();
  } };
}
