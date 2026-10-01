"use client";
import { useRef, useState } from "react";
import { LLMDevelopment } from "./StoryPanels";
const modes=[
 {title:"応答生成",tag:"LLMによる応答",summary:"指示や情報から、文章・コードを生成する。",heading:"要求に応じて、コードを生成",steps:["要件を入力","コードを生成","コードを出力"],memoryTitle:"2022 / GPTとの出会い",memory:"2022年に初めてGPTを利用。自然言語による指示で文章を生成できる点に、従来の手法との違いを実感した。",note:"この例では、コードの保存と実行を人が担当する。"},
 {title:"ツール実行",tag:"ツール利用",summary:"モデルの要求に応じて、システムがツールを実行する。",heading:"ツールを介して、ファイルを作成",steps:["要件を入力","編集ツールを要求","システムが保存","結果を返す"],memoryTitle:"APIによる業務支援ツールの開発",memory:"APIを用いて日常業務向けのツールを開発。生成結果を既存の処理と連携させた。",note:"ツール利用の回数は限定されない。ここではファイル保存までを示す。"},
 {title:"タスク遂行",tag:"Agent",summary:"実行結果を踏まえ、次の行動を選ぶ。",heading:"実行結果を使って、修正・再検査",steps:["目標・受入条件","編集","ブラウザー検査","幅超過を発見","修正・再検査","成果物を提出"],memoryTitle:"Coding Agentの活用",memory:"OpenClawでの試行を経て、Claude CodeやCodexを活用。本発表画面も、操作確認と修正を反復して制作。",note:"AgentもLLMとツールを利用する。受入条件で検証し、実行上限・障害時は人に判断を求める。"},
];
export default function UsageExpansion({selected,onSelect}:{selected:number;onSelect:(n:number)=>void}){
 const [era,setEra]=useState(0);const dialog=useRef<HTMLDialogElement>(null);const item=modes[selected];
 return <>
  <div className="usage-heading"><p>同じ課題で比較する、LLMの三つの利用形態。</p><button className="background-trigger" onClick={()=>dialog.current?.showModal()}>背景を見る ↗</button></div>
  <div className="usage-tabs" role="tablist" aria-label="LLMの三つの使い方">{modes.map((m,i)=><button key={m.title} role="tab" aria-selected={selected===i} aria-controls="usage-example" onClick={()=>onSelect(i)}><small>{m.tag}</small><strong>{m.title}</strong><span>{m.summary}</span></button>)}</div>
  <div key={selected} className="usage-example screen-refresh" id="usage-example" role="tabpanel" data-mode={selected}>
   <div className="usage-mechanism"><div className="usage-task"><span>共通の課題</span><p>イベント参加登録ページの制作</p><small>説明用の例</small></div><h2>{item.heading}</h2><ol className="usage-flow">{item.steps.map((s,i)=><li key={s}><small>{String(i+1).padStart(2,"0")}</small><span>{s}</span>{i<item.steps.length-1&&<b aria-hidden="true">→</b>}</li>)}</ol>
    <div className="usage-output" aria-live="polite">{selected===0?<><span>生成されたコード</span><code>{'<form>\n  <label>お名前 <input name="name" /></label>\n  <button>参加を申し込む</button>\n</form>'}</code><small>生成コードの保存・動作確認は利用者が担当。</small></>:selected===1?<><span>ツール要求 → 実行結果</span><code>{'Model   edit_file("index.html", code)\nSystem  ファイル編集を実行\nResult  index.html 保存完了'}</code><small>保存結果をモデルに返す。実行主体はシステム。</small></>:<><div className="usage-feedback"><span>検査結果：ボタン右端 +64px</span><b>↺ 結果を文脈へ</b><span>幅を修正 → 再検査 OK</span></div><div className="usage-delivery"><span>EVENT REGISTRATION</span><strong>参加登録ページ</strong><span className="example-cta">参加を申し込む <b>→</b></span><small>模式図 · 検査記録と成果物を引き渡す</small></div></>}</div><p className="usage-scope">{item.note}</p>
   </div>
   <aside className="usage-memory"><h3>{item.memoryTitle}</h3><p>{item.memory}</p></aside>
  </div>
  <dialog className="llm-background" ref={dialog} aria-labelledby="llm-background-title"><div className="llm-background-heading"><div><span className="model-eyebrow">BACKGROUND / 技術の背景</span><h2 id="llm-background-title">LLMの主要な技術的進展</h2></div><button onClick={()=>dialog.current?.close()}>閉じる ×</button></div><LLMDevelopment selected={era} onSelect={setEra}/></dialog>
 </>;
}
