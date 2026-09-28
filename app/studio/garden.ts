import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { createSurfaceMaterials, metricUV } from "../surfaceMaterials";
import type { ViewId } from "./content";

// An original, metre-scale garden. Instances share geometry and materials;
// nothing is downloaded and the same seeded planting grows on every visit.
export function buildGarden(finishes: ReturnType<typeof createSurfaceMaterials>) {
  const root = new THREE.Group(), canopy = new THREE.Group(), bird = new THREE.Group();
  root.name = "Summer garden"; bird.name = "Studio guide"; bird.userData.gardenGuide = true;
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
    return mesh(geometry(new THREE.TubeGeometry(path, 16, radius, 7, false)), m, [0, 0, 0]);
  }
  function painted(draw: (c: CanvasRenderingContext2D) => void, size = 512) {
    const canvas = document.createElement("canvas"); canvas.width = canvas.height = size; draw(canvas.getContext("2d")!);
    const t = new THREE.CanvasTexture(canvas); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; textures.add(t); return t;
  }
  const grassMap = painted(c => {
    c.fillStyle = "#839873"; c.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 28000; i++) {
      const x = random() * 512, y = random() * 512;
      c.strokeStyle = ["#647e5840", "#ced4a342", "#456a4425"][i % 3]; c.lineWidth = .7;
      c.beginPath(); c.moveTo(x, y); c.lineTo(x + random() * 2, y - 2 - random() * 5); c.stroke();
    }
  });
  grassMap.wrapS = grassMap.wrapT = THREE.RepeatWrapping; grassMap.repeat.set(2, 2);
  const lawn = material(new THREE.MeshStandardMaterial({ color: "#c0c6a4", map: grassMap, bumpMap: grassMap, bumpScale: .015, roughness: 1 }));
  const earth = finishes.material("cork", "#8f8768"), stone = finishes.material("plaster", "#b8b5a0"), darkWood = finishes.material("wood", "#9a8d69");
  box([7.95, .26, 7.05], [.10, -.365, .16], earth, .12);
  box([7.92, .11, 7.02], [.10, -.20, .16], lawn, .05);
  // A small arrival path, with irregular, softened limestone stepping stones.
  for (let i = 0; i < 3; i++) {
    const step = mesh(geometry(new THREE.CylinderGeometry(.21, .24, .06, 7)), stone, [.28 + i * .11, -.12, 2.79 + i * .32]);
    step.scale.set(1.25, 1, .66); step.rotation.y = i * .45;
  }
  for (let i = 0; i < 24; i++) {
    const z = -2.5 + random() * 5.85, x = 3.17 + random() * .48;
    ellipsoid([x, -.11, z], [.03 + random() * .065, .025 + random() * .03, .04 + random() * .07], stone);
  }
  // Slatted outdoor bench; warm wood grain is the same scanned PBR as the room.
  for (let i = 0; i < 4; i++) box([1.25, .055, .095], [-1.47, .27, 2.87 + i * .115], darkWood, .012);
  for (const x of [-1.93, -1.01]) for (const z of [2.90, 3.18]) box([.075, .40, .075], [x, .055, z], darkWood, .01);
  box([1.25, .055, .075], [-1.47, .02, 3.07], darkWood, .01);
  // Native meadow: tapered blades, seed heads and small ivory / ochre blooms.
  const bladeGeo = geometry(new THREE.BufferGeometry());
  bladeGeo.setAttribute("position", new THREE.Float32BufferAttribute([-.012, 0, 0, .012, 0, 0, -.008, .13, .01, .008, .13, .01, .024, .25, .025], 3));
  bladeGeo.setIndex([0, 1, 2, 1, 3, 2, 2, 3, 4]); bladeGeo.computeVertexNormals();
  const bladeMat = material(new THREE.MeshStandardMaterial({ color: "#7c9460", side: THREE.DoubleSide, roughness: .95 }));
  const blades = new THREE.InstancedMesh(bladeGeo, bladeMat, 1150); blades.receiveShadow = true; root.add(blades);
  const dummy = new THREE.Object3D(), color = new THREE.Color();
  const meadow: [number, number][] = [];
  for (let i = 0; i < 1150; i++) {
    let x: number, z: number;
    do { x = -3.78 + random() * 7.65; z = -3.18 + random() * 6.6; }
    while (Math.abs(x) < 3.17 && z < 2.63 && z > -2.72 || z > 2.6 && x > -.1 && x < .95 || z > 2.65 && x > -2.2 && x < -.75);
    const s = .3 + random() * .72;
    dummy.position.set(x, -.155, z); dummy.rotation.set(0, random() * Math.PI * 2, (random() - .5) * .3); dummy.scale.set(s, s, s); dummy.updateMatrix();
    blades.setMatrixAt(i, dummy.matrix); blades.setColorAt(i, color.setHSL(.21 + random() * .045, .23 + random() * .15, .31 + random() * .2));
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
  const treeX = 3.38, treeZ = -1.55;
  branch([[treeX, -.16, treeZ], [treeX - .06, .7, treeZ], [treeX + .06, 1.5, treeZ + .08], [treeX - .03, 2.6, treeZ]], .062, darkWood);
  for (let i = 0; i < 7; i++) {
    const a = i * 2.399, h = 1.3 + i * .15;
    branch([[treeX, h, treeZ], [treeX + Math.cos(a) * .25, h + .24, treeZ + Math.sin(a) * .25], [treeX + Math.cos(a) * .67, h + .44, treeZ + Math.sin(a) * .63]], .019, darkWood);
  }
  canopy.position.set(treeX, 1.2, treeZ); root.add(canopy);
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
  const leaves = new THREE.InstancedMesh(leafGeo, leafMat, 780); leaves.castShadow = true; leaves.receiveShadow = true; canopy.add(leaves);
  for (let i = 0; i < 780; i++) {
    const a = random() * Math.PI * 2, b = Math.acos(2 * random() - 1), r = Math.cbrt(random());
    dummy.position.set(Math.sin(b) * Math.cos(a) * r * 1.08, .95 + Math.cos(b) * r * .93, Math.sin(b) * Math.sin(a) * r * .85);
    dummy.rotation.set((random() - .5) * 2.7, random() * Math.PI * 2, random() * Math.PI * 2); const s = .19 + random() * .21; dummy.scale.set(s, s, s); dummy.updateMatrix();
    leaves.setMatrixAt(i, dummy.matrix); leaves.setColorAt(i, color.setHSL(.20 + random() * .06, .30 + random() * .2, .40 + random() * .24));
  }
  // A hand-built robin: separate wings let the guide hop and fly between chapters.
  const feather = finishes.material("fabric", "#b6ae8c"), breast = finishes.material("fabric", "#d0a35e"), wing = finishes.material("fabric", "#67795d"), beak = finishes.material("ceramic", "#514936");
  bird.position.set(-1.45, .315, 3.03); root.add(bird);
  ellipsoid([0, .15, 0], [.115, .14, .105], feather, bird);
  ellipsoid([0, .15, .071], [.09, .102, .055], breast, bird);
  ellipsoid([0, .273, .044], [.085, .082, .081], feather, bird);
  for (const x of [-.047, .047]) { ellipsoid([x, .289, .108], [.011, .012, .009], beak, bird); ellipsoid([x - .002, .293, .115], [.003, .003, .003], flowerMat, bird); }
  const bill = mesh(geometry(new THREE.ConeGeometry(.018, .07, 8)), beak, [0, .262, .145], bird); bill.rotation.x = Math.PI / 2;
  const leftWing = new THREE.Group(), rightWing = new THREE.Group(); leftWing.position.set(-.09, .18, -.01); rightWing.position.set(.09, .18, -.01); bird.add(leftWing, rightWing);
  ellipsoid([-.015, -.02, -.015], [.029, .091, .076], wing, leftWing); ellipsoid([.015, -.02, -.015], [.029, .091, .076], wing, rightWing);
  const tail = ellipsoid([0, .11, -.125], [.055, .025, .11], wing, bird); tail.rotation.x = -.4;
  for (const x of [-.038, .038]) ellipsoid([x, .016, .02], [.021, .017, .036], beak, bird);
  // Warm, sparse fireflies appear only at dusk. Their positions are animated in one draw call.
  const fireflyGeo = geometry(new THREE.BufferGeometry()), fireflyPositions = new Float32Array(18 * 3);
  const fireflySeeds = Array.from({ length: 18 }, () => [random() * 7 - 3.5, .3 + random() * 1.4, 2.6 + random() * .8, random() * 6.28]);
  fireflyGeo.setAttribute("position", new THREE.BufferAttribute(fireflyPositions, 3));
  const glowMap = painted(c => { const g = c.createRadialGradient(256, 256, 0, 256, 256, 250); g.addColorStop(0, "#fffbd7"); g.addColorStop(.17, "#ffedaaa8"); g.addColorStop(1, "#ffdb7a00"); c.fillStyle = g; c.fillRect(0, 0, 512, 512); });
  const glow = material(new THREE.PointsMaterial({ color: "#ffe69e", size: .1, map: glowMap, transparent: true, depthWrite: false, toneMapped: false, opacity: 0 }));
  const fireflies = new THREE.Points(fireflyGeo, glow); fireflies.frustumCulled = false; root.add(fireflies);
  // Merge static garden details, preserving the independently animated tree / guide.
  root.updateMatrixWorld(true);
  const batches = new Map<THREE.Material, THREE.Mesh[]>();
  root.traverse(o => {
    if (!(o instanceof THREE.Mesh) || o instanceof THREE.InstancedMesh || Array.isArray(o.material)) return;
    for (let p: THREE.Object3D | null = o; p; p = p.parent) if (p === canopy || p === bird) return;
    const list = batches.get(o.material) || []; list.push(o); batches.set(o.material, list);
  });
  for (const [m, meshes] of batches) {
    if (meshes.length < 2) continue;
    const pieces = meshes.map(obj => (obj.geometry.index ? obj.geometry.toNonIndexed() : obj.geometry.clone()).applyMatrix4(obj.matrixWorld));
    const merged = mergeGeometries(pieces); pieces.forEach(g => g.dispose());
    if (merged) { mesh(geometry(merged), m, [0, 0, 0]); meshes.forEach(o => o.removeFromParent()); }
  }
  const perches: Record<ViewId, number[]> = {
    room: [-1.45, .315, 3.03], name: [-1.1, .8, -1.18], notebook: [-2.01, .8, -1.45], board: [1.61, .71, -2.1],
    monitor: [-.62, .8, -1.7], cards: [2.12, .71, .61], checklist: [2.39, .71, 1.39], library: [-2.46, 2.1, .58],
  };
  let view: ViewId = "room", flight = 1;
  const from = bird.position.clone(), to = bird.position.clone();
  return {
    root, bird,
    update(time: number, dt: number, nextView: ViewId, breeze: boolean, dusk: number, instant: boolean) {
      if (nextView !== view) { view = nextView; from.copy(bird.position); to.fromArray(perches[view]); flight = 0; }
      flight = instant ? 1 : Math.min(1, flight + dt / 1.45);
      const u = flight * flight * (3 - 2 * flight);
      bird.position.lerpVectors(from, to, u); bird.position.y += Math.sin(flight * Math.PI) * .85;
      bird.rotation.y = flight < 1 ? Math.atan2(to.x - from.x, to.z - from.z) : .25;
      leftWing.rotation.z = flight < 1 ? -.75 + Math.sin(time * 32) * .65 : -.1;
      rightWing.rotation.z = -leftWing.rotation.z;
      if (breeze && flight === 1) bird.rotation.z = Math.sin(time * 1.5) * .018;
      else bird.rotation.z = 0;
      canopy.rotation.z = breeze ? Math.sin(time * .7) * .009 : 0;
      canopy.rotation.x = breeze ? Math.sin(time * .45) * .006 : 0;
      glow.opacity = dusk * .85;
      fireflySeeds.forEach(([x, y, z, phase], i) => { fireflyPositions[i * 3] = x + Math.sin(time * .35 + phase) * .15; fireflyPositions[i * 3 + 1] = y + Math.sin(time * .65 + phase) * .14; fireflyPositions[i * 3 + 2] = z + Math.cos(time * .4 + phase) * .1; });
      fireflyGeo.attributes.position.needsUpdate = true;
      return flight < 1;
    },
    dispose() { geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); textures.forEach(t => t.dispose()); },
  };
}
