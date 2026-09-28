"use client";

import { useEffect, useRef, useState } from "react";
import { AtlasCanvas, type AtlasCamera } from "./AtlasCanvas";
import { architectureEdges, architectureNodes, atlasNodes, evolutionNodes, type AtlasMode } from "./agentAtlasData";

import { AtlasHologram } from "./AtlasHologram";

const evolutionEdges: [string, string][] = evolutionNodes.slice(1).map((node, index) => [evolutionNodes[index].id, node.id]);

export function AgentAtlas({ embedded = false, active = true, onNavigate }: { embedded?: boolean; active?: boolean; onNavigate?: (id: string) => void }) {
  const [mode, setMode] = useState<AtlasMode>("architecture");
  const [selected, setSelected] = useState<string | null>(null);
  const [indexOpen, setIndexOpen] = useState(false);
  const cameraRef = useRef<AtlasCamera | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const hologramRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const scrollRef = useRef(0);
  const nodes = mode === "architecture" ? architectureNodes : evolutionNodes;
  const node = atlasNodes.find(item => item.id === selected);
  const close = () => {
    setSelected(null);
    requestAnimationFrame(() => {
      if (returnFocusRef.current?.isConnected) returnFocusRef.current.focus({ preventScroll: true });
      else rootRef.current?.querySelector<HTMLElement>('[data-node="' + selected + '"]')?.focus({ preventScroll: true });
      if (!embedded && window.innerWidth <= 700) rootRef.current?.scrollTo({ top: scrollRef.current });
    });
  };
  const selectNode = (id: string) => {
    if (!selected) { returnFocusRef.current = rootRef.current?.querySelector<HTMLElement>('[data-node="' + id + '"]') ?? document.activeElement as HTMLElement; scrollRef.current = rootRef.current?.scrollTop ?? 0; }
    setMode(evolutionNodes.some(item => item.id === id) ? "evolution" : "architecture");
    setSelected(id); setIndexOpen(false);
  };
  const setView = (next: AtlasMode) => { setSelected(null); setMode(next); setIndexOpen(false); };
  useEffect(() => {
    if (selected && !embedded && window.innerWidth <= 700 && rootRef.current && stageRef.current) {
      const root = rootRef.current, stage = stageRef.current;
      root.scrollTo({ top: root.scrollTop + stage.getBoundingClientRect().top - root.getBoundingClientRect().top - 8 });
    }
  }, [selected, embedded]);
  const navigate = (id: string) => { close(); if (onNavigate) onNavigate(id); else window.location.href = `/reference/?slide=${encodeURIComponent(id)}`; };

  return <div ref={rootRef} onKeyDownCapture={event => { if (selected && event.key === "Escape") { event.preventDefault(); event.stopPropagation(); close(); } }} data-selected={selected ?? undefined} className={`agent-atlas ${embedded ? "atlas-embedded" : "atlas-standalone"}`} data-scene-controls data-mode={mode}>
    <header className="atlas-masthead"><div className="atlas-wordmark"><i /> AGENT ATLAS <span>01—19</span></div><a href={embedded ? "/atlas/" : "/"}>{embedded ? "全画面で開く" : "プレゼンテーション"}<span>↗</span></a></header>
    <div className="atlas-heading"><div><span className="atlas-eyebrow">LLM-BASED AGENTS</span><h1>{mode === "architecture" ? <>Agentの<span>構成。</span></> : <>Agentへの<span>発展。</span></>}</h1></div><div className="atlas-switch" role="group" aria-label="総覧の表示"><button type="button" aria-label="発展" aria-pressed={mode === "evolution"} onClick={() => setView("evolution")}><span>01</span>発展</button><button type="button" aria-label="構成" aria-pressed={mode === "architecture"} onClick={() => setView("architecture")}><span>02</span>構成</button></div></div>
    <div ref={stageRef} className="atlas-stage">
      <div className="atlas-stage-meta"><span>{mode === "architecture" ? "SYSTEM ANATOMY" : "SELECTED MILESTONES"}</span><span>{mode === "architecture" ? "10 ELEMENTS" : "2017 — 2026"}</span></div>
      <AtlasCanvas nodes={nodes} edges={mode === "architecture" ? architectureEdges : evolutionEdges} mode={mode} active={active} selected={selected} hologramRef={hologramRef} onSelect={selectNode} cameraRef={cameraRef} />
      {node && <AtlasHologram key={node.id} node={node} active={active} rootRef={hologramRef} position={nodes.findIndex(item => item.id === selected)} total={nodes.length} onClose={close} onSelect={selectNode} onNavigate={navigate} onAdjacent={delta => selectNode(nodes[(nodes.findIndex(item => item.id === selected) + delta + nodes.length) % nodes.length].id)} onLayout={() => cameraRef.current?.refresh()} />}
      <div className="atlas-camera-tools" role="group" aria-label="立体図の視点"><button type="button" aria-label="左へ回転" onClick={() => cameraRef.current?.rotate(-1)}>↶</button><button type="button" aria-label="右へ回転" onClick={() => cameraRef.current?.rotate(1)}>↷</button><span /><button type="button" aria-label="拡大" onClick={() => cameraRef.current?.zoom(1)}>＋</button><button type="button" aria-label="縮小" onClick={() => cameraRef.current?.zoom(-1)}>−</button><span /><button type="button" aria-label="視点を初期化" onClick={() => cameraRef.current?.reset()}>⌖</button></div>
      <div className="atlas-legend"><span><i style={{ background: "#78b8ff" }} />{mode === "architecture" ? "CONTEXT" : "FOUNDATION"}</span><span><i style={{ background: "#64e2ca" }} />{mode === "architecture" ? "MODEL / CONNECTION" : "ACTION / CONNECTION"}</span><span><i style={{ background: "#e8c78f" }} />{mode === "architecture" ? "CONTROL / ENGINEERING" : "ENGINEERING"}</span></div>
    </div>
    <div className="atlas-bottom"><button type="button" aria-expanded={indexOpen} onClick={() => setIndexOpen(value => !value)}>INDEX <span>{String(nodes.length).padStart(2, "0")}</span><i>{indexOpen ? "−" : "＋"}</i></button><p>{mode === "architecture" ? "ソフトウェアの構成例 · 接続は情報と制御の関係" : "LLM型Agentに関わる節目 · 年月は原資料の公開時期"}</p><a className="atlas-credits" href="/models/atlas/CREDITS.md" target="_blank" rel="noreferrer">3D · Kenney / CC0 ↗</a><span>VERIFIED 2026.09.17</span></div>
    {indexOpen && <nav className="atlas-index" aria-label="全ノード">{nodes.map(item => <button type="button" key={item.id} onClick={() => selectNode(item.id)}><small>{item.date}</small>{item.label}<span>↗</span></button>)}</nav>}
  </div>;
}
