"use client";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { buildRoom } from "./room";
import { cameras, objects, type ObjectId, type ViewId } from "./content";
import { presentationSize, projectSurface, SURFACE_SCALE } from "./projection";

type Props = { panels: {id:ViewId;content:ReactNode}[]; overview: boolean; view: ViewId; chapter: number; paused: boolean; boardStep: number; review: number; onSelect: (id: ObjectId) => void; skipToken: number; agentStep: number; };
const storyObjects=objects.filter(o=>o.chapter>=0);
type SceneCommand = "closer" | "farther" | "reset";

export default function StudioCanvas(props: Props) {
  const { view, onSelect, overview } = props;
  const host = useRef<HTMLDivElement>(null), presentations = useRef(new Map<ViewId, HTMLDivElement>()), labels = useRef(new Map<ObjectId, HTMLButtonElement>());
  const trigger = useRef<() => void>(() => {}), control = useRef<(command: SceneCommand) => void>(() => {});
  const focusedObject = useRef<ObjectId | null>(null);
  const [status, setStatus] = useState("loading"), [retry, setRetry] = useState(0), [hover, setHover] = useState<ObjectId | null>(null);
  const [timeOfDay, setTimeOfDay] = useState<"day" | "dusk">("day"), [breeze, setBreeze] = useState(false);
  const [sunAngle,setSunAngle]=useState(0);
  const [visited, setVisited] = useState<ObjectId[]>([]), [stored, setStored] = useState(false);
  const visit = useCallback((id: ObjectId) => {if(id!=="library")setVisited(old => old.includes(id) ? old : [...old,id]);}, []);
  const select = useCallback((id: ObjectId) => { visit(id); onSelect(id); }, [onSelect, visit]);
  const nextObject = storyObjects.find(o => !visited.includes(o.id)) || storyObjects[0];
  const discover = useCallback(() => { if (visited.length === storyObjects.length) setVisited([]); select(nextObject.id); }, [visited.length, select, nextObject.id]);
  const latest = useRef({ ...props, timeOfDay, breeze, sunAngle, select, discover });
  useEffect(() => {
    const init = requestAnimationFrame(() => {
      try {
        const saved: unknown = JSON.parse(sessionStorage.getItem("studio-garden-visits-v2") || "[]");
        if (Array.isArray(saved)) setVisited([...new Set(saved.filter((id): id is ObjectId => storyObjects.some(o => o.id === id)))]);
      } catch { /* Exploration also works when storage is disabled. */ }
      setStored(true);
    });
    return () => cancelAnimationFrame(init);
  }, []);
  useEffect(() => { if (stored) try { sessionStorage.setItem("studio-garden-visits-v2", JSON.stringify(visited)); } catch { /* Optional session memory. */ } }, [stored, visited]);
  useEffect(() => {
    if (view === "room") return;
    const id = requestAnimationFrame(() => visit(view)); return () => cancelAnimationFrame(id);
  }, [view, visit]);
  useLayoutEffect(() => { if(host.current)host.current.dataset.transition="true"; presentations.current.forEach(page=>{page.inert=true;page.dataset.interactive="false";}); }, [view]);
  useLayoutEffect(() => { latest.current = { ...props, timeOfDay, breeze, sunAngle, select, discover }; trigger.current(); }, [props, timeOfDay, breeze, sunAngle, select, discover]);
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
    let raf = 0, last = 0, elapsed = 0, urgent = true, dirty = true, from = 0, duration = 850, animating = false, settling = false, disposed = false, contextLost = false, boot = true, resized = false;
    let open = 0, dusk = 0, orbit = 0, zoom = 1, lightAngle = 0;
    const overviewPose={orbit:0,zoom:1};
    const sourcePosition = camera.position.clone(), sourceQuaternion = camera.quaternion.clone();
    let skip = latest.current.skipToken, shadowOpen = -1, slowFrames = 0, wasFlying = false, wasFitting = false;
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
        duration = resized ? 450 : 850;
        if(previousView==="room"){overviewPose.orbit=orbit;overviewPose.zoom=zoom;}
        orbit=state.view==="room"?overviewPose.orbit:0;zoom=state.view==="room"?overviewPose.zoom:1;
        previousView = state.view; animating = !boot; resized = false;
      }
      const activeHover = focusedObject.current || hoverId;
      const noteGoal = state.view === "notebook" || state.view === "name" ? 1 : .88;
      open = finish || boot ? noteGoal : THREE.MathUtils.damp(open, noteGoal, 6, dt / 1000);
      room.animate(open, state.boardStep, state.review, activeHover, state.view === "monitor" ? state.agentStep : -1);
      const fitting = room.fitSurfaces(state.view, size.width / size.height, dt / 1000, finish || boot);
      const lightGoal = state.timeOfDay === "dusk" ? 1 : 0; dusk = finish ? lightGoal : THREE.MathUtils.damp(dusk, lightGoal, 5, dt / 1000);
      if(lightAngle!==state.sunAngle){renderer.shadowMap.needsUpdate=true;lightAngle=state.sunAngle;}
      room.setLight(dusk,state.sunAngle,elapsed,ambient); scene.environmentIntensity = .55 - dusk * .18; renderer.toneMappingExposure = 1.13 - dusk * .14;
      const flying = room.garden.update(elapsed, dt / 1000, state.view, ambient, dusk, finish);
      room.garden.bird.visible = state.overview;
      if (Math.abs(open - shadowOpen) > .3 || wasFlying && !flying || wasFitting && !fitting) { renderer.shadowMap.needsUpdate = true; shadowOpen = open; }
      wasFlying = flying; wasFitting = fitting;
      const surface = room.surfaces[state.view];
      destination.up.set(0,1,0);
      if (surface) {
        const center = surface.face.getWorldPosition(new THREE.Vector3());
        const orientation = surface.face.getWorldQuaternion(new THREE.Quaternion());
        const normal = new THREE.Vector3(0,0,1).applyQuaternion(orientation), up = new THREE.Vector3(0,1,0).applyQuaternion(orientation);
        const physicalHeight = surface.height * surface.face.getWorldScale(new THREE.Vector3()).y;
        const distance = physicalHeight * h / (2 * (size.height / SURFACE_SCALE) * Math.tan(THREE.MathUtils.degToRad(17)));
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
        const eased=progress*progress*progress*(progress*(progress*6-15)+10);
        camera.position.lerpVectors(sourcePosition,destination.position,eased); camera.quaternion.slerpQuaternions(sourceQuaternion,destination.quaternion,eased);
        if(progress===1)animating=false;
      } else { camera.position.copy(destination.position); camera.quaternion.copy(destination.quaternion); }
      camera.aspect=w/h;camera.updateProjectionMatrix();camera.updateMatrixWorld();
      renderer.render(scene,camera); project();
      // Every page exists in the room before a camera move; no arrival-time swap.
      presentations.current.forEach((page,id)=>{
        const target=room.surfaces[id];
        const normal=target?new THREE.Vector3(0,0,1).applyQuaternion(target.face.getWorldQuaternion(new THREE.Quaternion())):null;
        const center=target?.face.getWorldPosition(new THREE.Vector3());
        const facing=normal&&center&&normal.dot(camera.position.clone().sub(center))>0;
        const placed=target&&facing?projectSurface(page,target.face,target.width,target.height,camera,w,h,size.width,size.height):false;
        const active=id===state.view&&!state.overview,interactive=!!placed&&active&&!animating;
        const detail=finish||boot?(active?1:0):THREE.MathUtils.damp(Number(page.dataset.detail||0),active?1:0,9,dt/1000);
        page.dataset.detail=String(detail);page.style.setProperty("--surface-detail",String(detail>.998?1:detail<.002?0:detail));
        page.dataset.visible=String(!!placed);page.dataset.interactive=String(interactive);page.dataset.hover=String(state.overview&&activeHover===id);
        page.inert=!interactive;page.setAttribute("aria-hidden",String(!interactive));
        page.style.zIndex=active?"7":String(Math.max(2,6-Math.floor(camera.position.distanceTo(center||camera.position)/3)));
        if(interactive&&(boot||element.dataset.transition==="true"))page.querySelector<HTMLElement>("h1")?.focus({preventScroll:true});
      });
      element.dataset.frames=String(++frames);element.dataset.drawCalls=String(renderer.info.render.calls);element.dataset.triangles=String(renderer.info.render.triangles);
      element.dataset.transition=String(animating);element.dataset.orbit=orbit.toFixed(3);element.dataset.zoom=zoom.toFixed(3);element.dataset.flying=String(flying);element.dataset.ambient=String(ambient);
      element.dataset.cameraPosition=camera.position.toArray().map(v=>v.toFixed(4)).join(",");
      if(dirty){dirty=false;setStatus("ready");}boot=false;
      settling=fitting||flying||Math.abs(open-noteGoal)>.002||Math.abs(dusk-lightGoal)>.002;
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
  useEffect(() => { if(status==="fallback"){if(host.current)host.current.dataset.transition="false";presentations.current.forEach((page,id)=>{const active=id===view;page.inert=!active;page.dataset.visible=String(active);page.dataset.interactive=String(active);page.setAttribute("aria-hidden",String(!active));});} },[status,view]);
  const focusObject = (id: ObjectId | null) => { focusedObject.current = id; setHover(id); trigger.current(); };
  return <div className="studio-scene" ref={host} data-status={status} data-view={view} data-time={timeOfDay} data-breeze={breeze} data-visited={visited.length} data-sun-angle={sunAngle}>
    {props.panels.map(panel=><div key={panel.id} className="studio-surface-host" ref={el=>{if(el)presentations.current.set(panel.id,el);else presentations.current.delete(panel.id);}} data-kind={panel.id} data-active={!overview&&view===panel.id} data-visible="false" data-interactive="false" aria-hidden={overview||view!==panel.id} inert={overview||view!==panel.id}>{panel.content}</div>)}
    {status === "loading" && <div className="studio-loading" role="status"><span className="studio-loader" />庭のあるスタジオへ…</div>}
    {status === "fallback" ? <div className={`studio-fallback ${overview?"":"studio-fallback-compact"}`}><span>TEXT EDITION</span>{overview&&<h2>同じ物語を、ここから。</h2>}<p>3Dを表示できませんでした。内容と操作は、このまま使えます。</p><button onClick={() => { const url = new URL(location.href); url.searchParams.delete("no3d"); history.replaceState(null, "", url); setStatus("loading"); setRetry(n => n + 1); }}>3Dを再読み込み</button><div hidden={!overview}>{objects.map(o => <button key={o.id} onClick={() => select(o.id)}>{o.title} ↗</button>)}</div></div> : <>
      <div className="studio-object-labels" aria-label="スタジオの物件">{objects.map(o => <button ref={el => { if (el) labels.current.set(o.id, el); else labels.current.delete(o.id); }} key={o.id} data-object={o.id} data-selected={view === o.id} data-hovered={hover === o.id} data-visited={visited.includes(o.id)} data-visible={view === "room" || view === o.id || hover === o.id} className="studio-object" onClick={() => select(o.id)} onFocus={() => focusObject(o.id)} onBlur={() => focusObject(null)} onPointerEnter={() => focusObject(o.id)} onPointerLeave={() => focusObject(null)} aria-label={`${o.title}を開く`}><span>{o.title}<b aria-hidden="true">↗</b></span></button>)}</div>
      {overview && status === "ready" && <>
        <button className="garden-start" onClick={()=>{setVisited([]);select("name");}}>はじめる <span aria-hidden="true">↗</span></button>
        <details className="environment-menu"><summary aria-label="環境設定"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.4 1.4m11.2 11.2L19 19M5 19l1.4-1.4M17.6 6.4L19 5"/></svg></summary><div className="environment-panel"><span>SCENE SETTINGS</span><div className="environment-light" role="group" aria-label="時間帯"><button aria-label="昼の光" aria-pressed={timeOfDay==="day"} onClick={()=>setTimeOfDay("day")}>昼</button><button aria-label="夕暮れの光" aria-pressed={timeOfDay==="dusk"} onClick={()=>setTimeOfDay("dusk")}>夕暮れ</button></div><button className="environment-motion" aria-label="庭の動き" aria-pressed={breeze} onClick={()=>setBreeze(v=>!v)}>植物・小鳥の動き <b>{breeze?"ON":"OFF"}</b></button><label>光の方向 <output>{sunAngle}°</output><input type="range" min="-45" max="45" value={sunAngle} aria-label="光の方向" onChange={e=>setSunAngle(Number(e.target.value))}/></label><div className="garden-camera-tools" role="group" aria-label="全景のカメラ"><button aria-label="庭を縮小" onClick={()=>control.current("farther")}>−</button><button aria-label="庭の視点を戻す" onClick={()=>control.current("reset")}>視点を戻す</button><button aria-label="庭を拡大" onClick={()=>control.current("closer")}>＋</button></div></div></details>

      </>}
    </>}
  </div>;
}
