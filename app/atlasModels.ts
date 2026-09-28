import * as T from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import type { StationKind } from "./atlasVisuals";
import { createSurfaceMaterials, metricUV, type SurfaceKind } from "./surfaceMaterials";

const files = {
  shelf: "furniture/bookcaseOpen", books: "furniture/books", desk: "furniture/desk",
  monitor: "furniture/computerScreen", keyboard: "furniture/computerKeyboard",
  mouse: "furniture/computerMouse", chair: "furniture/chairDesk",
  arm: "factory/robot-arm-b", bot: "factory/oopi", gear: "factory/cog-a",
  scanner: "factory/scanner-high", conveyor: "factory/conveyor", screen: "factory/screen-wide",
};
type Asset = keyof typeof files;
type Templates = Map<Asset, T.Group>;

export async function loadAtlasModels(): Promise<Templates> {
  const loader = new GLTFLoader();
  const result: Templates = new Map();
  await Promise.all(Object.entries(files).map(async ([name, path]) => {
    try { result.set(name as Asset, (await loader.loadAsync(`/models/atlas/${path}.glb`)).scene); }
    catch { /* Each missing asset gets a local, readable symbol in its station. */ }
  }));
  return result;
}

export function disposeAtlasObjects(objects: T.Object3D[]) {
  const geometries = new Set<T.BufferGeometry>(), materials = new Set<T.Material>(), textures = new Set<T.Texture>();
  objects.forEach(root => root.traverse(object => {
    if (!(object instanceof T.Mesh || object instanceof T.LineSegments)) return;
    geometries.add(object.geometry);
    (Array.isArray(object.material) ? object.material : [object.material]).forEach(material => materials.add(material));
  }));
  materials.forEach(material => Object.values(material).forEach(value => { if (value instanceof T.Texture) textures.add(value); }));
  textures.forEach(texture => { texture.dispose(); if (typeof ImageBitmap !== "undefined" && texture.image instanceof ImageBitmap) texture.image.close(); });
  geometries.forEach(geometry => geometry.dispose()); materials.forEach(material => material.dispose());
}

