"use client";
import { useState } from "react";

export const productSections = [
  {id:"possibility", label:"開発の変化", title:"試作から始める製品開発", next:"開発上の課題へ"},
  {id:"risks", label:"開発上の課題", title:"実装の容易さと、品質の課題", next:"専門性の役割へ"},
  {id:"expertise", label:"専門性", title:"AIを活用するための専門性", next:"発表のまとめへ"},
  {id:"summary", label:"まとめ", title:"製品開発の変化と専門性", next:"庭を自由に探索する"},
] as const;
export type ProductSection = typeof productSections[number]["id"];

const iterations = [
  {label:"要件を伝える", en:"INTENT", title:"目的と制約を言語化する", text:"対象となる利用者、解決したい課題、必要な機能を伝える。Agentが実装案と試作を作成する。", detail:"業務知識や具体的な利用場面が、要求を明確にする。"},
  {label:"試作を確認する", en:"PROTOTYPE", title:"動作する試作で認識を合わせる", text:"画面や操作を実際に確認し、想定との違いを把握する。文章だけでは曖昧だった要求を具体化する。", detail:"技術経験が少ない人も、試作を通じて開発に参加しやすくなる。"},
  {label:"改善を重ねる", en:"ITERATION", title:"評価結果を次の変更に反映する", text:"小さな範囲で修正と検証を繰り返す。利用価値を確かめながら、必要な機能と品質を段階的に整える。", detail:"既存の反復開発を、Agentによる実装・検証支援で進めやすくする。"},
];
export function ProductPossibility() {
  const [selected,setSelected]=useState(0),item=iterations[selected];
  return <section className="product-narrative product-possibility" aria-label="開発の変化">
    <p className="product-lead">LLMとAgentツールの発展により、アイデアを動作する試作へ移す技術的な障壁が下がりつつある。</p>
    <div className="product-observation"><h2>実装経験が少なくても、試作に取り組める</h2><p>自然言語で要求を伝え、生成された画面や機能を確認する。<br/>構想を早期に可視化し、完成形を固める前に利用価値を検討できる。</p></div>
    <div className="iteration-rail" role="tablist" aria-label="試作と改善の進め方">{iterations.map((step,i)=><button key={step.en} id={`iteration-${i}`} role="tab" aria-selected={i===selected} aria-controls="iteration-detail" onClick={()=>setSelected(i)} onKeyDown={e=>{const n=e.key==="ArrowRight"?(i+1)%3:e.key==="ArrowLeft"?(i+2)%3:e.key==="Home"?0:e.key==="End"?2:null;if(n!==null){e.preventDefault();e.stopPropagation();setSelected(n);document.getElementById(`iteration-${n}`)?.focus();}}}><span>{step.en}</span><strong>{step.label}</strong></button>)}</div>
    <div className="iteration-detail" id="iteration-detail" role="tabpanel" aria-labelledby={`iteration-${selected}`}><h3>{item.title}</h3><p>{item.text}</p><small>{item.detail}</small></div>
    <p className="product-boundary">試作の成立と、本番で安全に運用できる製品の完成は異なる。適用範囲や効果は、要件と実行環境に依存する。</p>
  </section>;
}
const risks = [
  {en:"UNDERSTANDING",title:"コードの把握不足",risk:"変更量が理解の範囲を超えると、設計意図や依存関係を追えず、不具合の原因特定が難しくなる。",response:"変更を小さく区切り、差分・設計・実行結果を確認する。説明できない変更は、そのまま採用しない。"},
  {en:"SECURITY",title:"安全性の見落とし",risk:"動作するコードにも、認証・権限の不備や機密情報の漏えいにつながる実装が含まれる可能性がある。",response:"実行権限とデータの範囲を限定し、依存関係とアクセス制御を検査する。必要に応じて専門家が確認する。"},
  {en:"VALIDATION",title:"評価の不足",risk:"画面が表示されることや、Agentの完了報告だけでは、業務要件や品質を満たしたとは判断できない。",response:"受入条件を先に定め、異常系・実データ・実際の操作を含めて検証する。"},
];
export function ProductRisks() {
  return <section className="product-narrative product-risks" aria-label="開発上の課題">
    <p className="product-lead">実装を委ねる範囲が広がるほど、生成物を理解し、品質を確認する仕組みが必要となる。</p>
    <div className="product-columns">{risks.map(item=><article key={item.en}><span className="product-kicker">{item.en}</span><h2>{item.title}</h2><p>{item.risk}</p><div className="product-response"><h3>対応</h3><p>{item.response}</p></div></article>)}</div>
    <p className="product-boundary">AIによる説明やレビューも誤りを含み得る。テストと人による確認を組み合わせ、公開・運用の責任を明確にする。</p>
    <a className="product-source" href="https://docs.github.com/en/copilot/concepts/agents/code-review" target="_blank" rel="noreferrer">参考：GitHub Copilot — コードレビューの限界 ↗</a>
  </section>;
}
const expertise = [
  {en:"DOMAIN",title:"業務を理解する",text:"現場の課題、制約、利用者の状況を把握し、開発する価値のある対象を選ぶ。",practice:"業務知識を、具体的な要件と評価基準に変換する。"},
  {en:"ENGINEERING",title:"技術を理解する",text:"設計、コード、データの流れを把握し、変更の影響やリスクを説明できる状態を維持する。",practice:"基礎技術の学習と、生成された実装の確認を継続する。"},
  {en:"JUDGMENT",title:"成果を評価する",text:"実装の速さだけでなく、正確性、安全性、保守性、運用上の効果を確認する。",practice:"検証結果を根拠として、採用・修正・公開を判断する。"},
];
export function ProductExpertise() {
  return <section className="product-narrative product-expertise" aria-label="専門性の役割">
    <p className="product-lead">Agentを活用しながら、業務知識・技術理解・評価能力を維持し、更新していく。</p>
    <div className="product-columns">{expertise.map(item=><article key={item.en}><span className="product-kicker">{item.en}</span><h2>{item.title}</h2><p>{item.text}</p><div className="product-response"><h3>継続する取り組み</h3><p>{item.practice}</p></div></article>)}</div>
    <div className="product-personal-note"><span>担当業務との接点</span><p>画像処理やADC関連開発で蓄積した知識を、課題設定と検証に生かす。</p></div>
  </section>;
}
export function PresentationConclusion({profile}:{profile:{name:string;romanName:string}}) {
  return <section className="product-narrative presentation-conclusion" aria-label="発表のまとめ">
    <p className="product-lead">生成AIは、文章の生成に加え、ツールを通じた実装と検証を支援するようになった。</p>
    <div className="conclusion-statements">
      <p><strong>開発への参加が広がる</strong><span>アイデアを早期に試作し、評価と改善を重ねやすくなる。</span></p>
      <p><strong>品質の確認は引き続き必要</strong><span>生成されたコードの理解と、安全性・運用面の検証が欠かせない。</span></p>
      <p><strong>専門性が活用の基盤となる</strong><span>業務知識と技術理解に基づき、課題を定め、成果を判断する。</span></p>
    </div>
    <p className="conclusion-final">実装支援を活用しつつ、成果を理解し評価する専門性を継続して磨く。</p>
    <p className="conclusion-signature">{profile.name}<span>{profile.romanName}</span></p>
  </section>;
}
