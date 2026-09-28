"use client";
import { useRef, useState, type CSSProperties } from "react";
import { Scene } from "./SceneControls";

type Layer={number:string;title:string;question:string;text:string;examples:string};
export function ArchitectureScene({layers}:{layers:readonly Layer[]}) {
  const ordered=[...layers].reverse();
  const [selected,setSelected]=useState(2),[expanded,setExpanded]=useState(true),[flat,setFlat]=useState(false);
  const [angles,setAngles]=useState({x:54,z:-28});
  const drag=useRef<{x:number;y:number;rx:number;rz:number}|null>(null);
  const selectedLayer=ordered[selected];
  return <Scene name="Prompt Context Harness Loop" className="architecture-scene"><div className="scene-toolbar"><div className="scene-tabs"><button type="button" aria-pressed={!flat} onClick={()=>setFlat(false)}>3D</button><button type="button" aria-pressed={flat} onClick={()=>setFlat(true)}>2D</button><button type="button" aria-pressed={expanded} onClick={()=>setExpanded(value=>!value)}>{expanded?"▱ ▱":"▰"}</button></div><button type="button" className="scene-icon" aria-label="視点をリセット" onClick={()=>setAngles({x:54,z:-28})}>↺</button></div><div className="architecture-layout"><div className="architecture-viewport" data-flat={flat} role="group" aria-label="設計層の立体モデル"><button type="button" className="architecture-rotate-surface" disabled={flat} aria-label="設計層の視点" onKeyDown={event=>{if(!["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(event.key))return;event.preventDefault();setAngles(current=>({x:Math.max(15,Math.min(75,current.x+(event.key==="ArrowUp"?-5:event.key==="ArrowDown"?5:0))),z:current.z+(event.key==="ArrowLeft"?-5:event.key==="ArrowRight"?5:0)}));}}
      onPointerDown={event=>{if(flat)return;drag.current={x:event.clientX,y:event.clientY,rx:angles.x,rz:angles.z};event.currentTarget.setPointerCapture(event.pointerId);}}
      onPointerMove={event=>{if(!drag.current)return;setAngles({x:Math.max(15,Math.min(75,drag.current.rx-(event.clientY-drag.current.y)*.25)),z:Math.max(-70,Math.min(70,drag.current.rz+(event.clientX-drag.current.x)*.25))});}}
      onPointerUp={()=>{drag.current=null;}} onPointerCancel={()=>{drag.current=null;}} />
      <div className="architecture-grid"/><div className="architecture-assembly" data-expanded={expanded} style={{"--rx":`${angles.x}deg`,"--rz":`${angles.z}deg`,"--spread":expanded?"75px":"13px"} as CSSProperties}>
        <div className="architecture-core"><span>MODEL</span><i>✦</i></div>
        {ordered.map((layer,index)=><button type="button" className="architecture-board" key={layer.number} style={{"--layer":index} as CSSProperties} onClick={()=>setSelected(index)} aria-pressed={selected===index}><span>{layer.number}</span><b>{layer.title.replace(" ENGINEERING","")}</b><div className="board-circuit" aria-hidden="true"><i/><i/><i/><i/><em/></div><small>{layer.examples.split(" · ")[0]}</small><div className="board-ports" aria-hidden="true"><i/><i/><i/><i/><i/></div></button>)}
      </div></div><div className="architecture-inspector" aria-live="polite"><span className="architecture-number">{selectedLayer.number}</span><h3>{selectedLayer.title.replace(" ENGINEERING","")}</h3><strong>{selectedLayer.question}</strong><p>{selectedLayer.text}</p><div>{selectedLayer.examples.split(" · ").map(value=><span key={value}>{value}</span>)}</div><div className="architecture-selector">{ordered.map((layer,index)=><button type="button" key={layer.number} onClick={()=>setSelected(index)} aria-label={layer.title} aria-pressed={selected===index}>{layer.number}</button>)}</div></div></div></Scene>;
}

export function SystemLayersScene() {
  const [fault,setFault]=useState(0),[selected,setSelected]=useState(0),[fixed,setFixed]=useState(false);
  const layers=["MODEL","SYSTEM","ENGINEERING"];
  const modules=[["GENERATION","REASONING","MULTIMODAL"],["CONTEXT / RAG","MCP / TOOLS","AGENT / WORKFLOW"],["HARNESS","LOOP / STATE","EVALS / SECURITY"]];
  const before=["18,000 + 14,000 = 24,000","create_draft → 403","send #042 → send #042"],after=["18,000 + 14,000 = 32,000","create_draft → DRAFT-042","send #042 → ALREADY_SAVED"];
  const fixes=["検算","権限を限定","冪等キー"];
  return <Scene name="生成AIの三つの設計層" className="system-layers-scene"><div className="scene-toolbar"><div className="scene-tabs" role="group" aria-label="障害">{["誤答","ツール失敗","重複実行"].map((label,index)=><button type="button" key={label} aria-pressed={fault===index} onClick={()=>{setFault(index);setSelected(index);setFixed(false);}}>{label}</button>)}</div><span className="scene-demo">DEMO</span></div><div className="system-layer-machine" data-fixed={fixed} data-fault={fault}>
      <div className="system-layer-shells">{layers.map((layer,index)=><button type="button" className={`system-shell shell-${index}`} key={layer} onClick={()=>setSelected(index)} aria-pressed={selected===index} data-fault={!fixed&&(fault===index||fault===0&&index===1)}><span>0{index+1}</span><b>{layer}</b><i>{!fixed&&fault===index?"!":"●"}</i><div>{modules[index].map(module=><small key={module}>{module}</small>)}</div></button>)}<div className="system-spine"><i/><i/><i/></div></div>
      <div className="system-terminal"><header><span className="status-led" data-status={fixed?"COMPLETE":"BLOCKED"}/><b>{fixed?"PASS":"FAIL"}</b><small>{layers[selected]}</small></header><div className="terminal-diff"><span className="diff-old">− {before[fault]}</span>{fixed&&<span className="diff-new">＋ {after[fault]}</span>}</div><div className="system-module-set">{modules[selected].map(module=><span key={module}>{module}</span>)}</div><button type="button" disabled={fixed||selected!==fault} onClick={()=>setFixed(true)} aria-label={`${fixes[fault]}を適用`}>{fixed?"✓":selected!==fault?"—": "↻"} {selected===fault?fixes[fault]:layers[selected]}</button><footer>{fixed?"VERIFIED":"TRACE"}<span>{fault===0?"MODEL → SYSTEM / CHECK":fault===1?"SYSTEM / TOOL PERMISSION":"ENGINEERING / PERSISTENT STATE"}</span></footer></div>
    </div></Scene>;
}
