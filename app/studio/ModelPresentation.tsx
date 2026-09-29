"use client";
import { useLayoutEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { LLMDevelopment, ProductJourney, ProductAdvantage } from "./StoryPanels";
import { agentDetails } from "./storyDetails";
import AgentExperiment from "./AgentExperiment";
import VisionExperiment from "./VisionExperiment";
import { agentParts, chapters } from "./content";
type Set<T> = Dispatch<SetStateAction<T>>;
type Props = {
  chapter:number; profile:{name:string;romanName:string}; board:number;setBoard:Set<number>;
  agentTab:"parts"|"loop";setAgentTab:Set<"parts"|"loop">;part:number;setPart:Set<number>;
  step:number;setStep:Set<number>;playing:boolean;setPlaying:Set<boolean>;
  application:number;setApplication:Set<number>;
  onNext:()=>void;onExplore:()=>void;
};
const evolution = [
  {name:"LLM",label:"言葉で、答える",date:"2022 / MY FIRST GPT",title:"GPTによる文章生成を体験",text:"初めてGPTを体験し、文章生成の力に驚いた。用途ごとに組んでいた言語処理を、自然な指示から試せるように。",flow:["問い","生成","回答"],note:"従来のNLPが一律に不要になったのではなく、私にとって選べる方法が大きく広がった。"},
  {name:"Tool Use",label:"道具で、操作する",date:"MY OWN SMALL TOOLS",title:"APIで日常作業のツールを開発",text:"APIで簡単なツールを自作し、日常の作業に利用。モデルの操作要求をプログラムが実行し、その結果をモデルへ返す。",flow:["操作を選ぶ","ツール実行","結果を返す"],note:"実際にファイルや外部サービスを操作するのは、接続されたプログラム。"},
  {name:"Agent",label:"結果を見て、進める",date:"MY CODING AGENT JOURNEY",title:"Coding Agentによる実装と検証",text:"OpenClawでの個人Agentづくりを経て、Claude CodeやCodexを活用。自分の利用環境では、任せられる一連の作業が広がった。",flow:["目標と計画","実行と観察","修正・完了"],note:"私の利用体験の流れ。研究史や各製品の登場順を表すものではありません。"},
];
export default function ModelPresentation(p:Props) {
  const c=chapters[p.chapter], part=agentParts[p.part], detail=agentDetails[p.part];
  const [llmTab,setLLMTab]=useState<"history"|"personal">("history"),[era,setEra]=useState(0),[productTab,setProductTab]=useState<"process"|"value">("process");
  const scroll=useRef<HTMLDivElement>(null);
  useLayoutEffect(()=>{if(scroll.current)scroll.current.scrollTop=0;},[p.chapter,llmTab,productTab]);
  return <section className={`model-presentation model-${c.view}`} aria-label="現在の章" data-chapter={p.chapter}>
    <div className="model-topline"><span>{p.chapter===3?<><i className="screen-led"/> AGENT WORKBENCH</>:"WANG BO / FIELD JOURNAL"}</span><span>{String(p.chapter+1).padStart(2,"0")} <i>/</i> {String(chapters.length).padStart(2,"0")}</span></div>
    <div className="model-page-scroll" ref={scroll}>
      {p.chapter===0&&<div className="profile-spread">
        <div className="profile-opening"><span className="model-eyebrow">はじめまして / ABOUT ME</span><div className="profile-signature"><span className="profile-seal">王</span><div><h1 tabIndex={-1}>{p.profile.name}<small>です。</small></h1><span>{p.profile.romanName}</span></div></div><p className="profile-statement">これまで、画像処理の開発に携わってきました。<br/>現在はMulti Beamグループを兼任し、ADC関連の開発を中心に担当しています。</p><div className="profile-conversation"><span>今日お話しすること</span><p>画像処理での経験を起点に、LLMの発展、Agentの構成、製品開発への応用を紹介します。</p><small>どうぞよろしくお願いします。</small></div></div>
        <ol className="career-journey"><li><span>BEFORE 2023</span><h2>KIOXIA</h2><p>画像処理・画像分類のモデル開発。</p><small>VGG → ViTの比較を通じて、<br/>モデルの特性と学習条件を検証。</small></li><li><span>2023 —</span><h2>ハイテク</h2><p>引き続き、画像処理に取り組む。</p><div className="career-tags"><span>次フレーム予測</span><span>画像分類</span><span>Active Learning</span></div></li><li><span>CURRENT FOCUS</span><h2>Multi Beam</h2><p>グループを兼任し、<strong>ADC関連の開発</strong>を中心に担当。</p></li></ol>
      </div>}
      {p.chapter===1&&<>
        <div className="paper-heading"><span className="model-eyebrow">COMPUTER VISION / PERSONAL EXPERIENCE</span><h1 tabIndex={-1}>画像分類でのTransformer活用</h1><p>VGGからViTへの変更と、データ条件による違い。</p></div>
        <VisionExperiment/>
        <div className="field-observation"><span>実験から得た知見</span><p>性能は<em>データと学習条件</em>に依存。</p><div><p>データの少ない学習条件では、<b>ResNetの方が良い結果</b>になったことも。</p><small>私の実験での経験。事前学習の有無、データ量、評価条件によって結果は変わります。</small></div></div>
        <a className="model-source" href="https://arxiv.org/abs/2010.11929" target="_blank" rel="noreferrer">背景を読む：ViT 原論文 ↗</a>
      </>}
      {p.chapter===2&&<>
        <div className="chapter-panel-heading"><div className="board-heading"><span className="model-eyebrow">LANGUAGE MODELS / A SHORT HISTORY</span><h1 tabIndex={-1}>LLMの発展と利用経験</h1></div><div className="paper-tabs" role="tablist" aria-label="発展と個人の体験"><button role="tab" aria-selected={llmTab==="history"} onClick={()=>setLLMTab("history")}>技術の発展</button><button role="tab" aria-selected={llmTab==="personal"} onClick={()=>setLLMTab("personal")}>私の体験</button></div></div>
        {llmTab==="history"?<LLMDevelopment selected={era} onSelect={setEra}/>:<>
        <div className="evolution-tabs" role="tablist" aria-label="LLMからAgentへの発展">{evolution.map((item,i)=><button role="tab" aria-selected={p.board===i} aria-controls="evolution-detail" key={item.name} onClick={()=>p.setBoard(i)}><small>0{i+1}</small><strong>{item.name}</strong><span>{item.label}</span><b aria-hidden="true">{i<2?"→":"↻"}</b></button>)}</div>
        <div id="evolution-detail" className="evolution-detail" role="tabpanel" aria-live="polite"><div><span className="model-eyebrow">{evolution[p.board].date}</span><h2>{evolution[p.board].title}</h2><p>{evolution[p.board].text}</p></div><div className="evolution-flow">{evolution[p.board].flow.map((text,i)=><div key={text}><i>{i===1?"✳":String(i+1).padStart(2,"0")}</i><span>{text}</span>{i<2&&<b>↓</b>}</div>)}</div></div>
        <p className="model-annotation">{evolution[p.board].note}</p><a className="model-source" href="https://www.anthropic.com/engineering/building-effective-agents" target="_blank" rel="noreferrer">仕組みの背景：Building effective agents ↗</a></>}
      </>}
      {p.chapter===3&&<>
        <div className="screen-heading"><div><span className="model-eyebrow">ARCHITECTURE / EXECUTION</span><h1 tabIndex={-1}>Agentの構成と実行過程</h1></div><div className="screen-tabs" role="tablist" aria-label="Agentの説明"><button role="tab" aria-selected={p.agentTab==="parts"} onClick={()=>{p.setAgentTab("parts");p.setPlaying(false);}}>構成</button><button role="tab" aria-selected={p.agentTab==="loop"} onClick={()=>p.setAgentTab("loop")}>実行例</button></div></div>
        {p.agentTab==="parts"?<>
          <div className="agent-system" data-part={part.id}><svg className="agent-connections" viewBox="0 0 900 260" preserveAspectRatio="none" aria-hidden="true"><path d="M180 65H340Q365 65 365 90V130H450M720 65H560Q535 65 535 90V130H450M180 200H340Q365 200 365 175V130M720 200H560Q535 200 535 175V130"/><circle cx="450" cy="130" r="94"/></svg>{agentParts.map((item,i)=><button key={item.id} className={`agent-component agent-${item.id}`} aria-pressed={p.part===i} onClick={()=>p.setPart(i)}><i>{item.icon}</i><span><strong>{item.name}</strong><small>{item.ja}</small></span>{item.id==="model"&&<em>LLM</em>}</button>)}</div>
          <div className="agent-part-detail" aria-live="polite"><div className="agent-part-summary"><span>{part.name}<small>{part.ja}</small></span><p>{part.detail}</p></div><div className="agent-part-io"><div><small>INPUT</small><p>{detail.input}</p></div><span aria-hidden="true">↓</span><div><small>OUTPUT</small><p>{detail.output}</p></div></div><div className="agent-part-design"><small>設計するときに</small><p>{detail.design}</p><code>{detail.example}</code></div></div><div className="agent-data-flow" aria-label="情報が流れる順序"><span>指示</span><b>→</b><span>文脈</span><b>→</b><span>モデル</span><b>→</b><span>ツール</span><b>→</b><span>観測・検証</span><b>↻</b></div><p className="screen-note">役割を理解するための整理。すべてのAgentに同じ構成や長期記憶が必須という意味ではありません。</p>
        </>:<AgentExperiment step={p.step} setStep={p.setStep} playing={p.playing} setPlaying={p.setPlaying}/>}
      </>}
      {p.chapter===4&&<>
        <div className="chapter-panel-heading"><div className="application-heading"><span className="model-eyebrow">FROM AN IDEA TO A USEFUL PRODUCT</span><h1 tabIndex={-1}>{productTab==="process"?"AIを活用した製品開発":"製品開発における競争力"}</h1></div><div className="paper-tabs" role="tablist" aria-label="製品づくりと競争力"><button role="tab" aria-selected={productTab==="process"} onClick={()=>setProductTab("process")}>開発プロセス</button><button role="tab" aria-selected={productTab==="value"} onClick={()=>setProductTab("value")}>競争力</button></div></div>
        {productTab==="process"?<ProductJourney selected={p.application} onSelect={p.setApplication}/>:<ProductAdvantage/>}
      </>}
    </div>
    <footer className="model-page-footer"><span>{p.chapter===0?"IMAGE PROCESSING / MULTI BEAM / ADC":p.chapter===chapters.length-1?"IDEA → PRODUCT → VALUE":c.en}</span><button onClick={p.chapter===4?(productTab==="process"?()=>{setProductTab("value");}:p.onExplore):p.onNext}>{p.chapter===4?(productTab==="process"?"競争力の論点へ":"庭を自由に探索する"):["画像処理の経験へ","LLMの発展へ","Agentの構成へ","製品開発への応用へ"][p.chapter]} <b>→</b></button></footer>
  </section>;
}
