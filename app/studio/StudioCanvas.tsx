"use client";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { buildRoom } from "./room";
import { useStudioWeather } from "./useStudioWeather";
import EnvironmentMenu from "./EnvironmentMenu";
import { cameras, objects, physicalObject, type ObjectId, type ViewId } from "./content";
import { presentationSize, projectSurface, SURFACE_SCALE } from "./projection";

type Props = { panels: {id:ViewId;content:ReactNode}[]; overview: boolean; view: ViewId; chapter: number; paused: boolean; boardStep: number; review: number; onSelect: (id: ObjectId) => void; agentStep: number; };
const storyObjects=objects.filter(o=>o.chapter>=0);
type SceneCommand = "closer" | "farther" | "reset";

export default function StudioCanvas(props: Props) {
  const { view, onSelect, overview } = props;
  const host = useRef<HTMLDivElement>(null), presentations = useRef(new Map<ViewId, HTMLDivElement>()), labels = useRef(new Map<ObjectId, HTMLButtonElement>());
  const trigger = useRef<() => void>(() => {}), control = useRef<(command: SceneCommand) => void>(() => {});
  const focusedObject = useRef<ObjectId | null>(null);
  const [status, setStatus] = useState("loading"), [retry, setRetry] = useState(0), [hover, setHover] = useState<ObjectId | null>(null);
  const weatherState=useStudioWeather(),environmentState=weatherState.environment;
  const [breeze,setBreeze]=useState(true);
  const [visited, setVisited] = useState<ObjectId[]>([]), [stored, setStored] = useState(false);
  const visit = useCallback((id: ObjectId) => {if(id!=="library")setVisited(old => old.includes(id) ? old : [...old,id]);}, []);
  const select = useCallback((id: ObjectId) => { visit(id); onSelect(id); }, [onSelect, visit]);
  const latest = useRef({ ...props, environmentState, breeze, select });
  useEffect(() => {
    const init = requestAnimationFrame(() => {
      try {
        const saved: unknown = JSON.parse(sessionStorage.getItem("studio-garden-visits-v2") || "[]");
        if (Array.isArray(saved)) setVisited([...new Set(saved.filter((id): id is ObjectId => storyObjects.some(o => o.id === id)))]);
      } catch { /* Exploration also works when storage is disabled. */ }
      if(matchMedia("(prefers-reduced-motion: reduce)").matches)setBreeze(false);
      setStored(true);
    });
    return () => cancelAnimationFrame(init);
  }, []);
  useEffect(() => { if (stored) try { sessionStorage.setItem("studio-garden-visits-v2", JSON.stringify(visited)); } catch { /* Optional session memory. */ } }, [stored, visited]);
  useEffect(() => {
    if (view === "room") return;
    const id = requestAnimationFrame(() => visit(physicalObject(view) as ObjectId)); return () => cancelAnimationFrame(id);
  }, [view, visit]);
  useLayoutEffect(() => { if(host.current)host.current.dataset.transition="true"; presentations.current.forEach(page=>{page.inert=true;page.dataset.interactive="false";}); }, [view]);
  useLayoutEffect(() => { latest.current = { ...props, environmentState, breeze, select }; trigger.current(); }, [props, environmentState, breeze, select]);
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
    let raf = 0, last = 0, elapsed = 0, urgent = true, dirty = true, from = 0, duration = 1800, animating = false, settling = false, disposed = false, contextLost = false, boot = true, resized = false;
    let inspecting = false;
    let orbit = 0, zoom = 1, lastEnvironment = "", lastShadow = -1;
    const books={name:0,notebook:0},sourceBooks={...books};
    const overviewPose={orbit:0,zoom:1};
    const sourcePosition = camera.position.clone(), focus=new THREE.Vector3(),sourceFocus=new THREE.Vector3(),sourceUp=new THREE.Vector3(0,1,0),destinationFocus=new THREE.Vector3();
    let shadowOpen = -1, slowFrames = 0, wasFitting = false;
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
      const state = latest.current, ambient = state.breeze && state.overview && !reduced.matches;
      if (!urgent && ambient && !animating && !settling && last && t - last < 32) { raf = requestAnimationFrame(frame); return; }
      urgent = false; const interval = last ? t - last : 16, dt = Math.min(100, interval); last = t; elapsed += dt / 1000;
      if (animating && interval > 55 && interval < 250) slowFrames++; else slowFrames = Math.max(0, slowFrames - 1);
      if (slowFrames === 18) { renderer.setPixelRatio(.85); element.dataset.quality = "economy"; renderer.shadowMap.enabled = false; }
      const w = Math.max(1, element.clientWidth), h = Math.max(1, element.clientHeight), size = presentationSize(w, h);
      const finish = reduced.matches;
      if (physicalObject(previousView) !== physicalObject(state.view) || resized) {
        sourcePosition.copy(camera.position); sourceFocus.copy(focus);sourceUp.copy(camera.up);Object.assign(sourceBooks,books);from = t;
        inspecting=!resized&&state.view==="checklist";
        duration = resized ? 600 : state.view === "checklist" ? 3400 : 2000;
        if(previousView==="room"){overviewPose.orbit=orbit;overviewPose.zoom=zoom;}
        orbit=state.view==="room"?overviewPose.orbit:0;zoom=state.view==="room"?overviewPose.zoom:1;
        previousView = state.view; animating = !boot; resized = false;
      }
      const activeHover = focusedObject.current || hoverId;
      const progress=finish||boot||!animating?1:Math.min(1,(t-from)/duration);
      const smooth=(v:number)=>{const x=THREE.MathUtils.clamp(v,0,1);return x*x*x*(x*(x*6-15)+10);};
      const bookProgress=smooth((progress-.12)/.80);
      for(const id of ["name","notebook"] as const)books[id]=THREE.MathUtils.lerp(sourceBooks[id],physicalObject(state.view)===id?1:0,bookProgress);
      room.animate(books.name, state.view === "monitor" ? state.agentStep : -1);
      const hologramReveal=state.view==="checklist"?(inspecting?smooth((progress-.68)/.32):1):0;
      const fitting = room.fitSurfaces(state.view,dt/1000,finish||boot,ambient,hologramReveal);
      const night=room.setEnvironment(state.environmentState,dt/1000,ambient);
      scene.environmentIntensity=.12+(1-night)*.43;renderer.toneMappingExposure=1.08;
      const environmentKey=JSON.stringify(state.environmentState);
      if(environmentKey!==lastEnvironment||(ambient&&elapsed-lastShadow>.12)){renderer.shadowMap.needsUpdate=true;lastEnvironment=environmentKey;lastShadow=elapsed;}
      const flying=room.garden.update(dt/1000,ambient,night);
      const opening=books.name+books.notebook;
      if (animating || Math.abs(opening - shadowOpen) > .05 || wasFitting && !fitting) { renderer.shadowMap.needsUpdate = true; shadowOpen = opening; }
      wasFitting = fitting;
      const surface = room.readingFrame(state.view);
      destination.up.set(0,1,0);
      if (surface) {
        const {center,normal,up}=surface;
        const physicalHeight = surface.height;
        const distance = physicalHeight * h / (2 * (size.height / SURFACE_SCALE) * Math.tan(THREE.MathUtils.degToRad(17)));
        destination.position.copy(center).addScaledVector(normal,distance); destination.up.copy(up);destinationFocus.copy(center);
      } else {
        const preset=cameras[state.view], target=new THREE.Vector3(...preset.target);
        const coverage=w<=1000&&state.view==="room"?preset.span*.78:preset.span;
        const distance=coverage*zoom/(2*Math.tan(THREE.MathUtils.degToRad(17))*Math.min(w/h,1.4));
        const direction=new THREE.Vector3(...preset.position).sub(target).normalize().applyAxisAngle(new THREE.Vector3(0,1,0),orbit);
        destination.position.copy(target).addScaledVector(direction,distance);destinationFocus.copy(target);
      }
      if (animating) {
        const eased=smooth(progress);
        if(state.view==="checklist"&&inspecting){
          const arrival=smooth(progress/.58),unfold=smooth((progress-.68)/.32);
          const inspection=room.hologram.focus.clone().add(new THREE.Vector3(-.43,.45,1.18));
          camera.position.lerpVectors(sourcePosition,inspection,arrival).lerp(destination.position,unfold);
          focus.lerpVectors(sourceFocus,room.hologram.focus,smooth(progress/.48)).lerp(destinationFocus,unfold);
          camera.up.lerpVectors(sourceUp,new THREE.Vector3(0,1,0),arrival).lerp(destination.up,unfold).normalize();
        }else{
          camera.position.lerpVectors(sourcePosition,destination.position,eased);
          focus.lerpVectors(sourceFocus,destinationFocus,smooth(progress*1.35));
          camera.up.lerpVectors(sourceUp,destination.up,eased).normalize();
        }
        if(progress===1)animating=false;
      } else { camera.position.copy(destination.position);focus.copy(destinationFocus);camera.up.copy(destination.up); }
      camera.lookAt(focus);
      camera.aspect=w/h;camera.updateProjectionMatrix();camera.updateMatrixWorld();
      renderer.render(scene,camera); project();
      // Every page exists in the room before a camera move; no arrival-time swap.
      presentations.current.forEach((page,id)=>{
        const target=room.surfaces[id];
        const normal=target?new THREE.Vector3(0,0,1).applyQuaternion(target.face.getWorldQuaternion(new THREE.Quaternion())):null;
        const center=target?.face.getWorldPosition(new THREE.Vector3());
        const facing=normal&&center&&normal.dot(camera.position.clone().sub(center))>0;
        const bookOpen=id==="name"?books.name:id==="notebook"?books.name:id==="checklist"?room.hologram.open:1;
        const reveal=smooth((bookOpen-.55)/.35);
        const active=id===state.view&&!state.overview;
        const aliasHidden=state.overview?(id==="notebook"||id==="board"):!active&&physicalObject(id)===physicalObject(state.view);
        const placed=target&&!aliasHidden&&facing&&reveal>0?projectSurface(page,target.face,target.width,target.height,camera,w,h,size.width,size.height):false;
        const interactive=!!placed&&active&&!animating&&(id!=="checklist"||room.hologram.open>.99);
        // Inactive HTML summaries fade with the approach, so distant poster text
        // cannot loom behind a close reading plane. The physical models remain.
        page.style.opacity=String((aliasHidden?0:1)*reveal*(state.overview||active?1:1-smooth(progress*1.5)));
        const detail=finish||boot||!animating?(active?1:0):THREE.MathUtils.damp(Number(page.dataset.detail||0),active?1:0,9,dt/1000);
        page.dataset.detail=String(detail);page.style.setProperty("--surface-detail",String(detail>.998?1:detail<.002?0:detail));
        page.dataset.visible=String(!!placed);page.dataset.interactive=String(interactive);page.dataset.hover=String(state.overview&&activeHover===id);
        page.inert=!interactive;page.setAttribute("aria-hidden",String(!interactive));
        page.style.zIndex=active?"7":String(Math.max(2,6-Math.floor(camera.position.distanceTo(center||camera.position)/3)));
        if(interactive&&(boot||element.dataset.transition==="true"))page.querySelector<HTMLElement>("h1")?.focus({preventScroll:true});
      });
      element.dataset.frames=String(++frames);element.dataset.drawCalls=String(renderer.info.render.calls);element.dataset.triangles=String(renderer.info.render.triangles);
      element.dataset.transition=String(animating);element.dataset.orbit=orbit.toFixed(3);element.dataset.zoom=zoom.toFixed(3);element.dataset.flying=String(flying);element.dataset.ambient=String(ambient);
      element.dataset.cameraPosition=camera.position.toArray().map(v=>v.toFixed(4)).join(",");
      element.dataset.cameraFocus=focus.toArray().map(v=>v.toFixed(4)).join(",");element.dataset.bookOpen=JSON.stringify(books);element.dataset.flightProgress=String(progress);
      element.dataset.clockTime=room.clock.userData.time;
      element.dataset.hologramPhase=state.view!=="checklist"?"idle":progress<.58?"approach":progress<.68?"focus":room.hologram.open<.99?"unfold":"ready";
      element.dataset.birdPosition=room.garden.bird.position.toArray().map(v=>v.toFixed(3)).join(",");element.dataset.life=JSON.stringify(room.life.snapshot());element.dataset.projectorScale=room.hologram.base.scale.toArray().join(",");element.dataset.hologram=room.hologram.open.toFixed(3);element.dataset.sunDirection=room.sun.position.clone().normalize().toArray().map(v=>v.toFixed(4)).join(",");
      element.dataset.gazeOffset=destinationFocus.clone().project(camera).toArray().slice(0,2).map(v=>v.toFixed(5)).join(",");
      if(dirty){dirty=false;setStatus("ready");}boot=false;
      settling=fitting;
      if(animating||settling||ambient)raf=requestAnimationFrame(frame);
    }
    function wake() { urgent = true; if (!raf && !disposed && !contextLost) { last = 0; raf = requestAnimationFrame(frame); } }
    trigger.current = wake;
    function resize() { renderer.setSize(element.clientWidth, element.clientHeight); resized = !boot; wake(); }
    const ro = new ResizeObserver(resize); ro.observe(element);
    const clockTick=setInterval(()=>{if(room.clock.userData.time?.slice(0,5)!==new Date().toTimeString().slice(0,5))wake();},1000);
    function hit(e: PointerEvent): ObjectId | null {
      const r = element.getBoundingClientRect(); pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(pointer, camera);
      for (const f of ray.intersectObject(room.root, true)) for (let o: THREE.Object3D | null = f.object; o; o = o.parent) {
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
      const found=hit(e),id=found;
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
      if (down && !dragged && performance.now() - down.time < 700) { const id = hit(e); if (id) latest.current.select(id); }
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
      disposed = true; trigger.current = () => {}; control.current = () => {}; cancelAnimationFrame(raf); ro.disconnect();clearInterval(clockTick);
      canvas.removeEventListener("pointermove", move); canvas.removeEventListener("pointerdown", press); canvas.removeEventListener("pointerup", release); canvas.removeEventListener("pointercancel", cancel); canvas.removeEventListener("pointerleave", leave);
      canvas.removeEventListener("wheel", wheel); canvas.removeEventListener("webglcontextlost", lost); document.removeEventListener("visibilitychange", wake); reduced.removeEventListener("change", motionPreference);
      room.dispose(); environment.dispose(); renderer.dispose(); canvas.remove();
    };
  }, [retry]);
  useEffect(() => { if(status==="fallback"){if(host.current)host.current.dataset.transition="false";presentations.current.forEach((page,id)=>{const active=id===view;page.style.opacity="1";page.inert=!active;page.dataset.visible=String(active);page.dataset.interactive=String(active);page.setAttribute("aria-hidden",String(!active));});} },[status,view]);
  const focusObject = (id: ObjectId | null) => { focusedObject.current = id; setHover(id); trigger.current(); };
  return <div className="studio-scene" ref={host} data-status={status} data-view={view} data-time={environmentState.time} data-weather={environmentState.weather} data-season={environmentState.season} data-weather-mode={weatherState.mode} data-weather-status={weatherState.current?(weatherState.error||weatherState.stale?"stale":"current"):"preview"} data-breeze={breeze} data-visited={visited.length}>
    {props.panels.map(panel=><div key={panel.id} className="studio-surface-host" ref={el=>{if(el)presentations.current.set(panel.id,el);else presentations.current.delete(panel.id);}} data-kind={panel.id} data-active={!overview&&view===panel.id} data-visible="false" data-interactive="false" aria-hidden={overview||view!==panel.id} inert={overview||view!==panel.id}>{panel.content}</div>)}
    {status === "loading" && <div className="studio-loading" role="status"><span className="studio-loader" />庭のあるスタジオへ…</div>}
    {status === "fallback" ? <div className={`studio-fallback ${overview?"":"studio-fallback-compact"}`}><span>TEXT EDITION</span>{overview&&<h2>同じ物語を、ここから。</h2>}<p>3Dを表示できませんでした。内容と操作は、このまま使えます。</p><button onClick={() => { const url = new URL(location.href); url.searchParams.delete("no3d"); history.replaceState(null, "", url); setStatus("loading"); setRetry(n => n + 1); }}>3Dを再読み込み</button><div hidden={!overview}>{objects.map(o => <button key={o.id} onClick={() => select(o.id)}>{o.title} ↗</button>)}</div></div> : <>
      <div className="studio-object-labels" aria-label="スタジオの物件">{objects.map(o => <button ref={el => { if (el) labels.current.set(o.id, el); else labels.current.delete(o.id); }} key={o.id} data-object={o.id} data-selected={view === o.id} data-hovered={hover === o.id} data-visited={visited.includes(o.id)} data-visible={view === "room" || view === o.id || hover === o.id} className="studio-object" onClick={() => select(o.id)} onFocus={() => focusObject(o.id)} onBlur={() => focusObject(null)} onPointerEnter={() => focusObject(o.id)} onPointerLeave={() => focusObject(null)} aria-label={`${o.title}を開く`}><span>{o.title}<b aria-hidden="true">↗</b></span></button>)}</div>
      {overview && status === "ready" && <>
        <button className="garden-start" onClick={()=>{setVisited([]);select("name");}}>はじめる <span aria-hidden="true">↗</span></button>
        <EnvironmentMenu state={weatherState} motion={breeze} onMotion={()=>setBreeze(v=>!v)} onCamera={command=>control.current(command)}/>

      </>}
    </>}
  </div>;
}
