import * as THREE from "three";

export type SurfaceKind = "wood" | "floor" | "fabric" | "leather" | "plaster" | "metal" | "paper" | "ceramic" | "cork" | "rubber" | "oak" | "wool" | "bark" | "stone" | "grass";

// Box-projected UVs measured in metres, so grain keeps its scale on thin edges,
// shelves and long table tops. Call before static geometry is merged.
export function metricUV(geometry: THREE.BufferGeometry, scale = 1, channel = "uv", offset = 0) {
  const p = geometry.getAttribute("position"), n = geometry.getAttribute("normal");
  const uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    const nx = Math.abs(n.getX(i)), ny = Math.abs(n.getY(i)), nz = Math.abs(n.getZ(i));
    const u = nx > ny && nx > nz ? p.getZ(i) : p.getX(i);
    const v = ny > nx && ny > nz ? p.getZ(i) : p.getY(i);
    uv[i * 2] = u / scale + offset; uv[i * 2 + 1] = v / scale + offset * .71;
  }
  geometry.setAttribute(channel, new THREE.BufferAttribute(uv, 2));
  return geometry;
}

export function createSurfaceMaterials(invalidate: () => void = () => {}, anisotropy = 4) {
  const textures = new Map<string, THREE.Texture>();
  const materials = new Map<string, THREE.MeshPhysicalMaterial>();
  let disposed = false;
  const loader = new THREE.TextureLoader();
  function map(file: string, color = false, channel = 0) {
    const key = `${file}:${channel}`;
    if (!textures.has(key)) {
      const texture = loader.load(`/materials/studio/${file}.jpg`, () => {
        if (disposed) texture.dispose(); else invalidate();
      }, undefined, () => { if (!disposed) invalidate(); });
      texture.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.anisotropy = anisotropy; texture.channel = channel;
      textures.set(key, texture);
    }
    return textures.get(key)!;
  }
  // Small deterministic height fields for fine paper fibres, glaze pores and
  // directional brushed metal. Photographic maps handle the larger surfaces.
  function micro(kind: SurfaceKind, channel: number) {
    const key = `micro:${kind}:${channel}`;
    if (!textures.has(key)) {
      const canvas = document.createElement("canvas"); canvas.width = canvas.height = 256;
      const context = canvas.getContext("2d")!, pixels = context.createImageData(256, 256);
      let seed = 173;
      const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
      for (let y = 0; y < 256; y++) {
        const streak = random() * 35;
        for (let x = 0; x < 256; x++) {
          const value = kind === "metal" ? 130 + streak + random() * 12 : 145 + random() * (kind === "cork" ? 100 : 55);
          const i = (y * 256 + x) * 4;
          pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = value; pixels.data[i + 3] = 255;
        }
      }
      context.putImageData(pixels, 0, 0);
      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.anisotropy = anisotropy; texture.channel = channel;
      textures.set(key, texture);
    }
    return textures.get(key)!;
  }
  function material(kind: SurfaceKind, color: THREE.ColorRepresentation, channel = 0) {
    const key = `${kind}:${new THREE.Color(color).getHexString()}:${channel}`;
    if (materials.has(key)) return materials.get(key)!;
    const m = new THREE.MeshPhysicalMaterial({ color, roughness: .65 });
    m.name = `${kind}-${new THREE.Color(color).getHexString()}`;
    m.userData.surface = kind;
    const assets: Partial<Record<SurfaceKind,string>> = { wood:"wood_table_001", oak:"white_oak_veneer", floor:"wood_floor", fabric:"fabric_pattern_07", wool:"poly_wool_herringbone", leather:"leather_white", plaster:"plastered_wall_04", bark:"bark_brown_02", stone:"sandstone_cracks", grass:"grass_ground" };
    const asset = assets[kind];
    if (asset) {
      if (!["fabric","wool","plaster"].includes(kind)) m.map = map(`${asset}_diffuse`, true, channel);
      m.normalMap = map(`${asset}_nor_gl`, false, channel);
      m.roughnessMap = map(`${asset}_rough`, false, channel);
      m.normalScale.setScalar(kind === "plaster" ? .16 : kind === "bark" ? .55 : kind === "stone" ? .3 : ["wood","oak","floor"].includes(kind) ? .18 : .35);
      m.roughness = ["wood","oak","floor"].includes(kind) ? .92 : kind === "leather" ? .8 : 1;
      if (["wood","oak","floor"].includes(kind)) { m.clearcoat = .07; m.clearcoatRoughness = .58; }
      if (kind === "leather") { m.clearcoat = .1; m.clearcoatRoughness = .55; }
      if (kind === "fabric" || kind === "wool") { m.sheen = .65; m.sheenColor.set(color); m.sheenRoughness = .9; }
    } else {
      m.bumpMap = micro(kind, channel);
      m.bumpScale = kind === "cork" ? .008 : kind === "paper" ? .00045 : .0008;
      m.roughness = { metal: .32, paper: .86, ceramic: .25, cork: .95, rubber: .78 }[kind as "metal" | "paper" | "ceramic" | "cork" | "rubber"];
      if (kind === "cork") m.map = m.bumpMap;
      if (kind === "metal") { m.metalness = .82; m.anisotropy = .45; }
      if (kind === "ceramic") { m.clearcoat = .65; m.clearcoatRoughness = .22; }
    }
    materials.set(key, m);
    return m;
  }
  return { material, dispose() { disposed = true; materials.forEach(m => m.dispose()); textures.forEach(t => t.dispose()); } };
}
