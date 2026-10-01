"use client";
import { agentSteps } from "./content";
import type { Scenario } from "./AgentArchitecture";
type Props={step:number;scenario:Scenario;handedOff:boolean};
export default function AgentExperiment({step,scenario,handedOff}:Props){
 const item=agentSteps[step],checked=step>=3,corrected=step>=4,verified=step>=5;
 const title=handedOff?"実行停止・判断の依頼":item.title;
 const action=handedOff?(scenario==="limit"?"検査上限に到達。未解決の不具合と検査記録を提示し、人に判断を求める。":"ブラウザーの利用権限がなく検査できない。未完了として停止し、権限や代替手段について人に判断を求める。"):item.action;
 return <div className="execution-detail" data-outcome={handedOff?"human":step===6?"delivered":"running"} aria-live="polite">
  <span className="inspector-label">{handedOff?"HUMAN CHECKPOINT":`EXECUTION / ${String(step+1).padStart(2,"0")} OF 07`}</span>
  <h2>{title}</h2><p>{action}</p>
  <div className="browser-specimen" data-state={handedOff?"stopped":verified?"verified":corrected?"revised":checked?"overflow":"draft"}>
    <div className="specimen-topline"><span><i/><i/><i/></span><small>検査対象の模式図</small></div>
    <svg viewBox="0 0 384 158" role="img" aria-label={corrected?"修正後：ボタンは画面幅の中に収まる":"初稿：ボタンの右端が画面幅を超える"}>
      <defs><clipPath id="specimen-viewport"><rect width="320" height="158" rx="3"/></clipPath></defs>
      <rect width="384" height="158" fill="#855d4930"/>
      <g clipPath="url(#specimen-viewport)"><rect width="320" height="158" fill="#f1edda"/><text x="24" y="40" fill="#345447" fontSize="17">Research notes</text><rect x="24" y="56" width="160" height="5" rx="2" fill="#a0ac91"/><rect x="24" y="70" width="225" height="5" rx="2" fill="#c5ccb3"/><rect className="specimen-button" x="24" y="94" width={corrected?272:360} height="38" rx="5" fill={corrected?"#436752":"#a87352"}/><text x="40" y="118" fill="#fff8e4" fontSize="15">詳細を見る →</text></g>
      {!corrected&&<rect x="320" y="94" width="64" height="38" fill="#cc927757" stroke="#d3a088" strokeDasharray="4 4"/>}
      <path d="M320 5V153" stroke={corrected?"#8dab84":"#c98970"} strokeDasharray="3 4"/><text x="324" y="40" fill="#dce5cc" fontSize="13">320px</text>
    </svg>
    <p className="specimen-result">{handedOff?"停止中 · 完了の条件を満たしていない":verified?"PASS · 幅の超過なし / クリック応答 OK":corrected?"修正済み · ブラウザーで再確認する":checked?"FAIL · 右端384px > 画面幅320px":"初稿 · 検査前"}</p>
  </div>
  <div className="execution-evidence"><span>{handedOff?"判断に必要な情報":step===6?"成果物":"操作・観測の記録"}</span><code>{handedOff?scenario==="limit"?"未解決：右端 +64px / 検査 1 / 1":"browser.check → permission denied":item.code}</code></div>
 </div>;
}
