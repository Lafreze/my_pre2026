"use client";

import { useEffect, useRef, useState, type MutableRefObject } from "react";
import type { AtlasMode, AtlasNode } from "./agentAtlasData";
import { atlasVisuals, stationPosition } from "./atlasVisuals";

export type AtlasCamera = { reset: () => void; zoom: (direction: number) => void; rotate: (direction: number) => void; refresh: () => void };
type Props = { nodes: AtlasNode[]; edges: [string, string][]; mode: AtlasMode; active: boolean; selected: string | null; hologramRef: MutableRefObject<HTMLDivElement | null>; onSelect: (id: string) => void; cameraRef: MutableRefObject<AtlasCamera | null> };

export function AtlasCanvas({ nodes, edges, mode, active, selected, hologramRef, onSelect, cameraRef }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const labelsRef = useRef<HTMLDivElement>(null);
  const selectRef = useRef(onSelect);
  const activeRef = useRef(active);
  const selectedRef = useRef(selected);
  const invalidateRef = useRef<(() => void) | null>(null);
  const [status, setStatus] = useState("loading");
  const [modelCount, setModelCount] = useState(0);
  useEffect(() => { selectRef.current = onSelect; }, [onSelect]);
  useEffect(() => { activeRef.current = active; invalidateRef.current?.(); }, [active]);
  useEffect(() => { selectedRef.current = selected; invalidateRef.current?.(); }, [selected]);

  useEffect(() => {
    const mount = mountRef.current, labels = labelsRef.current;
    if (!mount || !labels) return;
    setStatus("loading");
    let cancelled = false, cleanup = () => {};
    const fail = () => { if (!cancelled) setStatus("fallback"); };
    void Promise.all([import("three"), import("three/addons/controls/OrbitControls.js"), import("three/addons/geometries/RoundedBoxGeometry.js"), import("./atlasModels")]).then(async ([T, { OrbitControls }, { RoundedBoxGeometry }, { loadAtlasModels, createStation, disposeAtlasObjects }]) => {
      if (cancelled) return;
      const templates = await loadAtlasModels();
      if (cancelled) { disposeAtlasObjects([...templates.values()]); return; }
      setModelCount(templates.size);
      let renderer: InstanceType<typeof T.WebGLRenderer>;
      try { renderer = new T.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" }); } catch { disposeAtlasObjects([...templates.values()]); fail(); return; }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
      renderer.outputColorSpace = T.SRGBColorSpace;
      renderer.toneMapping = T.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = T.PCFShadowMap;
      renderer.shadowMap.autoUpdate = false;
      renderer.domElement.setAttribute("aria-label", mode === "evolution" ? "LLM型Agentの発展を示す立体年表" : "Agentの構成要素と接続を示す立体図");
      renderer.domElement.setAttribute("role", "img");
      mount.appendChild(renderer.domElement);
      const scene = new T.Scene();
      const camera = new T.PerspectiveCamera(34, 1, .1, 150);
      const controls = new OrbitControls(camera, renderer.domElement);
      let dirty = true, contextLost = false;
      const changed = () => { dirty = true; };
      invalidateRef.current = changed;
      controls.addEventListener("change", changed);
      controls.enableDamping = true;
      controls.dampingFactor = .085;
      controls.enablePan = false;
      controls.minDistance = 10;
      controls.maxDistance = 50;
      controls.minPolarAngle = .2;
      controls.maxPolarAngle = Math.PI * .46;
      let narrowLayout = mount.clientWidth < 700;
      const fit = () => mount.clientWidth < 700 ? 1 : Math.max(1, 1.45 / (mount.clientWidth / Math.max(1, mount.clientHeight)));
      let fitScale = fit();
      const reset = () => {
        const narrow = mount.clientWidth < 700;
        camera.position.set(narrow ? 0 : 3, narrow ? 37 : 20, narrow ? 27 : 19);
        fitScale = fit(); camera.position.multiplyScalar(fitScale);
        controls.target.set(0, narrow ? -2 : -.5, narrow ? .3 : .2);
        controls.update();
      };
      reset();
      cameraRef.current = {
        reset: () => { if (selectedRef.current) focusStation(selectedRef.current); else reset(); changed(); },
        refresh: changed,
        zoom: direction => { flight = null; camera.position.sub(controls.target).multiplyScalar(direction > 0 ? .84 : 1.19).add(controls.target); controls.update(); },
        rotate: direction => { flight = null; const offset = camera.position.clone().sub(controls.target); offset.applyAxisAngle(new T.Vector3(0, 1, 0), direction * .2); camera.position.copy(controls.target).add(offset); controls.update(); },
      };
      scene.add(new T.HemisphereLight(0xe6f1ff, 0x3e5864, 2.2));
      const key = new T.DirectionalLight(0xfff1df, 3); key.position.set(-6, 14, 8); key.castShadow = true;
      key.shadow.mapSize.set(2048, 2048); key.shadow.camera.left = -15; key.shadow.camera.right = 15; key.shadow.camera.top = 15; key.shadow.camera.bottom = -15; key.shadow.normalBias = .03; key.shadow.bias = -.0003; scene.add(key);
      const rim = new T.DirectionalLight(0x9bdcd8, 1.3); rim.position.set(8, 7, -7); scene.add(rim);
      const floor = new T.Mesh(new RoundedBoxGeometry(19.5, .28, 14.5, 3, .2), new T.MeshStandardMaterial({ color: 0x1b3442, roughness: .85 })); floor.position.y = -.43; floor.receiveShadow = true; scene.add(floor);
      const group = new T.Group(); scene.add(group);
      const meshes: InstanceType<typeof T.Mesh>[] = [];
      const nodeGroups = new Map<string, InstanceType<typeof T.Group>>();
      const movements: ReturnType<typeof createStation>["moving"] = [];
      for (const node of nodes) {
        const station = createStation(templates, atlasVisuals[node.id].kind, node.color, node.id);
        group.add(station.root); nodeGroups.set(node.id, station.root); movements.push(...station.moving);
        station.root.traverse(object => { if (object instanceof T.Mesh) meshes.push(object); });
      }
      const curves: InstanceType<typeof T.CatmullRomCurve3>[] = [];
      const packets: InstanceType<typeof T.Mesh>[] = [];
      const connections: InstanceType<typeof T.Mesh<InstanceType<typeof T.TubeGeometry>, InstanceType<typeof T.MeshBasicMaterial>>>[] = [];
      const arrows: InstanceType<typeof T.Mesh>[] = [];
      edges.forEach(() => {
        const tube = new T.Mesh(new T.TubeGeometry(), new T.MeshBasicMaterial({ color: 0x6db5bd, transparent: true, opacity: .5 })); group.add(tube); connections.push(tube);
        const packet = new T.Mesh(new T.SphereGeometry(.055, 8, 6), new T.MeshBasicMaterial({ color: 0xc3f7e5 })); group.add(packet); packets.push(packet);
        const arrow = new T.Mesh(new T.ConeGeometry(.11, .27, 3), new T.MeshBasicMaterial({ color: 0x83c5c7 })); group.add(arrow); arrows.push(arrow);
      });
      const layout = () => {
        nodes.forEach((node, index) => nodeGroups.get(node.id)?.position.fromArray(stationPosition(node.id, index, mode, narrowLayout)));
        floor.scale.set(narrowLayout ? .44 : 1, 1, narrowLayout ? 1.85 : 1);
        curves.length = 0;
        edges.forEach(([from, to], index) => {
          const a = nodeGroups.get(from)!.position.clone(), b = nodeGroups.get(to)!.position.clone();
          a.y = b.y = -.18;
          const middle = a.clone().lerp(b, .5); middle.x += mode === "evolution" ? 0 : (index % 2 ? .3 : -.3);
          const curve = new T.CatmullRomCurve3([a, middle, b]); curves.push(curve);
          connections[index].geometry.dispose(); connections[index].geometry = new T.TubeGeometry(curve, 36, .025, 5, false);
          arrows[index].position.copy(curve.getPointAt(.6)); arrows[index].quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), curve.getTangentAt(.6));
        });
        dirty = true;
        renderer.shadowMap.needsUpdate = true;
      };
      layout();
      const projector = new T.Group(); scene.add(projector); projector.visible = false;
      const glow = new T.MeshBasicMaterial({ color: 0x79e7d3, transparent: true, opacity: .9, side: T.DoubleSide, depthWrite: false, blending: T.AdditiveBlending });
      [1.6, 1.8].forEach(radius => { const ring = new T.Mesh(new T.TorusGeometry(radius, .021, 6, 80), glow); ring.rotation.x = Math.PI / 2; ring.position.y = .13; projector.add(ring); });
      const ticks = new T.Group(); projector.add(ticks);
      for (let i = 0; i < 12; i++) { const tick = new T.Mesh(new T.BoxGeometry(.04, .13, .04), glow); tick.position.set(Math.cos(i * Math.PI / 6) * 1.7, .2, Math.sin(i * Math.PI / 6) * 1.7); ticks.add(tick); }
      let lastSelection: string | null = null, savedView: { position: InstanceType<typeof T.Vector3>; target: InstanceType<typeof T.Vector3> } | null = null;
      let flight: { position: InstanceType<typeof T.Vector3>; target: InstanceType<typeof T.Vector3> } | null = null;
      const focusStation = (id: string) => {
        const station = nodeGroups.get(id); if (!station) return;
        const distance = narrowLayout ? 19 : 20;
        const direction = new T.Vector3(.08, .6, .8).normalize();
        // Lift the camera's point of interest so the selected model remains below its projection.
        const target = station.position.clone(); target.y += distance * (narrowLayout ? .3 : mount.clientHeight < 600 ? .4 : .35);
        flight = { target, position: target.clone().addScaledVector(direction, distance) };
      };
      const stopFlight = () => { flight = null; };
      controls.addEventListener("start", stopFlight);
      const raycaster = new T.Raycaster(), pointer = new T.Vector2();
      let hovered: string | null = null, down = { x: 0, y: 0 };
      let previousHovered: string | null | undefined;
      const hit = (event: PointerEvent) => {
        const rect = renderer.domElement.getBoundingClientRect();
        pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1);
        raycaster.setFromCamera(pointer, camera);
        return raycaster.intersectObjects(meshes, false)[0]?.object.userData.id as string | undefined;
      };
      const move = (event: PointerEvent) => { hovered = hit(event) ?? null; dirty = true; renderer.domElement.style.cursor = hovered ? "pointer" : "grab"; };
      const leave = () => { hovered = null; dirty = true; renderer.domElement.style.cursor = "grab"; };
      const labelEnter = (event: Event) => { const id = (event.target as HTMLElement).closest<HTMLElement>("[data-node]")?.dataset.node; if (id) { hovered = id; dirty = true; } };
      const pointerDown = (event: PointerEvent) => { down = { x: event.clientX, y: event.clientY }; };
      const pointerUp = (event: PointerEvent) => { if (Math.hypot(event.clientX - down.x, event.clientY - down.y) < 6) { const id = hit(event); if (id) selectRef.current(id); } };
      const lost = (event: Event) => { event.preventDefault(); contextLost = true; fail(); };
      renderer.domElement.addEventListener("pointermove", move);
      renderer.domElement.addEventListener("pointerleave", leave);
      labels.addEventListener("pointerover", labelEnter); labels.addEventListener("pointerout", leave); labels.addEventListener("focusin", labelEnter); labels.addEventListener("focusout", leave);
      renderer.domElement.addEventListener("pointerdown", pointerDown);
      renderer.domElement.addEventListener("pointerup", pointerUp);
      renderer.domElement.addEventListener("webglcontextlost", lost);
      const resize = new ResizeObserver(() => { const w = mount.clientWidth, h = mount.clientHeight; if (!w || !h) return; renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); if (narrowLayout !== (w < 700)) { narrowLayout = w < 700; layout(); reset(); } else { const nextFit = fit(); camera.position.sub(controls.target).multiplyScalar(nextFit / fitScale).add(controls.target); fitScale = nextFit; controls.update(); } if (selectedRef.current) focusStation(selectedRef.current); dirty = true; });
      resize.observe(mount);
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
      reducedMotion.addEventListener("change", changed);
      const projected = new T.Vector3();
      let frame = 0, previous = 0, elapsed = 0, shadowTime = -1;
      const draw = (time: number) => {
        frame = requestAnimationFrame(draw);
        if (!activeRef.current || document.hidden || contextLost) return;
        if (reducedMotion.matches && !dirty || !reducedMotion.matches && time - previous < 33) return;
        const dt = Math.min((time - previous) / 1000, .05); previous = time; dirty = false;
        if (!reducedMotion.matches) elapsed += dt;
        const selection = selectedRef.current;
        if (selection !== lastSelection) {
          if (selection && nodeGroups.has(selection)) {
            if (!lastSelection) savedView = { position: camera.position.clone(), target: controls.target.clone() };
            focusStation(selection);
          } else if (!selection && savedView) { flight = savedView; savedView = null; }
          lastSelection = selection; previousHovered = undefined;
        }
        if (flight) {
          const amount = reducedMotion.matches ? 1 : 1 - Math.exp(-dt * 7);
          camera.position.lerp(flight.position, amount); controls.target.lerp(flight.target, amount);
          if (camera.position.distanceToSquared(flight.position) < .0001 && controls.target.distanceToSquared(flight.target) < .0001) { camera.position.copy(flight.position); controls.target.copy(flight.target); flight = null; }
          dirty = true;
        }
        controls.update();
        const selectedStation = selection ? nodeGroups.get(selection) : undefined;
        projector.visible = Boolean(selectedStation);
        if (selectedStation) { projector.position.copy(selectedStation.position); glow.color.set(nodes.find(node => node.id === selection)!.color); glow.opacity = .72 + Math.sin(elapsed * 2) * .12; ticks.rotation.y = elapsed * .12; }
        packets.forEach((packet, index) => packet.position.copy(curves[index].getPointAt((elapsed * .12 + index * .137) % 1)));
        movements.forEach(({ object, axis, base, amplitude, speed }) => { object.rotation[axis] = base + Math.sin(elapsed * speed) * amplitude; });
        if (elapsed - shadowTime > .16) { renderer.shadowMap.needsUpdate = true; shadowTime = elapsed; }
        if (hovered !== previousHovered) {
          previousHovered = hovered;
          for (const mesh of meshes) {
            const highlighted = mesh.userData.id === hovered || mesh.userData.id === selection;
            for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
              if (material instanceof T.MeshStandardMaterial) {
                material.emissive.copy(highlighted ? new T.Color(0x79cfc7) : material.userData.baseEmissive);
                material.emissiveIntensity = highlighted ? .18 : material.userData.baseIntensity;
              }
            }
          }
          edges.forEach(([from, to], index) => {
            const focus = selection || hovered;
            const related = focus === from || focus === to;
            connections[index].material.opacity = focus ? (related ? 1 : .12) : .5;
            connections[index].material.color.set(related ? 0xb2f8dc : 0x6db5bd);
            packets[index].visible = !focus || related; arrows[index].visible = !focus || related;
          });
        }
        const positioned: { element: HTMLElement; x: number; y: number; w: number; h: number; anchorX: number; anchorY: number; id: string }[] = [];
        for (const node of nodes) {
          const label = labels.querySelector<HTMLElement>(`[data-node="${node.id}"]`);
          if (!label) continue;
          projected.copy(nodeGroups.get(node.id)!.position); projected.z += 1.4; projected.y -= .1; projected.project(camera);
          const x = (projected.x * .5 + .5) * mount.clientWidth, y = (-projected.y * .5 + .5) * mount.clientHeight;
          const w = label.offsetWidth, h = label.offsetHeight;
          positioned.push({ element: label, x: x - w / 2, y: y - h * .48, w, h, anchorX: x, anchorY: y, id: node.id });
          label.style.visibility = projected.z > 1 || projected.z < -1 ? "hidden" : "visible";
          label.style.zIndex = String(Math.round((1 - projected.z) * 1000));
          label.dataset.hovered = String(node.id === hovered);
          label.dataset.selected = String(node.id === selection);
        }
        // Separate screen-space labels while retaining their links to the 3D objects.
        for (let pass = 0; pass < 18; pass++) {
          for (let i = 0; i < positioned.length; i++) for (let j = i + 1; j < positioned.length; j++) {
            const a = positioned[i], b = positioned[j];
            const overlapX = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x) + 9;
            const overlapY = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y) + 9;
            if (overlapX > 0 && overlapY > 0) {
              const shift = overlapY / 2 + 1;
              if (a.y <= b.y) { a.y -= shift; b.y += shift; } else { a.y += shift; b.y -= shift; }
            }
          }
          positioned.forEach(item => { item.x = Math.max(8, Math.min(mount.clientWidth - item.w - 8, item.x)); item.y = Math.max(35, Math.min(mount.clientHeight - item.h - (narrowLayout ? 105 : 70), item.y)); });
        }
        positioned.forEach(item => {
          item.element.style.transform = `translate(${item.x}px,${item.y}px)`;
          const line = labels.querySelector(`[data-label-line="${item.id}"]`);
          line?.setAttribute("x1", String(item.anchorX)); line?.setAttribute("y1", String(item.anchorY));
          line?.setAttribute("x2", String(item.x + item.w / 2)); line?.setAttribute("y2", String(item.y));
        });
        const hologram = hologramRef.current, card = hologram?.querySelector<HTMLElement>(".atlas-holo-card");
        if (selectedStation && hologram && card) {
          projected.copy(selectedStation.position); projected.y += .25; projected.project(camera);
          const anchorX = (projected.x * .5 + .5) * mount.clientWidth, anchorY = (-projected.y * .5 + .5) * mount.clientHeight;
          const width = card.offsetWidth, height = card.offsetHeight;
          const x = Math.max(10, Math.min(mount.clientWidth - width - 10, anchorX - width / 2));
          const y = Math.max(16, Math.min(mount.clientHeight - height - 82, anchorY - height - 100));
          card.style.left = `${x}px`; card.style.top = `${y}px`;
          hologram.dataset.anchored = "true";
          hologram.dataset.anchorX = anchorX.toFixed(1); hologram.dataset.anchorY = anchorY.toFixed(1);
          const left = x + width * .2, right = x + width * .8, bottom = y + height + 3;
          hologram.querySelector("[data-holo-fan]")?.setAttribute("d", `M${left},${bottom} L${right},${bottom} L${anchorX + 13},${anchorY} L${anchorX - 13},${anchorY} Z`);
          hologram.querySelector("[data-holo-thread]")?.setAttribute("d", `M${left},${bottom} L${anchorX - 13},${anchorY} M${right},${bottom} L${anchorX + 13},${anchorY}`);
          const origin = hologram.querySelector("[data-holo-origin]"); origin?.setAttribute("cx", String(anchorX)); origin?.setAttribute("cy", String(anchorY));
        }
        renderer.render(scene, camera);
      };
      frame = requestAnimationFrame(draw);
      setStatus("ready");
      cleanup = () => {
        cancelAnimationFrame(frame); resize.disconnect(); controls.removeEventListener("change", changed); controls.removeEventListener("start", stopFlight); reducedMotion.removeEventListener("change", changed); controls.dispose(); cameraRef.current = null; invalidateRef.current = null;
        renderer.domElement.removeEventListener("pointermove", move); renderer.domElement.removeEventListener("pointerdown", pointerDown); renderer.domElement.removeEventListener("pointerup", pointerUp); renderer.domElement.removeEventListener("webglcontextlost", lost);
        renderer.domElement.removeEventListener("pointerleave", leave); labels.removeEventListener("pointerover", labelEnter); labels.removeEventListener("pointerout", leave); labels.removeEventListener("focusin", labelEnter); labels.removeEventListener("focusout", leave);
        disposeAtlasObjects([scene, ...templates.values()]);
        renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove();
      };
    }).catch(fail);
    return () => { cancelled = true; cleanup(); };
  }, [nodes, edges, mode, cameraRef, hologramRef]);

  return <div className="atlas-visual" data-status={status} data-mode={mode} data-model-count={modelCount}>
    <div className="atlas-webgl" ref={mountRef} />
    <div className="atlas-labels" ref={labelsRef}><svg className="atlas-label-lines" aria-hidden="true">{nodes.map(node => <line key={node.id} data-label-line={node.id} stroke={node.color} />)}</svg>{nodes.map(node => <button type="button" key={node.id} data-node={node.id} className="atlas-node-label" tabIndex={selected === node.id ? -1 : 0} aria-expanded={selected === node.id} aria-controls={selected === node.id ? "atlas-projection-card" : undefined} style={{ borderColor: `${node.color}55` }} onClick={() => onSelect(node.id)} aria-label={`${node.label}の詳細`}><span style={{ color: node.color }}>{mode === "evolution" ? node.date + " / " + node.label : node.label}</span><b>{atlasVisuals[node.id].role}</b><i>↗</i></button>)}</div>
    {status === "loading" && <span className="atlas-loading" role="status">AGENT ATLAS <i /></span>}
    {status === "fallback" && <div className="atlas-fallback"><span>GRAPH INDEX</span>{nodes.map(node => <button type="button" key={node.id} onClick={() => onSelect(node.id)}><small>{node.date}</small>{node.label}<b>↗</b></button>)}</div>}
  </div>;
}
