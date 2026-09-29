"use client";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { buildRoom } from "./room";
import { cameras, objects, type ObjectId, type ViewId } from "./content";
import { presentationSize, projectSurface } from "./projection";

type Props = { children: ReactNode; overview: boolean; view: ViewId; chapter: number; paused: boolean; cardOpen: boolean; boardStep: number; review: number; onSelect: (id: ObjectId) => void; skipToken: number; agentStep: number; flipped: boolean; cardTheme: number };
type SceneCommand = "closer" | "farther" | "reset";

export default function StudioCanvas(props: Props) {
  const { view, chapter, onSelect, overview } = props;
  const host = useRef<HTMLDivElement>(null), presentation = useRef<HTMLDivElement>(null), labels = useRef(new Map<ObjectId, HTMLButtonElement>());
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
  useLayoutEffect(() => { if(presentation.current){presentation.current.dataset.visible="false";presentation.current.inert=true;} }, [view]);
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
    const camera = new THREE.PerspectiveCamera(34, 1, .01, 80);
    let previousView: ViewId = latest.current.view;
    let raf = 0, last = 0, elapsed = 0, urgent = true, dirty = true, from = 0, duration = 1500, animating = false, settling = false, disposed = false, contextLost = false, boot = true, resized = false;
    let open = 0, card = 0, flip = 0, dusk = 0, orbit = 0, zoom = 1;
    const sourcePosition = camera.position.clone(), sourceQuaternion = camera.quaternion.clone();
    let skip = latest.current.skipToken, shadowOpen = -1, shadowCard = -1, slowFrames = 0, wasFlying = false, wasFitting = false;
    const destination = new THREE.PerspectiveCamera(34, 1, .01, 80);
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
      if (!urgent && ambient && !animating && !settling && last && t - last < 32) { raf = requestAnimationFrame(frame); return; }
      urgent = false; const interval = last ? t - last : 16, dt = Math.min(100, interval); last = t; elapsed += dt / 1000;
      if (animating && interval > 55 && interval < 250) slowFrames++; else slowFrames = Math.max(0, slowFrames - 1);
      if (slowFrames === 18) { renderer.setPixelRatio(.85); element.dataset.quality = "economy"; renderer.shadowMap.enabled = false; }
      const w = Math.max(1, element.clientWidth), h = Math.max(1, element.clientHeight), size = presentationSize(w, h);
      const finish = skip !== state.skipToken || reduced.matches; skip = state.skipToken;
      if (previousView !== state.view || resized) {
        sourcePosition.copy(camera.position); sourceQuaternion.copy(camera.quaternion); from = t;
        duration = resized ? 550 : state.view === "room" ? 1700 : 1500;
        previousView = state.view; orbit = 0; zoom = 1; animating = !boot; resized = false;
      }
      const activeHover = focusedObject.current || hoverId;
      const noteGoal = state.view === "notebook" ? 1 : activeHover === "notebook" ? .12 : 0;
      // The selected lid is the interactive page itself; its HTML card performs
      // the reveal, while the physical presentation plane remains steady.
      const cardGoal = state.view === "cards" ? 0 : state.cardOpen ? 1 : activeHover === "cards" ? .08 : 0;
      open = finish || boot ? noteGoal : THREE.MathUtils.damp(open, noteGoal, 8, dt / 1000);
      card = finish || boot ? cardGoal : THREE.MathUtils.damp(card, cardGoal, 8, dt / 1000);
      const flipGoal = state.view === "cards" && state.flipped ? 1 : 0;
      flip = finish ? flipGoal : THREE.MathUtils.damp(flip, flipGoal, 7, dt / 1000);
      room.animate(open, card, state.boardStep, state.review, activeHover, state.view === "monitor" ? state.agentStep : -1, flip, state.cardTheme);
      const fitting = room.fitSurfaces(state.view, size.width / size.height, dt / 1000, finish || boot);
      const lightGoal = state.timeOfDay === "dusk" ? 1 : 0; dusk = finish ? lightGoal : THREE.MathUtils.damp(dusk, lightGoal, 5, dt / 1000);
      room.setLight(dusk); scene.environmentIntensity = .55 - dusk * .18; renderer.toneMappingExposure = 1.02 - dusk * .07;
      const flying = room.garden.update(elapsed, dt / 1000, state.view, ambient, dusk, finish);
      room.garden.bird.visible = state.overview;
      if (Math.abs(open - shadowOpen) > .3 || Math.abs(card - shadowCard) > .3 || wasFlying && !flying || wasFitting && !fitting) { renderer.shadowMap.needsUpdate = true; shadowOpen = open; shadowCard = card; }
      wasFlying = flying; wasFitting = fitting;
      const surface = room.surfaces[state.view];
      destination.up.set(0,1,0);
      if (surface) {
        const center = surface.face.getWorldPosition(new THREE.Vector3());
        const orientation = surface.face.getWorldQuaternion(new THREE.Quaternion());
        const normal = new THREE.Vector3(0,0,1).applyQuaternion(orientation), up = new THREE.Vector3(0,1,0).applyQuaternion(orientation);
        const physicalHeight = surface.height * surface.face.getWorldScale(new THREE.Vector3()).y;
        const distance = physicalHeight * h / (2 * size.height * Math.tan(THREE.MathUtils.degToRad(17)));
        destination.position.copy(center).addScaledVector(normal,distance); destination.up.copy(up); destination.lookAt(center);
      } else {
        const preset=cameras[state.view], target=new THREE.Vector3(...preset.target);
        const coverage=w<=1000&&state.view==="room"?preset.span*.78:preset.span;
        const distance=coverage*zoom/(2*Math.tan(THREE.MathUtils.degToRad(17))*Math.min(w/h,1.4));
        const direction=new THREE.Vector3(...preset.position).sub(target).normalize().applyAxisAngle(new THREE.Vector3(0,1,0),orbit);
        destination.position.copy(target).addScaledVector(direction,distance); destination.lookAt(target);
      }
      let progress=1;
      if (animating) {
        progress=finish?1:Math.min(1,(t-from)/duration);
        const eased=progress*progress*(3-2*progress);
        camera.position.lerpVectors(sourcePosition,destination.position,eased); camera.quaternion.slerpQuaternions(sourceQuaternion,destination.quaternion,eased);
        if(progress===1)animating=false;
      } else { camera.position.copy(destination.position); camera.quaternion.copy(destination.quaternion); }
      camera.aspect=w/h; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
      renderer.render(scene,camera); project();
      const page=presentation.current;
      if(page) {
        const visible=!!surface&&!state.overview&&!animating;
        if(surface)projectSurface(page,surface.face,surface.width,surface.height,camera,w,h,size.width,size.height);
        page.dataset.visible=String(visible);page.inert=!visible;page.setAttribute("aria-hidden",String(!visible));
        if(visible && (boot || element.dataset.transition==="true")) page.querySelector<HTMLElement>("h1")?.focus({preventScroll:true});
      }
      element.dataset.frames=String(++frames);element.dataset.drawCalls=String(renderer.info.render.calls);element.dataset.triangles=String(renderer.info.render.triangles);
      element.dataset.transition=String(animating);element.dataset.orbit=orbit.toFixed(3);element.dataset.zoom=zoom.toFixed(3);element.dataset.flying=String(flying);element.dataset.ambient=String(ambient);
      element.dataset.cameraPosition=camera.position.toArray().map(v=>v.toFixed(4)).join(",");
      if(dirty){dirty=false;setStatus("ready");}boot=false;
      settling=fitting||flying||Math.abs(open-noteGoal)>.002||Math.abs(card-cardGoal)>.002||Math.abs(flip-flipGoal)>.002||Math.abs(dusk-lightGoal)>.002;
      if(animating||settling||ambient)raf=requestAnimationFrame(frame);
    }
    function wake() { urgent = true; if (!raf && !disposed && !contextLost) { last = 0; raf = requestAnimationFrame(frame); } }
    trigger.current = wake;
    function resize() { renderer.setSize(element.clientWidth, element.clientHeight); resized = !boot; wake(); }
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
  useEffect(() => { if(status==="fallback"&&presentation.current){presentation.current.inert=false;presentation.current.setAttribute("aria-hidden","false");} },[status,view]);
  const focusObject = (id: ObjectId | null) => { focusedObject.current = id; setHover(id); trigger.current(); };
  return <div className="studio-scene" ref={host} data-status={status} data-view={view} data-time={timeOfDay} data-breeze={breeze} data-visited={visited.length}>
    <div className="studio-surface-host" ref={presentation} data-kind={view} data-visible="false">{!overview && props.children}</div>
    {status === "loading" && <div className="studio-loading" role="status"><span className="studio-loader" />庭のあるスタジオへ…</div>}
    {status === "fallback" ? <div className={`studio-fallback ${overview?"":"studio-fallback-compact"}`}><span>TEXT EDITION</span>{overview&&<h2>同じ物語を、ここから。</h2>}<p>3Dを表示できませんでした。内容と操作は、このまま使えます。</p><button onClick={() => { const url = new URL(location.href); url.searchParams.delete("no3d"); history.replaceState(null, "", url); setStatus("loading"); setRetry(n => n + 1); }}>3Dを再読み込み</button><div hidden={!overview}>{objects.map(o => <button key={o.id} onClick={() => select(o.id)}>{o.title} ↗</button>)}</div></div> : <>
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
