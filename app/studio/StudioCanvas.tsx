"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { buildRoom } from "./room";
import { cameras, objects, type ObjectId, type ViewId } from "./content";

export default function StudioCanvas({view,chapter,paused,cardOpen,boardStep,review,onSelect,skipToken,agentStep,flipped,cardTheme}:{view:ViewId;chapter:number;paused:boolean;cardOpen:boolean;boardStep:number;review:number;onSelect:(id:ObjectId)=>void;skipToken:number;agentStep:number;flipped:boolean;cardTheme:number}) {
  const host=useRef<HTMLDivElement>(null), labels=useRef(new Map<ObjectId,HTMLButtonElement>());
  const latest=useRef({view,paused,cardOpen,boardStep,review,onSelect,skipToken,agentStep,flipped,cardTheme});
  const trigger=useRef<()=>void>(()=>{});
  const [status,setStatus]=useState("loading"),[retry,setRetry]=useState(0),[hover,setHover]=useState<ObjectId|null>(null);
  useEffect(()=>{latest.current={view,paused,cardOpen,boardStep,review,onSelect,skipToken,agentStep,flipped,cardTheme};trigger.current();},[view,paused,cardOpen,boardStep,review,onSelect,skipToken,agentStep,flipped,cardTheme]);
  useEffect(()=>{
    const element=host.current!;
    if(new URLSearchParams(location.search).has("no3d")){const fallback=requestAnimationFrame(()=>setStatus("fallback"));return()=>cancelAnimationFrame(fallback);}
    let renderer:THREE.WebGLRenderer;
    try { renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:"low-power"}); } catch { const fallback=requestAnimationFrame(()=>setStatus("fallback"));return()=>cancelAnimationFrame(fallback); }
    renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<700?1.25:1.65));renderer.shadowMap.enabled=true;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;renderer.shadowMap.type=THREE.PCFShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.02;
    renderer.domElement.setAttribute("aria-label","クリックできる3Dワークスタジオ。各物件は画面上のボタンからも開けます。");renderer.domElement.setAttribute("role","img");element.prepend(renderer.domElement);
    const scene=new THREE.Scene();const room=buildRoom(()=>trigger.current(), Math.min(8,renderer.capabilities.getMaxAnisotropy()));scene.add(room.root);const pmrem=new THREE.PMREMGenerator(renderer);const environmentScene=new RoomEnvironment();const environment=pmrem.fromScene(environmentScene,.04);scene.environment=environment.texture;scene.environmentIntensity=.55;environmentScene.dispose();pmrem.dispose();
    if(innerWidth<700){room.sun.shadow.mapSize.set(1024,1024);}
    const camera=new THREE.PerspectiveCamera(34,1,.1,80);
    const target=new THREE.Vector3();let span=4,previousView:ViewId=latest.current.view;
    const start=cameras[previousView];camera.position.set(...start.position);target.set(...start.target);span=start.span;
    let raf=0,last=0,dirty=true,from=0,duration=1100,animating=false,disposed=false,open=0,card=0,flip=0,focusBlend=latest.current.view==="room"?0:1;
    let sourcePosition=camera.position.clone(),sourceTarget=target.clone(),sourceSpan=span,skip=latest.current.skipToken,shadowOpen=-1,shadowCard=-1,slowFrames=0;
    const reduced=matchMedia("(prefers-reduced-motion: reduce)");
    const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();let hoverId:ObjectId|null=null,down:{x:number;y:number;time:number}|null=null,dragged=false,orbit=0;
    const metrics={frames:0,ms:0,drawCalls:0,triangles:0};
    function project(){const w=element.clientWidth,h=element.clientHeight;objects.forEach(o=>{const b=labels.current.get(o.id);if(!b)return;const v=new THREE.Vector3(...o.anchor).project(camera);b.style.left=`${(v.x*.5+.5)*w}px`;b.style.top=`${(-v.y*.5+.5)*h}px`;b.dataset.offscreen=String(v.z>1||v.x < -.95||v.x > .92||v.y < -.92||v.y> .95);});}
    function frame(t:number){raf=0;if(disposed||document.hidden||latest.current.paused)return;const interval=t-(last||t),dt=Math.min(100,interval);last=t;
      if(animating&&interval>55&&interval<250)slowFrames++;else slowFrames=Math.max(0,slowFrames-1);if(slowFrames===18){renderer.setPixelRatio(.85);element.dataset.quality="economy";renderer.shadowMap.enabled=false;}
      const state=latest.current;
      if(previousView!==state.view){sourcePosition=camera.position.clone();sourceTarget=target.clone();sourceSpan=span;from=t;duration=state.view==="room"&&["name","notebook"].includes(previousView)?2400:1100;previousView=state.view;orbit=0;animating=true;}
      const desired=cameras[state.view];const finish=skip!==state.skipToken||reduced.matches;skip=state.skipToken;
      if(animating){const progress=finish?1:Math.min(1,(t-from)/duration);const eased=progress<.5?4*progress**3:1-(-2*progress+2)**3/2;camera.position.lerpVectors(sourcePosition,new THREE.Vector3(...desired.position),eased);target.lerpVectors(sourceTarget,new THREE.Vector3(...desired.target),eased);span=THREE.MathUtils.lerp(sourceSpan,desired.span,eased);if(progress===1)animating=false;}
      const noteGoal=state.view==="notebook"?1:hoverId==="notebook"?.12:0,cardGoal=state.cardOpen?1:hoverId==="cards"?.08:0;
      open=finish?noteGoal:THREE.MathUtils.damp(open,noteGoal,8,dt/1000);card=finish?cardGoal:THREE.MathUtils.damp(card,cardGoal,8,dt/1000);
      const flipGoal=state.view==="cards"&&state.flipped?1:0;flip=finish?flipGoal:THREE.MathUtils.damp(flip,flipGoal,7,dt/1000);room.animate(open,card,state.boardStep,state.review,hoverId,state.view==="monitor"?state.agentStep:-1,flip,state.cardTheme);
      if(Math.abs(open-shadowOpen)>.3||Math.abs(card-shadowCard)>.3){renderer.shadowMap.needsUpdate=true;shadowOpen=open;shadowCard=card;}
      const w=element.clientWidth,h=element.clientHeight;camera.aspect=w/h;
      // span is the horizontal coverage at the target; adjust for narrow canvases.
      const coverage=w<=1000&&state.view==="room"?span*.75:span;const dist=coverage/(2*Math.tan(THREE.MathUtils.degToRad(34/2))*Math.min(camera.aspect,1.4));
      const direction=camera.position.clone().sub(target).normalize();
      const pos=target.clone().addScaledVector(direction,dist);if(orbit){pos.sub(target).applyAxisAngle(new THREE.Vector3(0,1,0),orbit).add(target);}
      const saved=camera.position.clone();camera.position.copy(pos);camera.lookAt(target);const focusGoal=state.view==="room"?0:1;focusBlend=finish?focusGoal:THREE.MathUtils.damp(focusBlend,focusGoal,6,dt/1000);if(focusBlend>.001){if(w>1000)camera.setViewOffset(w,h,w*.19*focusBlend,0,w,h);else camera.setViewOffset(w,h,0,h*.13*focusBlend,w,h);}else camera.clearViewOffset();camera.updateProjectionMatrix();camera.updateMatrixWorld();
      renderer.render(scene,camera);project();camera.position.copy(saved);
      metrics.frames++;if(animating){metrics.ms+=dt;}metrics.drawCalls=renderer.info.render.calls;metrics.triangles=renderer.info.render.triangles;
      element.dataset.frames=String(metrics.frames);element.dataset.drawCalls=String(metrics.drawCalls);element.dataset.triangles=String(metrics.triangles);element.dataset.transition=String(animating);
      if(dirty){dirty=false;setStatus("ready");}
      if(animating||Math.abs(focusBlend-focusGoal)>.002||Math.abs(open-noteGoal)>.002||Math.abs(card-cardGoal)>.002||Math.abs(flip-flipGoal)>.002)raf=requestAnimationFrame(frame);
    }
    function wake(){if(!raf&&!disposed){last=0;raf=requestAnimationFrame(frame);}}
    trigger.current=wake;
    function resize(){renderer.setSize(element.clientWidth,element.clientHeight);wake();}
    const ro=new ResizeObserver(resize);ro.observe(element);
    function hit(e:PointerEvent){const r=element.getBoundingClientRect();pointer.set(((e.clientX-r.left)/r.width)*2-1,-((e.clientY-r.top)/r.height)*2+1);ray.setFromCamera(pointer,camera);const found=ray.intersectObject(room.root,true);for(const f of found){let o:THREE.Object3D|null=f.object;while(o){if(o.userData.objectId)return o.userData.objectId as ObjectId;o=o.parent;}}return null;}
    function move(e:PointerEvent){if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)>7){dragged=true;orbit=Math.max(-.2,Math.min(.2,(e.clientX-down.x)/800));wake();return;}const id=hit(e);if(id!==hoverId){hoverId=id;setHover(id);renderer.domElement.style.cursor=id?"pointer":"grab";wake();}}
    function press(e:PointerEvent){down={x:e.clientX,y:e.clientY,time:performance.now()};dragged=false;}
    function release(e:PointerEvent){if(down&&!dragged&&performance.now()-down.time<700){const id=hit(e);if(id)latest.current.onSelect(id);}down=null;}
    function leave(){down=null;hoverId=null;setHover(null);wake();}
    function lost(e:Event){e.preventDefault();cancelAnimationFrame(raf);setStatus("fallback");}
    const canvas=renderer.domElement;canvas.addEventListener("pointermove",move);canvas.addEventListener("pointerdown",press);canvas.addEventListener("pointerup",release);canvas.addEventListener("pointerleave",leave);canvas.addEventListener("webglcontextlost",lost);document.addEventListener("visibilitychange",wake);reduced.addEventListener("change",wake);resize();
    return()=>{disposed=true;trigger.current=()=>{};cancelAnimationFrame(raf);ro.disconnect();canvas.removeEventListener("pointermove",move);canvas.removeEventListener("pointerdown",press);canvas.removeEventListener("pointerup",release);canvas.removeEventListener("pointerleave",leave);canvas.removeEventListener("webglcontextlost",lost);document.removeEventListener("visibilitychange",wake);reduced.removeEventListener("change",wake);room.dispose();environment.dispose();renderer.dispose();canvas.remove();};
  },[retry]);
  return <div className="studio-scene" ref={host} data-status={status} data-view={view}>
    {status==="loading"&&<div className="studio-loading" role="status"><span className="studio-loader"/>スタジオを準備しています…</div>}
    {status==="fallback"?<div className="studio-fallback"><span>TEXT EDITION</span><h2>同じ物語を、ここから。</h2><p>3Dを表示できませんでした。全章と参考資料は、このままご覧いただけます。</p><button onClick={()=>{const url=new URL(location.href);url.searchParams.delete("no3d");history.replaceState(null,"",url);setStatus("loading");setRetry(n=>n+1);}}>3Dを再読み込み</button><div>{objects.map(o=><button key={o.id} onClick={()=>onSelect(o.id)}>{o.title} ↗</button>)}</div></div>:
    <div className="studio-object-labels" aria-label="スタジオの物件">{objects.map(o=><button ref={el=>{if(el)labels.current.set(o.id,el);else labels.current.delete(o.id);}} key={o.id} data-object={o.id} data-selected={view===o.id} data-hovered={hover===o.id} data-next={o.chapter===chapter+1} data-visible={view==="room"||view===o.id||hover===o.id} className="studio-object" onClick={()=>onSelect(o.id)} onFocus={()=>setHover(o.id)} onBlur={()=>setHover(null)} aria-label={`${o.title}を開く`}><i/><span><small>{o.subtitle}</small>{o.title}<b>↗</b></span></button>)}</div>}
  </div>;
}

