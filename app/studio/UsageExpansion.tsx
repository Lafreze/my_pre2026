"use client";
import { useRef, useState } from "react";
import { LLMDevelopment } from "./StoryPanels";
const modes=[
 {title:"答える",tag:"LLMによる応答",summary:"指示や情報から、文章・コードを生成する。",heading:"要求に応じて、コードを生成",steps:["要求を伝える","コードを生成","コードを受け取る"],memoryTitle:"2022 / GPTとの出会い",memory:"文章生成の力に驚きました。自然な指示から試せる範囲が、大きく広がったと感じました。",note:"この例では生成されたコードを人が保存・実行します。"},
 {title:"実行する",tag:"ツール利用",summary:"モデルの要求に応じて、システムがツールを実行する。",heading:"ツールを介して、ファイルを作成",steps:["要求を伝える","編集ツールを要求","システムが保存","結果を返す"],memoryTitle:"APIで小さな道具を自作",memory:"日常業務を助けるツールをAPIで開発。生成した内容を、手元の処理につなぐようになりました。",note:"ツール利用は1回に限りません。ここでは保存までの例を示します。"},
 {title:"進める",tag:"Agent",summary:"実行結果を踏まえ、次の行動を選ぶ。",heading:"実行結果を使って、修正・再検査",steps:["目標・受入条件","編集","ブラウザー検査","幅超過を発見","修正・再検査","成果物を渡す"],memoryTitle:"Coding Agentを使うように",memory:"OpenClawでの試行を経て、Claude CodeやCodexを活用。この発表画面も、操作確認と修正を重ねて制作しました。",note:"AgentでもLLMとツールを利用します。受入条件で確認し、上限や障害では人へ戻します。"},
];
export default function UsageExpansion({selected,onSelect}:{selected:number;onSelect:(n:number)=>void}){
 const [era,setEra]=useState(0);const dialog=useRef<HTMLDialogElement>(null);const item=modes[selected];
 return <>
  <div className="usage-heading"><div><span className="model-eyebrow">LLMを使う仕組みの広がり</span><h1 tabIndex={-1}>「答える」から「実行する」、そして「進める」へ</h1></div><button className="background-trigger" onClick={()=>dialog.current?.showModal()}>背景を見る ↗</button></div>
  <div className="usage-tabs" role="tablist" aria-label="LLMの三つの使い方">{modes.map((m,i)=><button key={m.title} role="tab" aria-selected={selected===i} aria-controls="usage-example" onClick={()=>onSelect(i)}><small>{m.tag}</small><strong>{m.title}</strong><span>{m.summary}</span></button>)}</div>
  <div className="usage-example" id="usage-example" role="tabpanel" data-mode={selected}>
   <div className="usage-mechanism"><div className="usage-task"><span>共通の課題</span><p>イベントの参加登録ページをつくる</p><small>説明用の例</small></div><h2>{item.heading}</h2><ol className="usage-flow">{item.steps.map((s,i)=><li key={s}><small>{String(i+1).padStart(2,"0")}</small><span>{s}</span>{i<item.steps.length-1&&<b aria-hidden="true">→</b>}</li>)}</ol>
    <div className="usage-output" aria-live="polite">{selected===0?<><span>生成されたコード</span><code>{'<form>\n  <label>お名前 <input name="name" /></label>\n  <button>参加を申し込む</button>\n</form>'}</code><small>コードの生成まで。動作確認はこれから。</small></>:selected===1?<><span>ツール要求 → 実行結果</span><code>{'Model   edit_file("index.html", code)\nSystem  ファイル編集を実行\nResult  index.html を保存しました'}</code><small>保存結果をモデルに返す。実行主体はシステム。</small></>:<><div className="usage-feedback"><span>検査結果：ボタン右端 +64px</span><b>↺ 結果を文脈へ</b><span>幅を修正 → 再検査 OK</span></div><div className="usage-delivery"><span>EVENT REGISTRATION</span><strong>参加登録ページ</strong><span className="example-cta">参加を申し込む <b>→</b></span><small>模式図 · 検査記録と成果物を引き渡す</small></div></>}</div><p className="usage-scope">{item.note}</p>
   </div>
   <aside className="usage-memory"><h3>{item.memoryTitle}</h3><p>{item.memory}</p></aside>
  </div>
  <dialog className="llm-background" ref={dialog} aria-labelledby="llm-background-title"><div className="llm-background-heading"><div><span className="model-eyebrow">BACKGROUND / 技術の背景</span><h2 id="llm-background-title">LLMを支える代表的な変化</h2></div><button onClick={()=>dialog.current?.close()}>閉じる ×</button></div><LLMDevelopment selected={era} onSelect={setEra}/></dialog>
 </>;
}
