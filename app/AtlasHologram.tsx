"use client";

import { useEffect, useId, useRef, useState, type RefObject } from "react";
import { atlasExamples } from "./atlasExamples";
import { atlasNodes, atlasSources, type AtlasNode } from "./agentAtlasData";

type Props = {
  node: AtlasNode; active: boolean; position: number; total: number;
  rootRef: RefObject<HTMLDivElement | null>;
  onClose: () => void; onSelect: (id: string) => void; onNavigate: (id: string) => void;
  onAdjacent: (delta: number) => void; onLayout: () => void;
};
const tabs = ["概要", "動作例", "設計・資料"];

export function AtlasHologram({ node, active, position, total, rootRef, onClose, onSelect, onNavigate, onAdjacent, onLayout }: Props) {
  const [tab, setTab] = useState(0), [step, setStep] = useState(0), [playing, setPlaying] = useState(false), [collapsed, setCollapsed] = useState(false);
  const cardRef = useRef<HTMLElement>(null), contentRef = useRef<HTMLDivElement>(null), layoutRef = useRef(onLayout);
  const uid = useId().replace(/:/g, ""), example = atlasExamples[node.id], current = example.steps[step];
  useEffect(() => { layoutRef.current = onLayout; });
  useEffect(() => {
    cardRef.current?.querySelector<HTMLElement>("h2")?.focus({ preventScroll: true });
    const observer = new ResizeObserver(() => layoutRef.current());
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!active) { setPlaying(false); return; }
    if (!playing || !active || collapsed || tab !== 1) return;
    if (step === example.steps.length - 1) { setPlaying(false); return; }
    const timer = window.setTimeout(() => setStep(value => value + 1), 1800);
    const pause = () => { if (document.hidden) setPlaying(false); };
    document.addEventListener("visibilitychange", pause);
    return () => { clearTimeout(timer); document.removeEventListener("visibilitychange", pause); };
  }, [playing, active, collapsed, tab, step, example]);
  const changeTab = (value: number) => { setTab(value); setPlaying(false); contentRef.current?.scrollTo({ top: 0 }); };
  const chooseStep = (value: number) => { setStep(value); setPlaying(false); };
  const jumpToExample = (index: number) => { changeTab(1); chooseStep(Math.min(index, example.steps.length - 1)); };

  return <div ref={rootRef} className="atlas-hologram" data-topic={node.id} data-collapsed={collapsed} style={{ "--node-color": node.color } as React.CSSProperties}>
    <svg className="atlas-holo-projection" aria-hidden="true">
      <defs><linearGradient id={`${uid}-beam`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={node.color} stopOpacity=".02" /><stop offset=".7" stopColor={node.color} stopOpacity=".09" /><stop offset="1" stopColor={node.color} stopOpacity=".38" /></linearGradient></defs>
      <path data-holo-fan fill={`url(#${uid}-beam)`} />
      <path data-holo-thread fill="none" stroke={node.color} strokeWidth="1" strokeOpacity=".8" />
      <ellipse data-holo-origin rx="24" ry="7" fill={node.color} fillOpacity=".12" stroke={node.color} />
    </svg>
    <section ref={cardRef} id="atlas-projection-card" className="atlas-holo-card" role="dialog" aria-modal="false" aria-labelledby="atlas-detail-title" data-scene-controls>
      <div className="atlas-holo-cap"><span><i />{node.category} <b>{node.date}</b></span><div><button type="button" aria-label={collapsed ? "カードを展開" : "カードを折りたたむ"} onClick={() => { setCollapsed(value => !value); setPlaying(false); }}>{collapsed ? "＋" : "−"}</button><button type="button" aria-label="総覧に戻る" onClick={onClose}>×</button></div></div>
      <header className="atlas-holo-heading"><div><span>{node.label}</span><h2 id="atlas-detail-title" tabIndex={-1}>{node.title}</h2></div><div className="atlas-holo-pager"><button type="button" aria-label="前の要素" onClick={() => onAdjacent(-1)}>‹</button><small>{String(position + 1).padStart(2, "0")} / {total}</small><button type="button" aria-label="次の要素" onClick={() => onAdjacent(1)}>›</button></div></header>
      {!collapsed && <>
        <div className="atlas-holo-tabs" role="tablist" aria-label="紹介の内容">{tabs.map((label, index) => <button type="button" key={label} role="tab" id={`${uid}-tab-${index}`} aria-selected={tab === index} aria-controls={`${uid}-panel`} tabIndex={tab === index ? 0 : -1} onClick={() => changeTab(index)} onKeyDown={event => {
          const next = event.key === "ArrowRight" ? (index + 1) % 3 : event.key === "ArrowLeft" ? (index + 2) % 3 : event.key === "Home" ? 0 : event.key === "End" ? 2 : null;
          if (next !== null) { event.preventDefault(); changeTab(next); cardRef.current?.querySelectorAll<HTMLElement>("[role=tab]")[next]?.focus(); }
        }}><small>0{index + 1}</small>{label}</button>)}</div>
        <div ref={contentRef} className="atlas-holo-content" role="tabpanel" id={`${uid}-panel`} aria-labelledby={`${uid}-tab-${tab}`} tabIndex={0}>
          {tab === 0 && <div className="atlas-holo-page" key="overview">
            <p className="atlas-holo-summary">{node.summary}</p>
            <div className="atlas-holo-flow" aria-label="構造と流れ">{node.flow.map((label, index) => <button type="button" key={label} onClick={() => jumpToExample(index)}><small>{String(index + 1).padStart(2, "0")}</small><b>{label}</b>{index < node.flow.length - 1 && <i>→</i>}</button>)}</div>
            <div className="atlas-holo-facts">{node.facts.map(([label, text]) => <section key={label}><h3>{label}</h3><p>{text}</p></section>)}</div>
            <button className="atlas-holo-case-link" type="button" onClick={() => changeTab(1)}><span>{example.title}</span><b>▷</b></button>
          </div>}
          {tab === 1 && <div className="atlas-holo-page atlas-holo-example" key="example">
            <div className="atlas-holo-case-heading"><h3>{example.title}</h3><span>架空の例</span></div>
            <div className="atlas-holo-sequence" aria-label="例の工程">{example.steps.map((item, index) => <button type="button" key={item.label} aria-label={`工程 ${index + 1}：${item.label}`} aria-pressed={step === index} data-complete={index < step} onClick={() => chooseStep(index)}><span>{index < step ? "✓" : String(index + 1).padStart(2, "0")}</span><b>{item.label}</b></button>)}</div>
            <div className="atlas-holo-artifact" data-step={step}><div><span>{current.label}</span><i>{step + 1} / {example.steps.length}</i></div><pre key={step}>{current.artifact}</pre></div>
            <p className="atlas-holo-step-text" aria-live={playing ? "off" : "polite"}>{current.description}</p>
            <div className="atlas-holo-playback"><button type="button" aria-label="前の工程" disabled={step === 0} onClick={() => chooseStep(step - 1)}>←</button><button type="button" aria-label={playing ? "一時停止" : "再生"} aria-pressed={playing} onClick={() => { if (step === example.steps.length - 1) setStep(0); setPlaying(value => !value); }}>{playing ? "Ⅱ" : "▷"}<span>{playing ? "一時停止" : "再生"}</span></button><button type="button" aria-label="次の工程" disabled={step === example.steps.length - 1} onClick={() => chooseStep(step + 1)}>→</button><button type="button" aria-label="例をリセット" onClick={() => chooseStep(0)}>↺</button></div>
          </div>}
          {tab === 2 && <div className="atlas-holo-page" key="design">
            <div className="atlas-holo-design">{example.design.map(([label, text], index) => <section key={label}><span>0{index + 1}</span><div><h3>{label}</h3><p>{text}</p></div></section>)}</div>
            <p className="atlas-holo-boundary">{node.boundary}</p>
            <ol className="atlas-holo-sources">{node.sources.map((id, index) => <li key={id}><a href={atlasSources[id].url} target="_blank" rel="noreferrer"><small>{String(index + 1).padStart(2, "0")}</small><span>{atlasSources[id].title}</span><b>↗</b></a></li>)}</ol>
          </div>}
        </div>
        <footer className="atlas-holo-footer"><div className="atlas-holo-relations" aria-label="関連テーマ">{node.related.map(id => { const item = atlasNodes.find(entry => entry.id === id); return item && <button type="button" key={id} onClick={() => onSelect(id)}>{item.label}<i>↗</i></button>; })}</div><button className="atlas-holo-slide" type="button" onClick={() => onNavigate(node.slide)}>関連するスライド<span>→</span></button></footer>
      </>}
    </section>
  </div>;
}
