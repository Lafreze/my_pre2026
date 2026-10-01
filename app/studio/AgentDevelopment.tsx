"use client";
import { useId, useRef, type KeyboardEvent } from "react";
import { developmentEras, developmentRoutes, developmentFoundations } from "./agentHistoryData";

export default function AgentDevelopment({selected,onSelect}:{selected:number;onSelect:(n:number)=>void}) {
  const id=useId(),lastYear=useRef(0);
  const category=selected<5?0:selected-4;
  const categories=["発展の年表","製品の用途","支える技術"];
  const era=developmentEras[selected];
  const selectYear=(year:number)=>{lastYear.current=year;onSelect(year);};
  const selectCategory=(index:number)=>onSelect(index===0?lastYear.current:index+4);
  const move=(e:KeyboardEvent<HTMLButtonElement>,index:number,count:number,select:(n:number)=>void)=>{
    const next=e.key==="ArrowRight"?(index+1)%count:e.key==="ArrowLeft"?(index+count-1)%count:e.key==="Home"?0:e.key==="End"?count-1:null;
    if(next===null)return;e.preventDefault();select(next);
    e.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('button')[next].focus();
  };
  return <div className="agent-development" data-stage={selected} data-category={category}>
    <div className="development-perspectives" role="tablist" aria-label="発展を捉える観点">{categories.map((label,i)=><button key={label} id={`${id}-category-${i}`} role="tab" aria-selected={category===i} aria-controls={`${id}-panel`} tabIndex={category===i?0:-1} onKeyDown={e=>move(e,i,3,selectCategory)} onClick={()=>selectCategory(i)}>{label}</button>)}</div>
    <section className="development-panel" role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-category-${category}`} tabIndex={0}>
      {era&&<div className="development-rail" role="tablist" aria-label="発展の年代">{developmentEras.map((item,i)=><button key={item.year} id={`${id}-year-${i}`} role="tab" aria-selected={selected===i} aria-controls={`${id}-era`} tabIndex={selected===i?0:-1} onKeyDown={e=>move(e,i,5,selectYear)} onClick={()=>selectYear(i)}><strong>{item.year}</strong><span>{item.label}</span></button>)}</div>}
      {era?<div className="development-era" key={era.year} id={`${id}-era`} role="tabpanel" aria-labelledby={`${id}-year-${selected}`}>
        <header className="development-heading"><h2>{era.title}</h2><p>{era.description}</p></header>
        <ol className="development-flow" aria-label={`${era.year}の利用の流れ`}>{era.flow.map(item=><li key={item.text}><small>{item.role}</small><strong>{item.text}</strong></li>)}</ol>
        <div className="development-events" style={{gridTemplateColumns:`repeat(${era.events.length},minmax(0,1fr))`}}>{era.events.map(event=><article key={event.name}><time>{event.date}</time><a href={event.url} target="_blank" rel="noreferrer">{event.name} <span>↗</span></a><p>{event.text}</p></article>)}</div>
        <p className="development-note">{era.note}</p>
      </div>:selected===5?<div className="development-parallel">
        <header className="development-heading"><h2>用途から見るAgent製品</h2><p>利用目的による分類。複数の用途を備える製品もあり、分類間に世代や性能の順位はない。</p></header>
        <div className="development-routes">{developmentRoutes.map(route=><article key={route.name}><div><h3>{route.name}</h3><small>{route.label}</small></div><p>{route.purpose}</p><a href={route.url} target="_blank" rel="noreferrer">{route.examples} ↗</a></article>)}</div>
        <p className="development-note">製品名は代表例。同じ製品でも、機能や実行環境により利用できる範囲は異なる。</p>
      </div>:<div className="development-infrastructure">
        <header className="development-heading"><h2>実行を支える技術と運用基盤</h2><p>実行管理・接続方式・手順の再利用など、役割別に整理。MCP・A2A・Skillsは、Agentの必須部品ではない。</p></header>
        <div className="development-foundations">{developmentFoundations.map(item=><article key={item.name}><span className="foundation-purpose">{item.purpose}</span><h3>{item.name}</h3><p>{item.text}</p><a href={item.url} target="_blank" rel="noreferrer">{item.source} ↗</a></article>)}</div>
        <p className="development-enterprise"><strong>企業での運用</strong><span>業務データ・操作との接続に加え、ID、権限、承認、監査を設計する。</span><a href="https://docs.aws.amazon.com/bedrock/latest/userguide/agents.html" target="_blank" rel="noreferrer">Bedrock Agents ↗</a></p>
      </div>}
    </section>
  </div>;
}
