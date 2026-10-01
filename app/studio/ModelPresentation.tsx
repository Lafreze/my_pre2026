"use client";
import { useLayoutEffect, useRef, type Dispatch, type SetStateAction } from "react";
import { ProductJourney, ProductAdvantage } from "./StoryPanels";
import { DevelopmentComparison, PresentationConclusion, productSections, type ProductSection } from "./ProductConclusion";
import { developmentCutoff } from "./agentHistoryData";
import AgentDevelopment from "./AgentDevelopment";
import AgentArchitecture from "./AgentArchitecture";
import AgentPrelude from "./AgentPrelude";
import UsageExpansion from "./UsageExpansion";
import { chapters } from "./content";
type Set<T> = Dispatch<SetStateAction<T>>;
type Props = {
  chapter:number; active:boolean; profile:{name:string;romanName:string}; board:number;setBoard:Set<number>;
  agentTab:"usage"|"parts"|"loop"|"development";setAgentTab:Set<"usage"|"parts"|"loop"|"development">;development:number;setDevelopment:Set<number>;part:number;setPart:Set<number>;
  step:number;setStep:Set<number>;playing:boolean;setPlaying:Set<boolean>;
  application:number;setApplication:Set<number>;productTab:ProductSection;setProductTab:Set<ProductSection>;
  onNext:()=>void;onExplore:()=>void;
};
export default function ModelPresentation(p:Props) {
  const c=chapters[p.chapter];
  const {productTab,setProductTab}=p;
  const productSection=productSections.find(section=>section.id===productTab)!;
  const scroll=useRef<HTMLDivElement>(null);
  useLayoutEffect(()=>{if(scroll.current){scroll.current.scrollTop=0;if(p.chapter===2&&!matchMedia("(prefers-reduced-motion: reduce)").matches)scroll.current.animate([{opacity:.3,transform:"translateY(5px)"},{opacity:1,transform:"translateY(0)"}],{duration:260,easing:"ease-out"});}},[p.chapter,productTab,p.agentTab,p.development]);
  return <section className={`model-presentation model-${c.view}`} aria-label="現在の章" data-chapter={p.chapter} data-product-tab={productTab}>
    <div className="surface-summary" aria-hidden="true" data-cover={c.view}><span>WANG BO / FIELD JOURNAL</span>{p.chapter===0?<><strong>WANG BO</strong><p>PROFILE & RESEARCH</p></>:p.chapter===1?<><strong>AI &amp; US</strong><p>TRANSFORMER → LLM → AGENT</p></>:p.chapter===2?<><strong>AGENT WORKBENCH</strong><div className="cover-runtime">Harness<div>Context <b>→</b> Model <b>→</b> Tools</div><small>↺ AGENT LOOP</small></div></>:<><strong>IDEA TO PRODUCT</strong><div className="cover-product">DEFINE <b>→</b> BUILD <b>→</b> VERIFY</div><p>THIS STUDIO / MADE WITH CODEX</p></>}</div>
    <div className="model-topline"><span>{p.chapter===2?<><i className="screen-led"/> AGENT WORKBENCH</>:p.chapter===3?"STUDIO / PRODUCT LAB":"WANG BO / FIELD JOURNAL"}</span><span>{String(p.chapter+1).padStart(2,"0")} <i>/</i> {String(chapters.length).padStart(2,"0")}</span></div>
    <div className="model-page-scroll" ref={scroll}>
      {p.chapter===0&&<div className="personal-introduction">
        <div className="personal-identity"><span className="model-eyebrow">ABOUT ME / 自己紹介</span><div className="personal-name"><div><h1 tabIndex={-1}>{p.profile.name}</h1><span>{p.profile.romanName}</span></div></div><p className="personal-work">画像処理・機械学習を中心とした開発を担当。</p></div>
        <ol className="personal-career"><li><span>2023年以前</span><h2>KIOXIA</h2><p>画像処理・画像分類モデルの開発</p></li><li><span>2023 — 現在</span><h2>日立ハイテク</h2><p>次フレーム予測・画像分類・Active Learning</p><small>現在はMulti Beamグループの業務も担当。<br/>主にADC関連の開発に従事。</small></li></ol>
        <div className="personal-topic"><span className="model-eyebrow">発表テーマ</span><h2>生成AIの活用：文章生成から製品開発へ</h2><p>Agentがツールを利用し、実装・検証を支援する。<br/>製品としての要件・品質・公開の判断には、人の関与が必要となる。</p></div>
      </div>}
      {p.chapter===1&&<AgentPrelude/>}
      {p.chapter===2&&<div className="agent-chapter" data-section={p.agentTab}>
        <div className="screen-heading"><div><span className="model-eyebrow">{p.agentTab==="development"?`DEVELOPMENT / ${developmentCutoff} 時点`:"LLM / AGENT SYSTEMS"}</span><h1 tabIndex={-1}>{({usage:"LLMからAgentへ",parts:"Agentの構成",loop:"Agentの実行過程",development:"開発支援とタスク委任の発展"})[p.agentTab]}</h1></div><div className="screen-tabs" role="tablist" aria-label="LLMとAgentの説明">{([{id:"usage",label:"利用の広がり"},{id:"parts",label:"構成を見る"},{id:"loop",label:"動きを見る"},{id:"development",label:"発展をたどる"}] as const).map(tab=><button key={tab.id} role="tab" aria-selected={p.agentTab===tab.id} onClick={()=>{p.setAgentTab(tab.id);p.setPlaying(false);}}>{tab.label}</button>)}</div></div>
        {p.agentTab==="usage"?<UsageExpansion selected={p.board} onSelect={p.setBoard}/>:p.agentTab==="development"?<AgentDevelopment selected={p.development} onSelect={p.setDevelopment}/>:<AgentArchitecture mode={p.agentTab} part={p.part} setPart={p.setPart} step={p.step} setStep={p.setStep} playing={p.playing} setPlaying={p.setPlaying} active={p.active}/>}
      </div>}
      {p.chapter===3&&<>
        <div className="chapter-panel-heading"><div className="application-heading"><span className="model-eyebrow">{productTab==="summary"?"CONCLUSION / まとめ":"AI-ASSISTED PRODUCT DEVELOPMENT"}</span><h1 tabIndex={-1}>{productSection.title}</h1></div><div className="paper-tabs" role="tablist" aria-label="製品開発と発表のまとめ">{productSections.map(section=><button key={section.id} id={`product-section-${section.id}`} role="tab" aria-selected={productTab===section.id} aria-controls="product-section-panel" onClick={()=>setProductTab(section.id)}>{section.label}</button>)}</div></div>
        <div className="product-section-panel" id="product-section-panel" role="tabpanel" aria-labelledby={`product-section-${productTab}`}>
          {productTab==="process"?<ProductJourney selected={p.application} onSelect={p.setApplication}/>:productTab==="comparison"?<DevelopmentComparison/>:productTab==="value"?<ProductAdvantage/>:<PresentationConclusion/>}
        </div>
      </>}
    </div>
    <footer className="model-page-footer">{p.chapter===1?<div className="prelude-sources"><a href="https://arxiv.org/abs/1706.03762" target="_blank" rel="noreferrer">Transformer ↗</a><a href="https://arxiv.org/abs/2010.11929" target="_blank" rel="noreferrer">ViT ↗</a></div>:<span>{p.chapter===0?"IMAGE PROCESSING / MACHINE LEARNING":p.chapter===chapters.length-1?"IDEA → PRODUCT → VALUE":c.en}</span>}<button aria-label={p.chapter===3?productSection.next:p.chapter===2?(p.agentTab==="development"?(p.development<4?"次の年代へ":p.development===4?"製品の用途へ":p.development===5?"支える技術へ":"製品開発への応用へ"):p.agentTab==="usage"?"Agentの構成へ":p.agentTab==="parts"?"Agentの動きを見る":"Agentの発展へ"):["AIとの出会いへ","LLMとAgentへ"][p.chapter]} onClick={p.chapter===3&&productTab==="summary"?p.onExplore:p.onNext}><b aria-hidden="true">→</b></button></footer>
  </section>;
}
