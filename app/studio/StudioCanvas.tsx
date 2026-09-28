"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { buildRoom } from "./room";
import { cameras, objects, type ObjectId, type ViewId } from "./content";

type Props = { overview: boolean; view: ViewId; chapter: number; paused: boolean; cardOpen: boolean; boardStep: number; review: number; onSelect: (id: ObjectId) => void; skipToken: number; agentStep: number; flipped: boolean; cardTheme: number };
type SceneCommand = "closer" | "farther" | "reset";

export default function StudioCanvas(props: Props) {
  const { view, chapter, onSelect, overview } = props;
  const host = useRef<HTMLDivElement>(null), labels = useRef(new Map<ObjectId, HTMLButtonElement>());
  const trigger = useRef<() => void>(() => {}), control = useRef<(command: SceneCommand) => void>(() => {});
  const focusedObject = useRef<ObjectId | null>(null);
  const [status, setStatus] = useState("loading"), [retry, setRetry] = useState(0), [hover, setHover] = useState<ObjectId | null>(null);
  const [timeOfDay, setTimeOfDay] = useState<"day" | "dusk">("day"), [breeze, setBreeze] = useState(true);
  const [visited, setVisited] = useState<ObjectId[]>([]), [stored, setStored] = useState(false);
  const visit = useCallback((id: ObjectId) => setVisited(old => old.includes(id) ? old : [...old, id]), []);
  const select = useCallback((id: ObjectId) => { visit(id); onSelect(id); }, [onSelect, visit]);
  const nextObject = objects.find(o => !visited.includes(o.id)) || objects[0];
  const discover = useCallback(() => { if (visited.length === objects.length) setVisited([]); select(nextObject.id); }, [visited.length, select, nextObject.id]);
  const latest = useRef({ ...props, timeOfDay, breeze, select, discover });
  useEffect(() => {
    const init = requestAnimationFrame(() => {
      try {
        const saved: unknown = JSON.parse(sessionStorage.getItem("studio-garden-visits") || "[]");
        if (Array.isArray(saved)) setVisited([...new Set(saved.filter((id): id is ObjectId => objects.some(o => o.id === id)))]);
      } catch { /* Exploration also works when storage is disabled. */ }
      setBreeze(!matchMedia("(prefers-reduced-motion: reduce)").matches); setStored(true);
    });
    return () => cancelAnimationFrame(init);
  }, []);
  useEffect(() => { if (stored) try { sessionStorage.setItem("studio-garden-visits", JSON.stringify(visited)); } catch { /* Optional session memory. */ } }, [stored, visited]);
  useEffect(() => {
    if (view === "room") return;
    const id = requestAnimationFrame(() => visit(view)); return () => cancelAnimationFrame(id);
  }, [view, visit]);
  useEffect(() => { latest.current = { ...props, timeOfDay, breeze, select, discover }; trigger.current(); }, [props, timeOfDay, breeze, select, discover]);
  useEffect(() => {
    const element = host.current!;
    if (new URLSearchParams(location.search).has("no3d")) { const fallback = requestAnimationFrame(() => setStatus("fallback")); return () => cancelAnimationFrame(fallback); }
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" }); }
    catch { const fallback = requestAnimationFrame(() => setStatus("fallback")); return () => cancelAnimationFrame(fallback); }
    renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 700 ? 1.25 : 1.65));
    renderer.shadowMap.enabled = true; renderer.shadowMap.autoUpdate = false; renderer.shadowMap.needsUpdate = true; renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.02;
    renderer.domElement.setAttribute("aria-label", "庭のある3Dワークスタジオ。ドラッグで回転、スクロールで拡大。各物件は画面上のボタンからも開けます。");
    renderer.domElement.setAttribute("role", "img"); element.prepend(renderer.domElement);
    const scene = new THREE.Scene(), room = buildRoom(() => trigger.current(), Math.min(8, renderer.capabilities.getMaxAnisotropy())); scene.add(room.root);
    const pmrem = new THREE.PMREMGenerator(renderer), environmentScene = new RoomEnvironment(), environment = pmrem.fromScene(environmentScene, .04);
    scene.environment = environment.texture; scene.environmentIntensity = .55; environmentScene.dispose(); pmrem.dispose();
    if (innerWidth < 700) room.sun.shadow.mapSize.set(1024, 1024);
    const camera = new THREE.PerspectiveCamera(34, 1, .1, 80), target = new THREE.Vector3();
    let previousView: ViewId = latest.current.view;
    const start = cameras[previousView]; camera.position.set(...start.position); target.set(...start.target);
    let span = start.span, raf = 0, last = 0, elapsed = 0, urgent = true, dirty = true, from = 0, duration = 1100, animating = false, settling = false, disposed = false, contextLost = false;
    let open = 0, card = 0, flip = 0, dusk = 0, focusBlend = latest.current.overview ? 0 : 1, orbit = 0, zoom = 1;
    let sourcePosition = camera.position.clone(), sourceTarget = target.clone(), sourceSpan = span, skip = latest.current.skipToken, shadowOpen = -1, shadowCard = -1, slowFrames = 0, wasFlying = false;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)"), ray = new THREE.Raycaster(), pointer = new THREE.Vector2();
    let hoverId: ObjectId | null = null, down: { x: number; y: number; time: number; orbit: number } | null = null, dragged = false, pinch: { distance: number; zoom: number } | null = null;
    const pointers = new Map<number, THREE.Vector2>();
    let frames = 0;
    function project() {
      const w = element.clientWidth, h = element.clientHeight;
      const projected = objects.map(o => {
        const v = new THREE.Vector3(...o.anchor).project(camera);
        const x = (v.x * .5 + .5) * w, y = (-v.y * .5 + .5) * h;
        return { id: o.id, x, y, anchorX: x, anchorY: y, offscreen: v.z > 1 || v.x < -.95 || v.x > .92 || v.y < -.92 || v.y > .95 };
      });
      // Keep the actual 44px hit areas apart, even where desk objects share a
      // small patch of screen on a phone. Fine leaders retain their spatial link.
      if (latest.current.overview) for (let pass = 0; pass < 16; pass++) {
        for (let i = 0; i < projected.length; i++) for (let j = i + 1; j < projected.length; j++) {
          const a = projected[i], b = projected[j], dx = b.x - a.x, dy = b.y - a.y;
          if (Math.abs(dx) >= 48 || Math.abs(dy) >= 48) continue;
          if (Math.abs(dx) > Math.abs(dy)) { const push = (48 - Math.abs(dx)) / 2; a.x -= Math.sign(dx || 1) * push; b.x += Math.sign(dx || 1) * push; }
          else { const push = (48 - Math.abs(dy)) / 2; a.y -= Math.sign(dy || 1) * push; b.y += Math.sign(dy || 1) * push; }
        }
      }
      projected.forEach(p => {
        const b = labels.current.get(p.id); if (!b) return;
        b.style.left = `${p.x}px`; b.style.top = `${p.y}px`; b.dataset.offscreen = String(p.offscreen);
        b.dataset.anchorX = String(p.anchorX); b.dataset.anchorY = String(p.anchorY);
        b.style.setProperty("--stem-length", `${Math.hypot(p.anchorX - p.x, p.anchorY - p.y)}px`);
        b.style.setProperty("--stem-angle", `${Math.atan2(p.anchorY - p.y, p.anchorX - p.x)}rad`);
      });
    }
    function frame(t: number) {
      raf = 0; if (disposed || contextLost || document.hidden || latest.current.paused) return;
      const state = latest.current, ambient = state.breeze && state.overview;
      // Idle ambient movement renders at 30 fps; direct manipulation and chapter
      // transitions retain the display refresh rate. Reduced motion stays idle.
      if (!urgent && ambient && !animating && !settling && last && t - last < 32) { raf = requestAnimationFrame(frame); return; }
      urgent = false; const interval = last ? t - last : 16, dt = Math.min(100, interval); last = t; elapsed += dt / 1000;
      if (animating && interval > 55 && interval < 250) slowFrames++; else slowFrames = Math.max(0, slowFrames - 1);
      if (slowFrames === 18) { renderer.setPixelRatio(.85); element.dataset.quality = "economy"; renderer.shadowMap.enabled = false; }
      if (previousView !== state.view) {
        sourcePosition = camera.position.clone(); sourceTarget = target.clone(); sourceSpan = span; from = t;
        duration = state.view === "room" && ["name", "notebook"].includes(previousView) ? 2000 : 1250;
        previousView = state.view; orbit = 0; zoom = 1; animating = true;
      }
      const desired = cameras[state.view], finish = skip !== state.skipToken || reduced.matches; skip = state.skipToken;
      if (animating) {
        const progress = finish ? 1 : Math.min(1, (t - from) / duration), eased = progress * progress * (3 - 2 * progress);
        camera.position.lerpVectors(sourcePosition, new THREE.Vector3(...desired.position), eased);
        target.lerpVectors(sourceTarget, new THREE.Vector3(...desired.target), eased); span = THREE.MathUtils.lerp(sourceSpan, desired.span, eased);
        if (progress === 1) animating = false;
      }
      const activeHover = focusedObject.current || hoverId;
      const noteGoal = state.view === "notebook" ? 1 : activeHover === "notebook" ? .12 : 0, cardGoal = state.cardOpen ? 1 : activeHover === "cards" ? .08 : 0;
      open = finish ? noteGoal : THREE.MathUtils.damp(open, noteGoal, 8, dt / 1000); card = finish ? cardGoal : THREE.MathUtils.damp(card, cardGoal, 8, dt / 1000);
      const flipGoal = state.view === "cards" && state.flipped ? 1 : 0;
      flip = finish ? flipGoal : THREE.MathUtils.damp(flip, flipGoal, 7, dt / 1000);
      room.animate(open, card, state.boardStep, state.review, activeHover, state.view === "monitor" ? state.agentStep : -1, flip, state.cardTheme);
      const lightGoal = state.timeOfDay === "dusk" ? 1 : 0; dusk = finish ? lightGoal : THREE.MathUtils.damp(dusk, lightGoal, 5, dt / 1000);
      room.setLight(dusk); scene.environmentIntensity = .55 - dusk * .18; renderer.toneMappingExposure = 1.02 - dusk * .07;
      const flying = room.garden.update(elapsed, dt / 1000, state.view, ambient, dusk, finish);
      if (Math.abs(open - shadowOpen) > .3 || Math.abs(card - shadowCard) > .3 || wasFlying && !flying) { renderer.shadowMap.needsUpdate = true; shadowOpen = open; shadowCard = card; }
      wasFlying = flying;
      const w = Math.max(1, element.clientWidth), h = Math.max(1, element.clientHeight); camera.aspect = w / h;
      // Horizontal coverage shrinks on narrow screens while the full garden fits vertically.
      const coverage = w <= 1000 && state.view === "room" ? span * .78 : span;
      const dist = coverage * zoom / (2 * Math.tan(THREE.MathUtils.degToRad(34 / 2)) * Math.min(camera.aspect, 1.4));
      const direction = camera.position.clone().sub(target).normalize(), pos = target.clone().addScaledVector(direction, dist);
      if (orbit) pos.sub(target).applyAxisAngle(new THREE.Vector3(0, 1, 0), orbit).add(target);
      const saved = camera.position.clone(); camera.position.copy(pos); camera.lookAt(target);
      const focusGoal = state.view === "room" ? 0 : 1; focusBlend = finish ? focusGoal : THREE.MathUtils.damp(focusBlend, focusGoal, 6, dt / 1000);
      if (focusBlend > .001) { if (w > 1000) camera.setViewOffset(w, h, w * .19 * focusBlend, 0, w, h); else camera.setViewOffset(w, h, 0, h * .13 * focusBlend, w, h); }
      else camera.clearViewOffset(); camera.updateProjectionMatrix(); camera.updateMatrixWorld();
      renderer.render(scene, camera); project(); camera.position.copy(saved);
      element.dataset.frames = String(++frames); element.dataset.drawCalls = String(renderer.info.render.calls); element.dataset.triangles = String(renderer.info.render.triangles);
      element.dataset.transition = String(animating); element.dataset.orbit = orbit.toFixed(3); element.dataset.zoom = zoom.toFixed(3); element.dataset.flying = String(flying); element.dataset.ambient = String(ambient);
      if (dirty) { dirty = false; setStatus("ready"); }
      settling = flying || Math.abs(focusBlend - focusGoal) > .002 || Math.abs(open - noteGoal) > .002 || Math.abs(card - cardGoal) > .002 || Math.abs(flip - flipGoal) > .002 || Math.abs(dusk - lightGoal) > .002;
      if (animating || settling || ambient) raf = requestAnimationFrame(frame);
    }
    function wake() { urgent = true; if (!raf && !disposed && !contextLost) { last = 0; raf = requestAnimationFrame(frame); } }
    trigger.current = wake;
    function resize() { renderer.setSize(element.clientWidth, element.clientHeight); wake(); }
    const ro = new ResizeObserver(resize); ro.observe(element);
    function hit(e: PointerEvent): ObjectId | "guide" | null {
      const r = element.getBoundingClientRect(); pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(pointer, camera);
      for (const f of ray.intersectObject(room.root, true)) for (let o: THREE.Object3D | null = f.object; o; o = o.parent) {
        if (o.userData.gardenGuide) return "guide";
        if (o.userData.objectId) return o.userData.objectId as ObjectId;
      }
      return null;
    }
    function pointerDistance() { const pair = [...pointers.values()]; return pair.length === 2 ? pair[0].distanceTo(pair[1]) : 0; }
    function move(e: PointerEvent) {
      if (pointers.has(e.pointerId)) pointers.set(e.pointerId, new THREE.Vector2(e.clientX, e.clientY));
      if (pinch && pointers.size === 2) { zoom = THREE.MathUtils.clamp(pinch.zoom * pinch.distance / Math.max(1, pointerDistance()), .8, 1.2); dragged = true; wake(); return; }
      if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 7) {
        dragged = true;
        if (latest.current.overview) { orbit = THREE.MathUtils.clamp(down.orbit + (e.clientX - down.x) / 700, -.55, .55); wake(); }
        return;
      }
      const found = hit(e), id = found === "guide" ? null : found;
      if (id !== hoverId) { hoverId = id; setHover(id); wake(); }
      renderer.domElement.style.cursor = found ? "pointer" : "grab";
    }
    function press(e: PointerEvent) {
      if (e.button !== 0) return;
      pointers.set(e.pointerId, new THREE.Vector2(e.clientX, e.clientY)); renderer.domElement.setPointerCapture(e.pointerId);
      if (pointers.size === 2 && latest.current.overview) { pinch = { distance: pointerDistance(), zoom }; dragged = true; }
      else if (pointers.size === 1) { down = { x: e.clientX, y: e.clientY, time: performance.now(), orbit }; dragged = false; }
    }
    function release(e: PointerEvent) {
      if (down && !dragged && performance.now() - down.time < 700) { const id = hit(e); if (id === "guide") latest.current.discover(); else if (id) latest.current.select(id); }
      pointers.delete(e.pointerId); if (renderer.domElement.hasPointerCapture(e.pointerId)) renderer.domElement.releasePointerCapture(e.pointerId);
      if (!pointers.size) { down = null; pinch = null; } else { dragged = true; pinch = null; down = null; }
    }
    function cancel() { pointers.clear(); down = null; pinch = null; hoverId = null; setHover(null); wake(); }
    function leave() { if (!pointers.size) { hoverId = null; setHover(null); wake(); } }
    function wheel(e: WheelEvent) { if (!latest.current.overview) return; e.preventDefault(); zoom = THREE.MathUtils.clamp(zoom * Math.exp(e.deltaY * .0008), .8, 1.2); wake(); }
    control.current = command => { if (command === "reset") { zoom = 1; orbit = 0; } else zoom = THREE.MathUtils.clamp(zoom + (command === "closer" ? -.1 : .1), .8, 1.2); wake(); };
    function motionPreference() { if (reduced.matches) setBreeze(false); wake(); }
    function lost(e: Event) { e.preventDefault(); contextLost = true; cancelAnimationFrame(raf); raf = 0; setStatus("fallback"); }
    const canvas = renderer.domElement;
    canvas.addEventListener("pointermove", move); canvas.addEventListener("pointerdown", press); canvas.addEventListener("pointerup", release); canvas.addEventListener("pointercancel", cancel); canvas.addEventListener("pointerleave", leave);
    canvas.addEventListener("wheel", wheel, { passive: false }); canvas.addEventListener("webglcontextlost", lost); document.addEventListener("visibilitychange", wake); reduced.addEventListener("change", motionPreference); resize();
    return () => {
      disposed = true; trigger.current = () => {}; control.current = () => {}; cancelAnimationFrame(raf); ro.disconnect();
      canvas.removeEventListener("pointermove", move); canvas.removeEventListener("pointerdown", press); canvas.removeEventListener("pointerup", release); canvas.removeEventListener("pointercancel", cancel); canvas.removeEventListener("pointerleave", leave);
      canvas.removeEventListener("wheel", wheel); canvas.removeEventListener("webglcontextlost", lost); document.removeEventListener("visibilitychange", wake); reduced.removeEventListener("change", motionPreference);
      room.dispose(); environment.dispose(); renderer.dispose(); canvas.remove();
    };
  }, [retry]);
  const focusObject = (id: ObjectId | null) => { focusedObject.current = id; setHover(id); trigger.current(); };
  return <div className="studio-scene" ref={host} data-status={status} data-view={view} data-time={timeOfDay} data-breeze={breeze} data-visited={visited.length}>
    {status === "loading" && <div className="studio-loading" role="status"><span className="studio-loader" />庭のあるスタジオへ…</div>}
    {status === "fallback" ? <div className="studio-fallback"><span>TEXT EDITION</span><h2>同じ物語を、ここから。</h2><p>3Dを表示できませんでした。全章と参考資料は、このままご覧いただけます。</p><button onClick={() => { const url = new URL(location.href); url.searchParams.delete("no3d"); history.replaceState(null, "", url); setStatus("loading"); setRetry(n => n + 1); }}>3Dを再読み込み</button><div>{objects.map(o => <button key={o.id} onClick={() => select(o.id)}>{o.title} ↗</button>)}</div></div> : <>
      <div className="studio-object-labels" aria-label="スタジオの物件">{objects.map((o, i) => <button ref={el => { if (el) labels.current.set(o.id, el); else labels.current.delete(o.id); }} key={o.id} data-object={o.id} data-selected={view === o.id} data-hovered={hover === o.id} data-next={o.chapter === chapter + 1} data-visited={visited.includes(o.id)} data-visible={view === "room" || view === o.id || hover === o.id} className="studio-object" onClick={() => select(o.id)} onFocus={() => focusObject(o.id)} onBlur={() => focusObject(null)} onPointerEnter={() => focusObject(o.id)} onPointerLeave={() => focusObject(null)} aria-label={`${o.title}を開く`}><i aria-hidden="true">{visited.includes(o.id) ? "✓" : String(i + 1).padStart(2, "0")}</i><span><small>{o.subtitle}</small>{o.title}<b>↗</b></span></button>)}</div>
      {overview && status === "ready" && <>
        <div className="garden-intro"><span>A PLACE FOR LITTLE IDEAS</span><h1>アイデアが育つ、<br />小さな場所。</h1><p>ものに触れて、私の制作をひとめぐり。</p></div>
        <div className="garden-controls" role="group" aria-label="庭の表示設定">
          <div className="garden-light" role="group" aria-label="時間帯"><button aria-label="昼の光" aria-pressed={timeOfDay === "day"} onClick={() => setTimeOfDay("day")}><span aria-hidden="true">☼</span>昼</button><button aria-label="夕暮れの光" aria-pressed={timeOfDay === "dusk"} onClick={() => setTimeOfDay("dusk")}><span aria-hidden="true">☾</span>夕暮れ</button></div>
          <button className="garden-breeze" aria-pressed={breeze} aria-label="庭の動き" onClick={() => setBreeze(v => !v)}><span aria-hidden="true">{breeze ? "Ⅱ" : "▷"}</span>{breeze ? "ひと休み" : "風を感じる"}</button>
          <div className="garden-camera" role="group" aria-label="全景のカメラ"><button aria-label="庭を縮小" onClick={() => control.current("farther")}>−</button><button aria-label="庭の視点を戻す" onClick={() => control.current("reset")}>⌖</button><button aria-label="庭を拡大" onClick={() => control.current("closer")}>＋</button></div>
        </div>
        <div className="garden-discovery"><button onClick={discover} aria-label={`小鳥と次の発見へ：${nextObject.title}`}><svg viewBox="0 0 40 40" aria-hidden="true"><path d="M8 24c0-8 6-13 14-12 0-6 9-7 11-1l5 3-5 2c-1 10-7 16-16 14l-8 3 2-6-7-6z" fill="currentColor" /><circle cx="29" cy="11" r="1.2" fill="#fff9df" /><path d="M13 19q3 8 12 3" fill="none" stroke="#fff9df" strokeWidth="1.5" /></svg><span><small>{visited.length === 7 ? "THANK YOU FOR EXPLORING" : "FOLLOW THE LITTLE BIRD"}</small>{visited.length === 7 ? "もう一度、ひとめぐり" : "次の発見へ"}<b>↗</b></span><em aria-live="polite" aria-label={`${visited.length} / 7 個を探索`}>{String(visited.length).padStart(2, "0")}<i>/ 07</i></em></button><p>ドラッグで回転 · スクロール / ピンチで拡大</p></div>
      </>}
    </>}
  </div>;
}