export function createStation(templates: Templates, kind: StationKind, color: string, id: string, finishes: ReturnType<typeof createSurfaceMaterials>) {
  const root = new T.Group();
  const moving: { object: T.Object3D; axis: "x" | "y" | "z"; base: number; amplitude: number; speed: number }[] = [];
  const accent = new T.Color(color);
  const stationMaterials = new Map<string, T.MeshPhysicalMaterial>();
  const material = (c: T.ColorRepresentation, metal = .28) => {
    const key = `${new T.Color(c).getHexString()}:${metal}`;
    if (!stationMaterials.has(key)) {
      const finish = finishes.material("metal", c).clone(); finish.metalness = metal; finish.roughness = .4;
      stationMaterials.set(key, finish);
    }
    return stationMaterials.get(key)!;
  };
  const box = (w: number, h: number, d: number, c: T.ColorRepresentation, x = 0, y = 0, z = 0, parent: T.Object3D = root) => {
    const mesh = new T.Mesh(metricUV(new RoundedBoxGeometry(w, h, d, 3, Math.min(.055, h / 4))), material(c));
    mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  };
  const cable = (points: number[][], c: T.ColorRepresentation, radius = .025, parent: T.Object3D = root) => {
    const curve = new T.CatmullRomCurve3(points.map(p => new T.Vector3(...p as [number, number, number])));
    const mesh = new T.Mesh(new T.TubeGeometry(curve, 24, radius, 6, false), material(c)); parent.add(mesh); return mesh;
  };
  const graphics = (text: string, width: number, height: number, x: number, y: number, z: number, flat = false, style: "screen" | "paper" | "chip" = "screen") => {
    const canvas = document.createElement("canvas"); canvas.width = 384; canvas.height = 256;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = style === "paper" ? "#f7f4e9" : "#102a36"; ctx.fillRect(0, 0, 384, 256);
    ctx.fillStyle = style === "paper" ? "#294950" : color;
    if (style === "chip") {
      ctx.textAlign = "center"; ctx.font = "600 110px Arial"; ctx.fillText(text, 192, 163);
      ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.strokeRect(14, 14, 356, 228);
    } else {
      ctx.fillRect(23, 24, 35, 5); ctx.font = "600 34px monospace"; ctx.fillText(text, 24, 83);
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = i === 0 ? color : style === "paper" ? "#a1b3b2" : "#4d7280";
        ctx.fillRect(27, 115 + i * 30, 10, 10); ctx.fillRect(54, 115 + i * 30, [205, 155, 238, 180][i], 6);
      }
      ctx.fillStyle = color; ctx.fillRect(312, 18, 8, 8); ctx.fillRect(330, 18, 8, 8); ctx.fillRect(348, 18, 8, 8);
    }
    const texture = new T.CanvasTexture(canvas); texture.colorSpace = T.SRGBColorSpace;
    const mesh = new T.Mesh(new T.PlaneGeometry(width, height), new T.MeshPhysicalMaterial({ map: texture, side: T.DoubleSide, roughness: style === "paper" ? .85 : .3, emissiveMap: style === "screen" ? texture : null, emissive: style === "screen" ? "#ffffff" : "#000000", emissiveIntensity: .25, clearcoat: style === "screen" ? .3 : 0, bumpMap: style === "paper" ? finishes.material("paper", "#ffffff").bumpMap : null, bumpScale: .0005 }));
    mesh.position.set(x, y, z); if (flat) mesh.rotation.x = -Math.PI / 2; root.add(mesh); return mesh;
  };
  const add = (name: Asset, size: number, x = 0, y = 0, z = 0, rotation = 0, parent: T.Object3D = root) => {
    const source = templates.get(name);
    if (!source) { const substitute = new T.Group(); substitute.add(box(size * .7, size * .5, size * .35, color)); parent.add(substitute); substitute.position.set(x, y, z); return substitute; }
    const model = source.clone(true);
    model.traverse(object => {
      if (!(object instanceof T.Mesh)) return;
      // Keep Kenney's palette UVs on channel 0. Independent metric UVs carry
      // the surface detail so palette-atlas coordinates never stretch grain.
      object.geometry = metricUV(object.geometry.clone(), .7, "uv1");
      const refine = (source: T.Material) => {
        if (!(source instanceof T.MeshStandardMaterial)) return source.clone();
        const label = source.name.toLowerCase();
        const surface: SurfaceKind = label === "wood" ? "wood" : name === "books" ? (label === "carpetwhite" ? "paper" : "fabric") : label.includes("carpet") ? "leather" : label === "metaldark" ? "rubber" : "metal";
        const finish = finishes.material(surface, surface === "wood" ? "#f4e4ce" : source.color, 1).clone();
        if (source.map) { finish.map = source.map; finish.metalness = name === "gear" ? .85 : .38; finish.roughness = name === "gear" ? .3 : .44; }
        finish.name = `${name}-${source.name}-${surface}`;
        return finish;
      };
      object.material = Array.isArray(object.material) ? object.material.map(refine) : refine(object.material);
      object.castShadow = true; object.receiveShadow = true;
    });
    const bounds = new T.Box3().setFromObject(model), dimensions = bounds.getSize(new T.Vector3());
    const scale = size / Math.max(dimensions.x, dimensions.y, dimensions.z);
    model.scale.multiplyScalar(scale);
    bounds.setFromObject(model); const center = bounds.getCenter(new T.Vector3());
    model.position.set(-center.x, -bounds.min.y, -center.z);
    const wrapper = new T.Group(); wrapper.add(model); wrapper.position.set(x, y, z); wrapper.rotation.y = rotation; parent.add(wrapper);
    return wrapper;
  };
  const lamp = (x: number, y: number, z: number, c: T.ColorRepresentation = color) => {
    const mesh = new T.Mesh(new T.SphereGeometry(.035, 8, 6), new T.MeshBasicMaterial({ color: c })); mesh.position.set(x, y, z); root.add(mesh);
  };
  const rack = (x: number, z: number, scale = 1) => {
    const g = new T.Group(); root.add(g); g.position.set(x, .18, z); g.scale.setScalar(scale);
    box(.9, 1.9, .72, "#334654", 0, .95, 0, g);
    for (let i = 0; i < 5; i++) {
      box(.76, .26, .055, "#152c38", 0, .25 + i * .32, .385, g);
      box(.4, .028, .02, "#7e96a0", -.08, .25 + i * .32, .42, g);
      box(.06, .06, .02, color, .26, .25 + i * .32, .42, g);
      for(let slot=0;slot<7;slot++) box(.026,.055,.009,"#091a22",-.28+slot*.055,.31+i*.32,.419,g);
    }
    box(.69, .045, .53, "#829ba5", 0, 1.925, 0, g); return g;
  };
  // Platforms organize the diagram; individual objects carry the meaning.
  const base = box(2.85, .18, 2.45, "#e1e8e7", 0, 0, 0);
  base.name = "station-platform";
  box(2.65, .055, 2.23, "#b2c3c7", 0, -.115, 0);
  const strip = box(1.7, .025, .035, color, 0, .105, 1.16);
  strip.material = strip.material.clone();
  strip.material.emissive.copy(accent); strip.material.emissiveIntensity = .4;
  for(const x of [-1.26,1.26]) for(const z of [-1.05,1.05]) {
    const screw = new T.Mesh(new T.CylinderGeometry(.032,.032,.009,16),material("#93a3ab",.8));
    screw.position.set(x,.097,z); screw.castShadow=true;root.add(screw);
    box(.034,.002,.007,"#33444c",x,.103,z);
  }

  if (kind === "chip") {
    box(2.15, .09, 1.75, "#227b73", 0, .19);
    for (const sign of [-1, 1]) for (let i = 0; i < 9; i++) {
      box(.07, .08, .24, "#c5b788", (i - 4) * .19, .28, sign * .65);
      box(.24, .08, .07, "#c5b788", sign * .82, .28, (i - 4) * .135);
    }
    box(1.5, .3, 1.16, "#203d49", 0, .34); box(1.2, .07, .94, "#477980", 0, .53);
    graphics(id === "transformer" ? "ATTN" : "LLM", 1.08, .82, 0, .57, 0, true, "chip");
    for (const x of [-.9, .9]) for (const z of [-.64, .64]) lamp(x, .26, z);
    const arc = new T.Mesh(new T.TorusGeometry(1.13, .017, 6, 64, Math.PI * 1.4), new T.MeshBasicMaterial({ color, transparent: true, opacity: .6 }));
    arc.rotation.x = Math.PI / 2; arc.position.y = .85; root.add(arc);
    moving.push({ object: arc, axis: "z", base: 0, amplitude: Math.PI, speed: .2 });
  } else if (kind === "library") {
    for (const x of [-.59, .59]) {
      add("shelf", 2.05, x, .12, -.22);
      for (let row = 0; row < 4; row++) add("books", .66, x, .2 + row * .47, -.22, row % 2 ? .08 : -.04);
    }
    graphics("RAG", .72, .43, .85, .13, .72, true, "paper");
    const glass = new T.Mesh(new T.TorusGeometry(.26, .045, 8, 28), material("#426779", .5)); glass.position.set(-.62, .22, .78); glass.rotation.x = -.5; root.add(glass);
    const handle = box(.07, .4, .07, "#426779", -.82, .04, .91); handle.rotation.z = -.65;
  } else if (kind === "server") {
    rack(-.52, -.22); rack(.52, -.22, .87);
    graphics("STATE", .87, .49, .64, .15, .74, true, "paper");
    cable([[-.6, .2, .3], [-.8, .15, .75], [.1, .15, .8], [.6, .2, .2]], "#587483", .045);
  } else if (kind === "robot") {
    const arm = add("arm", 2.6, -.55, .12, -.2);
    const shoulder = arm.getObjectByName("element-b"), elbow = arm.getObjectByName("element-d"), wrist = arm.getObjectByName("element-f");
    if (shoulder) shoulder.rotation.z = -.55;
    if (elbow) { elbow.rotation.z = -1.05; moving.push({ object: elbow, axis: "z", base: -1.05, amplitude: .1, speed: 1.1 }); }
    if (wrist) wrist.rotation.z = -.35;
    box(1.2, .16, .62, "#4e6878", .3, .2, .56);
    for (let i = 0; i < 6; i++) {
      const roller = new T.Mesh(new T.CylinderGeometry(.052, .052, .54, 12), material("#d5d9cf", .5));
      roller.rotation.x = Math.PI / 2; roller.position.set(-.17 + i * .19, .31, .56); root.add(roller);
    }
    box(.36, .33, .36, "#dca466", .4, .46, .56);
    graphics("API", .63, .34, -.85, .135, .75, true, "paper");
  } else if (kind === "terminal" || kind === "brief") {
    add("desk", 2.05, 0, .12, -.15);
    const deskTop = .12 + new T.Box3().setFromObject(root.children[root.children.length - 1]).getSize(new T.Vector3()).y;
    if (kind === "terminal") {
      const monitor = add("monitor", 1.04, .1, deskTop, -.5);
      const bounds = new T.Box3().setFromObject(monitor), size = bounds.getSize(new T.Vector3());
      graphics(id === "coding-agent" ? "</>" : "REVIEW", .87, size.y * .62, .1, deskTop + size.y * .64, -.5 + size.z / 2 + .009);
      add("keyboard", .74, .03, deskTop, .15); add("mouse", .16, .66, deskTop, .15);
      add("chair", 1.25, -.37, .12, .83, Math.PI);
    } else {
      graphics("GOAL", .87, .93, -.25, deskTop + .012, -.08, true, "paper");
      add("books", .58, .67, deskTop, -.36);
      const pencil = box(.035, .035, .65, "#d89657", .42, deskTop + .04, .1); pencil.rotation.y = -.2;
      const board = graphics("TASK", .72, .52, .8, deskTop + .55, -.66); board.rotation.y = -.12;
    }
  } else if (kind === "hub") {
    box(1.85, .42, 1.07, "#405466", 0, .37, -.05); box(1.71, .045, .96, "#c6d5d5", 0, .6, -.05);
    graphics("MCP", .97, .55, 0, .63, -.05, true, "chip");
    for (let i = 0; i < 4; i++) {
      const x = (i - 1.5) * .39;
      box(.27, .14, .045, "#0f2830", x, .35, .5); lamp(x, .48, .532);
      const end = (i - 1.5) * .73;
      cable([[x, .36, .54], [x, .22, .82], [end, .18, 1.02], [end, .2, .69]], i % 2 ? "#7aafd7" : "#49b39f", .035);
      box(.18, .14, .23, "#d3dbd9", end, .19, .68);
    }
  } else if (kind === "loop") {
    add("bot", 1.65, 0, .16, -.15, Math.PI / 2);
    for (const phase of [0, Math.PI]) {
      const ring = new T.Mesh(new T.TorusGeometry(1.06, .035, 6, 56, Math.PI * .77), material(color)); ring.rotation.x = Math.PI / 2; ring.rotation.z = phase; ring.position.y = .28; root.add(ring);
      const arrow = new T.Mesh(new T.ConeGeometry(.13, .28, 3), material(color)); arrow.position.set(Math.cos(phase) * 1.06, .28, 0); arrow.rotation.x = Math.PI / 2; root.add(arrow);
    }
    graphics("ACT", .45, .25, .78, .14, .7, true, "paper"); graphics("OBS", .45, .25, -.78, .14, -.7, true, "paper");
  } else if (kind === "check") {
    add("scanner", 2, 0, .12, -.18, Math.PI / 2); add("conveyor", 1.25, 0, .12, .22);
    box(.48, .34, .4, "#66b89e", 0, .42, .3);
    const screen = graphics("PASS", .86, .56, 0, 1.43, .28); screen.rotation.x = -.12;
    cable([[-.65, .15, -.3], [-.95, .18, .65], [-.65, .22, .87]], "#536d7e");
    graphics("EVAL", .6, .27, .65, .14, .87, true, "paper");
  } else if (kind === "harness") {
    rack(-.73, -.22, .7); add("screen", 1.18, .45, .37, -.21);
    graphics("RUN", .83, .46, .45, .95, .03);
    for (const x of [-1.13, 1.13]) box(.085, 1.95, .085, "#5b7687", x, 1.1, -.77);
    box(2.34, .085, .085, "#5b7687", 0, 2.06, -.77);
    const gear = add("gear", .75, .62, .12, .73);
    moving.push({ object: gear, axis: "y", base: 0, amplitude: Math.PI, speed: .15 });
    cable([[-.75, .25, .15], [-.6, .17, .75], [.18, .2, .66], [.45, .4, -.2]], color, .035);
  }
  root.traverse(object => {
    if (object instanceof T.Mesh) {
      object.userData.id = id;
      for (const mat of Array.isArray(object.material) ? object.material : [object.material]) {
        if (mat instanceof T.MeshStandardMaterial) { mat.userData.baseEmissive = mat.emissive.clone(); mat.userData.baseIntensity = mat.emissiveIntensity; }
      }
    }
  });
  return { root, moving, accent };
}
