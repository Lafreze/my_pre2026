"use client";
import { useId, type KeyboardEvent } from "react";
import { developmentEras, developmentRoutes, developmentFoundations } from "./agentHistoryData";

export default function AgentDevelopment({selected,onSelect}:{selected:number;onSelect:(n:number)=>void}) {
  const id=useId();
  const tabs=[...developmentEras.map(era=>({title:era.year,label:era.label})),{title:"並行する流れ",label:"製品の広がり"},{title:"支える技術",label:"実行の基盤"}];
  const era=developmentEras[selected];
  const move=(e:KeyboardEvent<HTMLButtonElement>,index:number)=>{
    const next=e.key==="ArrowRight"?(index+1)%tabs.length:e.key==="ArrowLeft"?(index+tabs.length-1)%tabs.length:e.key==="Home"?0:e.key==="End"?tabs.length-1:null;
    if(next===null)return;e.preventDefault();onSelect(next);
    e.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('button')[next].focus();
  };
  return <div className="agent-development" data-stage={selected}>
    <div className="development-rail" role="tablist" aria-label="Agentの発展">
      {tabs.map((tab,i)=><button key={tab.title} id={`${id}-tab-${i}`} role="tab" aria-selected={selected===i} aria-controls={`${id}-panel`} tabIndex={selected===i?0:-1} onKeyDown={e=>move(e,i)} onClick={()=>onSelect(i)}><strong>{tab.title}</strong><span>{tab.label}</span></button>)}
    </div>
    <section className="development-panel" role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-tab-${selected}`} tabIndex={0}>
      {era?<div className="development-era" key={era.year}>
        <header className="development-heading"><h2>{era.title}</h2><p>{era.description}</p></header>
        <ol className="development-flow" aria-label={`${era.year}の利用の流れ`}>{era.flow.map(item=><li key={item.text}><small>{item.role}</small><strong>{item.text}</strong></li>)}</ol>
        <div className="development-events" style={{gridTemplateColumns:`repeat(${era.events.length},minmax(0,1fr))`}}>{era.events.map(event=><article key={event.name}><time>{event.date}</time><a href={event.url} target="_blank" rel="noreferrer">{event.name} <span>↗</span></a><p>{event.text}</p></article>)}</div>
        <p className="development-note">{era.note}</p>
      </div>:selected===5?<div className="development-parallel">
        <header className="development-heading"><h2>置き換えではなく、複数の流れが交わる</h2><p>分類は重なり合う。AI IDEにもCoding Agentが入り、個人Agentから開発タスクを委ねることもある。</p></header>
        <div className="development-routes">{developmentRoutes.map(route=><article key={route.name}><div><h3>{route.name}</h3><small>{route.label}</small></div><p><span>{route.early}</span><i>→</i><span>{route.middle}</span><i>→</i><span>{route.now}</span></p><a href={route.url} target="_blank" rel="noreferrer">{route.examples} ↗</a></article>)}</div>
        <p className="development-note">矢印は使い方の広がりを示す。製品の直接の継承関係や、性能の順位ではない。</p>
      </div>:<div className="development-infrastructure">
        <header className="development-heading"><h2>製品を動かす、技術と運用の基盤</h2><p>モデル、製品、開発の枠組み、接続方式は異なる層。MCP・A2A・Skillsは新しいモデルでも、必須部品でもない。</p></header>
        <div className="development-foundations">{developmentFoundations.map(item=><article key={item.name}><time>{item.date}</time><h3>{item.name}</h3><p>{item.text}</p><a href={item.url} target="_blank" rel="noreferrer">{item.source} ↗</a></article>)}</div>
        <p className="development-enterprise"><strong>企業での運用</strong><span>業務データ・操作との接続に加え、ID、権限、承認、監査を設計する。</span><a href="https://docs.aws.amazon.com/bedrock/latest/userguide/agents.html" target="_blank" rel="noreferrer">Bedrock Agents ↗</a></p>
      </div>}
    </section>
  </div>;
}
