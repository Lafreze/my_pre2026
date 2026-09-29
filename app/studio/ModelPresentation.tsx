"use client";
/* eslint-disable @next/next/no-img-element -- Local documentation capture, served by the static export without an image service. */
import type { Dispatch, SetStateAction } from "react";
import { agentParts, agentSteps, chapters } from "./content";
type Set<T> = Dispatch<SetStateAction<T>>;
type Props = {
  chapter:number; profile:{name:string;romanName:string}; board:number;setBoard:Set<number>;
  agentTab:"parts"|"loop";setAgentTab:Set<"parts"|"loop">;part:number;setPart:Set<number>;
  step:number;setStep:Set<number>;playing:boolean;setPlaying:Set<boolean>;
  application:number;setApplication:Set<number>;
  onNext:()=>void;onExplore:()=>void;
};
const evolution = [
  {name:"LLM",label:"言葉で、答える",date:"2022 / MY FIRST GPT",title:"文章が、自然に生まれる。",text:"初めてGPTを体験し、文章生成の力に驚いた。用途ごとに組んでいた言語処理を、自然な指示から試せるように。",flow:["問い","生成","回答"],note:"従来のNLPが一律に不要になったのではなく、私にとって選べる方法が大きく広がった。"},
  {name:"Tool Use",label:"道具で、操作する",date:"MY OWN SMALL TOOLS",title:"会話が、作業につながる。",text:"APIで簡単なツールを自作し、日常の作業に利用。モデルの操作要求をプログラムが実行し、その結果をモデルへ返す。",flow:["操作を選ぶ","ツール実行","結果を返す"],note:"実際にファイルや外部サービスを操作するのは、接続されたプログラム。"},
  {name:"Agent",label:"結果を見て、進める",date:"MY CODING AGENT JOURNEY",title:"実装から、確認と改善まで。",text:"OpenClawでの個人Agentづくりを経て、Claude CodeやCodexを活用。自分の利用環境では、任せられる一連の作業が広がった。",flow:["目標と計画","実行と観察","修正・完了"],note:"私の利用体験の流れ。研究史や各製品の登場順を表すものではありません。"},
];
const applications = [
  {title:"見えるようにする",en:"VISUALIZE",text:"表やログを、比較しやすい小さな画面へ。目的と確認したいことを先に決める。",icon:"▥"},
  {title:"繰り返しを減らす",en:"SMALL TOOLS",text:"日々の定型作業を、必要な操作だけに絞ったツールへ。実際の入力で使い心地を確かめる。",icon:"↻"},
  {title:"触って伝える",en:"INTERACTIVE STORIES",text:"この発表画面のように、説明を読むだけでなく、モデルや例に触れて理解できる体験へ。",icon:"✳"},
];
export default function ModelPresentation(p:Props) {
  const c=chapters[p.chapter], part=agentParts[p.part];
  return <section className={`model-presentation model-${c.view}`} aria-label="現在の章" data-chapter={p.chapter}>
    <div className="model-topline"><span>{p.chapter===3?<><i className="screen-led"/> AGENT WORKBENCH</>:"WANG BO / FIELD JOURNAL"}</span><span>{String(p.chapter+1).padStart(2,"0")} <i>/</i> {String(chapters.length).padStart(2,"0")}</span></div>
    <div className="model-page-scroll">
      {p.chapter===0&&<div className="profile-spread">
        <div className="profile-opening"><span className="model-eyebrow">MY JOURNEY</span><h1 tabIndex={-1}>画像処理から、<br/>AIとつくる毎日へ。</h1><div className="profile-signature"><span className="profile-seal">王</span><div><strong>{p.profile.name}</strong><span>{p.profile.romanName}</span></div></div><p className="profile-statement">モデルを試す。結果を確かめる。<br/>その繰り返しが、今の私のものづくりにつながっています。</p><div className="profile-motif" aria-hidden="true"><span/><span/><span/><b>IMAGE → INTELLIGENCE → IDEAS</b></div></div>
        <ol className="career-journey"><li><span>BEFORE 2023</span><h2>KIOXIA</h2><p>画像処理・画像分類のモデル開発。</p><small>VGG → ViTへの変更で、<br/>Transformerの力を初めて実感。</small></li><li><span>2023 —</span><h2>ハイテク</h2><p>引き続き、画像処理に取り組む。</p><div className="career-tags"><span>次フレーム予測</span><span>画像分類</span><span>Active Learning</span></div></li><li><span>CURRENT FOCUS</span><h2>Multi Beam</h2><p>グループを兼任し、<strong>ADC関連の開発</strong>を中心に担当。</p></li></ol>
      </div>}
      {p.chapter===1&&<>
        <div className="paper-heading"><span className="model-eyebrow">01 / THE EXPERIENCE THAT STAYED WITH ME</span><h1 tabIndex={-1}>最初の驚きは、<br/>画像の中にあった。</h1><p>同じ画像分類でも、モデルを変えると可能性が広がった。</p></div>
        <div className="vision-comparison"><div className="vision-model"><div className="vision-stack" aria-hidden="true"><i/><i/><i/></div><span>CONVOLUTION</span><h2>VGG</h2></div><div className="vision-change"><span>→</span><strong>私のタスクで<br/>性能が大きく改善</strong></div><div className="vision-model"><div className="vision-patches" aria-hidden="true">{Array.from({length:16},(_,i)=><i key={i}/>)}</div><span>TRANSFORMER</span><h2>ViT</h2></div></div>
        <div className="field-observation"><span>NOTE TO SELF</span><p>強いモデルも、<em>データと条件</em>で変わる。</p><div><p>データの少ない学習条件では、<b>ResNetの方が良い結果</b>になったことも。</p><small>私の実験での経験。事前学習の有無、データ量、評価条件によって結果は変わります。</small></div></div>
        <a className="model-source" href="https://arxiv.org/abs/2010.11929" target="_blank" rel="noreferrer">背景を読む：ViT 原論文 ↗</a>
      </>}
      {p.chapter===2&&<>
        <div className="board-heading"><span className="model-eyebrow">MY EXPERIENCE / THREE CHANGES</span><h1 tabIndex={-1}>「答える」から、<br className="mobile-break"/>「やり遂げる」へ。</h1></div>
        <div className="evolution-tabs" role="tablist" aria-label="LLMからAgentへの発展">{evolution.map((item,i)=><button role="tab" aria-selected={p.board===i} aria-controls="evolution-detail" key={item.name} onClick={()=>p.setBoard(i)}><small>0{i+1}</small><strong>{item.name}</strong><span>{item.label}</span><b aria-hidden="true">{i<2?"→":"↻"}</b></button>)}</div>
        <div id="evolution-detail" className="evolution-detail" role="tabpanel" aria-live="polite"><div><span className="model-eyebrow">{evolution[p.board].date}</span><h2>{evolution[p.board].title}</h2><p>{evolution[p.board].text}</p></div><div className="evolution-flow">{evolution[p.board].flow.map((text,i)=><div key={text}><i>{i===1?"✳":String(i+1).padStart(2,"0")}</i><span>{text}</span>{i<2&&<b>↓</b>}</div>)}</div></div>
        <p className="model-annotation">{evolution[p.board].note}</p><a className="model-source" href="https://www.anthropic.com/engineering/building-effective-agents" target="_blank" rel="noreferrer">仕組みの背景：Building effective agents ↗</a>
      </>}
      {p.chapter===3&&<>
        <div className="screen-heading"><div><span className="model-eyebrow">A MODEL, EQUIPPED TO WORK</span><h1 tabIndex={-1}>Agentの中を、のぞいてみる。</h1></div><div className="screen-tabs" role="tablist" aria-label="Agentの説明"><button role="tab" aria-selected={p.agentTab==="parts"} onClick={()=>{p.setAgentTab("parts");p.setPlaying(false);}}>構成をみる</button><button role="tab" aria-selected={p.agentTab==="loop"} onClick={()=>p.setAgentTab("loop")}>動きをみる</button></div></div>
        {p.agentTab==="parts"?<>
          <div className="agent-system" data-part={part.id}><svg className="agent-connections" viewBox="0 0 900 260" preserveAspectRatio="none" aria-hidden="true"><path d="M180 65H340Q365 65 365 90V130H450M720 65H560Q535 65 535 90V130H450M180 200H340Q365 200 365 175V130M720 200H560Q535 200 535 175V130"/><circle cx="450" cy="130" r="94"/></svg>{agentParts.map((item,i)=><button key={item.id} className={`agent-component agent-${item.id}`} aria-pressed={p.part===i} onClick={()=>p.setPart(i)}><i>{item.icon}</i><span><strong>{item.name}</strong><small>{item.ja}</small></span>{item.id==="model"&&<em>LLM</em>}</button>)}</div>
          <div className="agent-part-detail" aria-live="polite"><span>{part.name}<small>{part.ja}</small></span><div><p>{part.detail}</p><code>{part.example}</code></div></div><p className="screen-note">役割を理解するための整理。MCPはツールや情報をつなぐ選択肢の一つです。</p>
        </>:<div className="agent-loop-demo"><div className="loop-steps"><span className="demo-badge">仕組みのローカルデモ · AI未接続</span><h2>つくる。見つける。直す。</h2><p className="loop-goal">目標：ログを要約する。結果を読める。<br/>狭い画面でも操作できる。</p><div className="studio-step-track" aria-label="Agentの工程">{agentSteps.map((item,i)=><button key={i} title={item.title} aria-label={`${i+1} ${item.title}`} aria-current={p.step===i?"step":undefined} onClick={()=>{p.setPlaying(false);p.setStep(i);}}><span>{i+1}</span><small>{item.phase}</small></button>)}</div><div className="studio-step-text" aria-live="polite"><strong>{agentSteps[p.step].title}</strong><p>{agentSteps[p.step].action}</p></div><div className="studio-demo-controls"><button aria-label="前のステップ" disabled={p.step===0} onClick={()=>{p.setPlaying(false);p.setStep(n=>n-1);}}>←</button><button disabled={p.step===6&&!p.playing} onClick={()=>p.setPlaying(v=>!v)}>{p.playing?"一時停止":"再生"}</button><button disabled={p.step===6} onClick={()=>{p.setPlaying(false);p.setStep(n=>n+1);}}>次のステップ →</button><button aria-label="Agentデモをリセット" onClick={()=>{p.setPlaying(false);p.setStep(0);}}>↺</button></div></div><div className="loop-preview"><div className="device-caption"><span>CHECK THE RESULT</span><b>{agentSteps[p.step].broken?"NEEDS A FIX":"320px PREVIEW"}</b></div><div className="demo-device-clip"><div className="studio-mini-viewport" data-broken={agentSteps[p.step].broken}><span className="mini-orbit">✳</span><strong>ログを、読みやすく。</strong><div className={`studio-example-button ${agentSteps[p.step].broken?"is-broken":""}`}>要約を表示 <span>→</span></div></div></div><p className="preview-verdict" data-broken={agentSteps[p.step].broken}>{agentSteps[p.step].broken?"↳ ボタンの右端がはみ出している。":"✓ 同じ条件で、結果を確かめる。"}</p><p className="screen-note">完了したら止める。判断が必要なら、人に戻す。</p></div></div>}
      </>}
      {p.chapter===4&&<>
        <div className="application-heading"><span className="model-eyebrow">IDEA → BUILD → TRY → IMPROVE</span><h1 tabIndex={-1}>思いついたら、<br className="mobile-break"/>まず触れる形に。</h1></div><div className="made-with-agent"><div><span className="made-label">YOU ARE LOOKING AT ONE.</span><h2>この発表画面も、<br/>Codexとつくりました。</h2><p>「こう見せたい」を伝える。<br/>動いたものを見て、次の改善を伝える。</p><div className="idea-process"><span>言葉にする</span><b>→</b><span>動かす</span><b>→</b><span>見て直す</span></div></div><figure><img width={1440} height={1000} loading="lazy" decoding="async" src="/studio/garden-preview.png" alt="Codexで制作した、この発表用の庭院ワークスタジオ。"/><figcaption>このワークスタジオ / 制作例</figcaption></figure></div>
        <div className="application-choices" role="group" aria-label="Agentで試せる応用">{applications.map((item,i)=><button aria-pressed={p.application===i} key={item.en} onClick={()=>p.setApplication(i)}><i>{item.icon}</i><span>{item.title}<small>{item.en}</small></span></button>)}</div><p className="application-detail" aria-live="polite">{applications[p.application].text}</p><p className="model-annotation">動く試作を出発点に、用途に合う品質を人が確かめて育てる。</p>
      </>}
    </div>
    <footer className="model-page-footer"><span>{p.chapter===0?"IMAGE PROCESSING / MULTI BEAM / ADC":p.chapter===chapters.length-1?"次は、何をつくってみたいですか。":c.en}</span><button onClick={p.chapter===chapters.length-1?p.onExplore:p.onNext}>{["最初のTransformer体験へ","言葉の世界で起きた変化へ","Agentの中をみる","アイデアを形にする","庭を自由に探索する"][p.chapter]} <b>→</b></button></footer>
  </section>;
}
