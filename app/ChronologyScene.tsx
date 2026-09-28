"use client";
import { useRef, useState, type PointerEvent } from "react";
import { Scene } from "./SceneControls";

type Moment = { year: string; title: string; text: string; point: string; phase: string; tools: readonly string[]; source: number };
export function ChronologyScene({ items, details, sources }: { items: readonly Moment[]; details: Record<string,{impact:string;boundary:string}>; sources: readonly {n:number;url:string}[] }) {
  const [index,setIndex] = useState(0);
  const [filter,setFilter] = useState("すべて");
  const [pinned,setPinned] = useState<number|null>(null);
  const drag = useRef<{x:number;index:number;pointer:number}|null>(null);
  const visible=items.map((item,i)=>({...item,index:i})).filter(item=>filter==="すべて"||item.phase===filter);
  const current=items[index], comparison=pinned===null?null:items[pinned];
  const select=(next:number)=>setIndex(Math.max(0,Math.min(items.length-1,next)));
  const begin=(event:PointerEvent<HTMLDivElement>)=>{if((event.target as HTMLElement).closest("button,a"))return;drag.current={x:event.clientX,index,pointer:event.pointerId};event.currentTarget.setPointerCapture(event.pointerId);};
  return <Scene name="2017–2026 技術年表" className="chronology-scene">
    <div className="scene-toolbar"><div className="scene-tabs" role="group" aria-label="年表の分類">{["すべて","基盤","対話","行動","接続","開発","運用"].map(value=><button key={value} type="button" aria-pressed={filter===value} onClick={()=>{setFilter(value);const next=items.findIndex(item=>value==="すべて"||item.phase===value);if(next>=0)setIndex(next);}}>{value}</button>)}</div><span className="scene-counter">{String(index+1).padStart(2,"0")} / 16</span></div>
    <div className="chronology-stage" data-comparing={Boolean(comparison)} onPointerDown={begin} onPointerMove={event=>{if(!drag.current)return;const shift=Math.trunc((drag.current.x-event.clientX)/55);const at=visible.findIndex(item=>item.index===drag.current?.index);const next=visible[Math.max(0,Math.min(visible.length-1,at+shift))];if(next)select(next.index);}} onPointerUp={()=>{drag.current=null;}} onPointerCancel={()=>{drag.current=null;}}>
      <div className="chronology-year" aria-hidden="true">{current.year.split(/[–—]/)[0]}<span>{current.phase}</span></div>
      <article className="chronology-card" key={current.title}><div className="chronology-card-top"><time>{current.year}</time><button type="button" aria-pressed={pinned===index} aria-label="比較に固定" onClick={()=>setPinned(pinned===index?null:index)}>⊕</button></div><h3>{current.title}</h3><strong>{current.point}</strong><p>{current.text}</p><div className="chronology-tools">{current.tools.map(tool=><span key={tool}>{tool}</span>)}</div><a href={sources.find(source=>source.n===current.source)?.url} target="_blank" rel="noreferrer" aria-label={`${current.title}の原資料`}>[{current.source}] ↗</a></article>
      {comparison && <article className="chronology-pinned"><header><time>{comparison.year}</time><button type="button" onClick={()=>setPinned(null)} aria-label="比較を閉じる">×</button></header><h3>{comparison.title}</h3><strong>{comparison.point}</strong><p>{details[comparison.title].impact}</p><small>{details[comparison.title].boundary}</small></article>}
    </div>
    <div className="chronology-rail" role="group" aria-label="転換点">{visible.map(item=><button type="button" key={item.title} aria-pressed={index===item.index} onClick={()=>select(item.index)}><i/><time>{item.year}</time><span>{item.title}</span></button>)}</div>
    <div className="scene-playback"><button type="button" aria-label="前の転換点" disabled={index===visible[0]?.index} onClick={()=>select(visible[Math.max(0,visible.findIndex(item=>item.index===index)-1)].index)}>←</button><input type="range" min="0" max={visible.length-1} value={Math.max(0,visible.findIndex(item=>item.index===index))} onChange={event=>select(visible[Number(event.target.value)].index)} aria-label="年表の位置"/><button type="button" aria-label="次の転換点" disabled={index===visible.at(-1)?.index} onClick={()=>select(visible[Math.min(visible.length-1,visible.findIndex(item=>item.index===index)+1)].index)}>→</button></div>
  </Scene>;
}
