"use client";
import { useLayoutEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { ProductJourney, ProductAdvantage } from "./StoryPanels";
import AgentArchitecture from "./AgentArchitecture";
import VisionExperiment from "./VisionExperiment";
import UsageExpansion from "./UsageExpansion";
import { chapters } from "./content";
type Set<T> = Dispatch<SetStateAction<T>>;
type Props = {
  chapter:number; active:boolean; profile:{name:string;romanName:string}; board:number;setBoard:Set<number>;
  agentTab:"parts"|"loop";setAgentTab:Set<"parts"|"loop">;part:number;setPart:Set<number>;
  step:number;setStep:Set<number>;playing:boolean;setPlaying:Set<boolean>;
  application:number;setApplication:Set<number>;
  onNext:()=>void;onExplore:()=>void;
};
export default function ModelPresentation(p:Props) {
  const c=chapters[p.chapter];
  const [productTab,setProductTab]=useState<"process"|"value">("process");
  const scroll=useRef<HTMLDivElement>(null);
  useLayoutEffect(()=>{if(scroll.current)scroll.current.scrollTop=0;},[p.chapter,productTab]);
  return <section className={`model-presentation model-${c.view}`} aria-label="現在の章" data-chapter={p.chapter}>
    <div className="surface-summary" aria-hidden="true" data-cover={c.view}><span>WANG BO / FIELD JOURNAL</span>{p.chapter===0?<><i className="cover-monogram">王</i><strong>WANG BO</strong><p>WORK & CURIOSITY</p></>:p.chapter===1?<><div className="cover-inspection"/><strong>VISION STUDY</strong><p>IMAGE → PATCHES → TOKENS</p></>:p.chapter===2?<><strong>WAYS TO WORK WITH AI</strong><div className="cover-ways"><span>答える<small>LLM RESPONSE</small></span><span>実行する<small>TOOL USE</small></span><span>進める<small>AGENT LOOP</small></span></div></>:p.chapter===3?<><strong>AGENT WORKBENCH</strong><div className="cover-runtime">Harness<div>Context <b>→</b> Model <b>→</b> Tools</div><small>↺ FEEDBACK LOOP</small></div></>:<><strong>IDEA TO PRODUCT</strong><div className="cover-product">DEFINE <b>→</b> BUILD <b>→</b> VERIFY</div><p>THIS STUDIO / MADE WITH CODEX</p></>}</div>
    <div className="model-topline"><span>{p.chapter===3?<><i className="screen-led"/> AGENT WORKBENCH</>:"WANG BO / FIELD JOURNAL"}</span><span>{String(p.chapter+1).padStart(2,"0")} <i>/</i> {String(chapters.length).padStart(2,"0")}</span></div>
    <div className="model-page-scroll" ref={scroll}>
      {p.chapter===0&&<div className="personal-introduction">
        <div className="personal-identity"><span className="model-eyebrow">ABOUT ME / 自己紹介</span><div className="personal-name"><span className="personal-seal">王</span><div><h1 tabIndex={-1}>{p.profile.name}</h1><span>{p.profile.romanName}</span></div></div><h2>画像処理・機械学習エンジニア</h2><p>画像の特徴を捉え、モデルを選び、<br/>実際の課題に使う仕事をしてきました。</p><div className="personal-skills"><span>画像分類</span><span>次フレーム予測</span><span>Active Learning</span></div></div>
        <ol className="personal-career"><li><span>2023年以前</span><h2>KIOXIA</h2><p>画像処理・画像分類モデルの開発</p></li><li><span>2023 — 現在</span><h2>日立ハイテク</h2><p>画像処理・機械学習の開発</p><small>現在はMulti Beamグループを兼任し、<br/>ADC関連の開発を中心に担当しています。</small></li></ol>
        <div className="personal-topic"><span>今日のテーマ</span><p>画像を「判定するAI」から、アイデアを形にする「動くAI」へ。</p><small>私自身の関心の広がりを紹介します。</small></div>
      </div>}
      {p.chapter===1&&<><div className="practice-heading"><span className="model-eyebrow">COMPUTER VISION / モデル選択の経験</span><h1 tabIndex={-1}>画像分類で学んだ、モデル選択の難しさ</h1><p>VGG・ViT・ResNetを比較して見えたこと</p></div><VisionExperiment/></>}
      {p.chapter===2&&<UsageExpansion selected={p.board} onSelect={p.setBoard}/>}
      {p.chapter===3&&<>
        <div className="screen-heading"><div><span className="model-eyebrow">ARCHITECTURE / EXECUTION</span><h1 tabIndex={-1}>Agentの構成と実行過程</h1></div><div className="screen-tabs" role="tablist" aria-label="Agentの説明"><button role="tab" aria-selected={p.agentTab==="parts"} onClick={()=>{p.setAgentTab("parts");p.setPlaying(false);}}>構成を見る</button><button role="tab" aria-selected={p.agentTab==="loop"} onClick={()=>p.setAgentTab("loop")}>動きを見る</button></div></div>
        <AgentArchitecture mode={p.agentTab} part={p.part} setPart={p.setPart} step={p.step} setStep={p.setStep} playing={p.playing} setPlaying={p.setPlaying} active={p.active}/>
      </>}
      {p.chapter===4&&<>
        <div className="chapter-panel-heading"><div className="application-heading"><span className="model-eyebrow">FROM AN IDEA TO A USEFUL PRODUCT</span><h1 tabIndex={-1}>{productTab==="process"?"AIを活用した製品開発":"製品開発における競争力"}</h1></div><div className="paper-tabs" role="tablist" aria-label="製品づくりと競争力"><button role="tab" aria-selected={productTab==="process"} onClick={()=>setProductTab("process")}>開発プロセス</button><button role="tab" aria-selected={productTab==="value"} onClick={()=>setProductTab("value")}>競争力</button></div></div>
        {productTab==="process"?<ProductJourney selected={p.application} onSelect={p.setApplication}/>:<ProductAdvantage/>}
      </>}
    </div>
    <footer className="model-page-footer">{p.chapter===1?<a className="vit-source" href="https://arxiv.org/html/2010.11929v2" target="_blank" rel="noreferrer">ViT 原論文 ↗</a>:<span>{p.chapter===0?"IMAGE PROCESSING / MACHINE LEARNING":p.chapter===chapters.length-1?"IDEA → PRODUCT → VALUE":c.en}</span>}<button onClick={p.chapter===4?(productTab==="process"?()=>{setProductTab("value");}:p.onExplore):p.onNext}>{p.chapter===4?(productTab==="process"?"競争力の論点へ":"庭を自由に探索する"):["画像処理の経験へ","LLMの使い方へ","Agentの構成へ","製品開発への応用へ"][p.chapter]} <b>→</b></button></footer>
  </section>;
}
