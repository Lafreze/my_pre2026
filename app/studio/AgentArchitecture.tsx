"use client";
import { useEffect, useId, useState, type Dispatch, type SetStateAction } from "react";
import { agentParts, agentSteps } from "./content";
import { agentDetails } from "./storyDetails";
import AgentExperiment from "./AgentExperiment";

type Set<T> = Dispatch<SetStateAction<T>>;
type Props = {
  mode:"parts"|"loop"; part:number; setPart:Set<number>;
  step:number; setStep:Set<number>; playing:boolean; setPlaying:Set<boolean>; active:boolean;
};
export type Scenario = "complete"|"limit"|"blocked";
const limits:Record<Scenario,number> = {complete:6,limit:3,blocked:2};

export default function AgentArchitecture({mode,part,setPart,step,setStep,playing,setPlaying,active}:Props) {
  const [scenario,setScenario] = useState<Scenario>("complete");
  const id=useId().replace(/:/g,"");
  const demo=mode==="loop", end=limits[scenario], current=Math.min(step,end), finished=current===end;
  const handedOff=demo&&finished&&scenario!=="complete";
  const selected=agentParts[part], detail=agentDetails[part];
  const activeNode=demo?(handedOff?"harness":agentSteps[current].node):selected.id;
  const records=demo?[
    ...(current>=2?["編集：HTML / CSS保存"]:[]),
    ...(current>=3&&scenario!=="blocked"?["初回検査：幅 +64px"]:[]),
    ...(current>=5?["再検査：幅・操作 OK"]:[]),
    ...(handedOff?[scenario==="limit"?"検査上限：1 / 1":"ブラウザーの利用権限なし"]:[]),
  ]:[];
  useEffect(()=>{
    if(!active||!demo||!playing||finished)return;
    const timer=setTimeout(()=>{const next=current+1;setStep(next);if(next===end)setPlaying(false);},2200);
    return()=>clearTimeout(timer);
  },[active,demo,playing,finished,current,end,setStep,setPlaying]);
  const selectStep=(n:number)=>{setPlaying(false);setStep(Math.max(0,Math.min(end,n)));};
  const choose=(n:number)=>{if(!demo)setPart(n);};
  const changeScenario=(value:Scenario)=>{setScenario(value);selectStep(0);};
  return <div className="agent-architecture" data-mode={mode} data-scenario={scenario} data-step={current} data-finished={finished}>
    <div className="architecture-stage">
      <div className="harness-frame" data-highlight={activeNode==="harness"} role="group" aria-label="Harness：Agentの実行を管理する枠組み">
        <button className="harness-label architecture-select" data-element="harness" aria-pressed={!demo&&part===3} onClick={()=>choose(3)} disabled={demo}>
          <strong>Harness</strong><span>モデル呼び出し・ツール実行・状態と制限の管理</span>
        </button>
        <div className="agent-circuit" data-loop-selected={!demo&&part===4}>
          <button className="agent-loop-label architecture-select" data-element="loop" aria-pressed={!demo&&part===4} disabled={demo} onClick={()=>choose(4)}>Agent Loop <span>↻</span></button>
          <svg className="circuit-wires" viewBox="0 0 640 250" preserveAspectRatio="none" aria-label="Agent Loop：ContextからModelへ、Harnessによるツール実行、結果・観測をContextへ反映する全体の循環">
            <defs><marker id={`${id}-arrow`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M1 1 8 5 1 9"/></marker></defs>
            <g markerEnd={`url(#${id}-arrow)`}>
              <path className="circuit-forward" d="M190 110H251"/>
              <path className="circuit-forward" d="M389 110H456"/>
              <path className="circuit-return" d="M539 156V195"/>
              <path className="circuit-return" d={`M287 212H110Q102 212 102 204V${demo?178:157}`}/>
            </g>
            {!demo&&<path className="circuit-hit" d="M190 110H251 M389 110H456 M539 156V212H110Q102 212 102 204V157" role="button" tabIndex={0} aria-label="Loopの循環経路を選択" aria-pressed={part===4} onClick={()=>setPart(4)} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();setPart(4);}}}/>}
          </svg>
          <span className="wire-label wire-context">文脈</span><span className="wire-label wire-call">ツール呼び出し要求<small>Harness が権限を確認して実行</small></span><span className="wire-label wire-result">結果</span>
          <button className="architecture-node node-context architecture-select" data-element="context" data-highlight={activeNode==="context"} aria-pressed={!demo&&part===1} disabled={demo} onClick={()=>choose(1)}>
            <strong>Context</strong><span>毎回の判断に使う情報</span>
            {demo?<div className="context-records" aria-live="polite"><small>目標：320px幅・操作可能</small>{records.length?records.slice(-2).map(record=><small className="context-record" key={record}>{record}</small>):<small>制作物：紹介用Webページ</small>}</div>:<small>指示・関連資料<br/>ツール結果・履歴の要約</small>}
          </button>
          <button className="architecture-node node-model architecture-select" data-element="model" data-highlight={activeNode==="model"} aria-pressed={!demo&&part===0} disabled={demo} onClick={()=>choose(0)}><small>LLM</small><strong>Model</strong><span>次の行動を判断</span></button>
          <button className="architecture-node node-tools architecture-select" data-element="tools" data-highlight={activeNode==="tools"} aria-pressed={!demo&&part===2} disabled={demo} onClick={()=>choose(2)}><strong>Tools</strong><span>情報取得・操作</span><small>{demo?current<2?"ファイル編集 / ブラウザー":scenario==="blocked"&&finished?"ブラウザー：アクセス不可":current<4?"browser.check()":current===4?"edit_file()":"browser.check()":"検索・読取・計算\n編集・実行"}</small></button>
          <div className="circuit-feedback" data-highlight={false}><span>実行結果・環境からの観測</span><small>{demo?handedOff?"実行を停止し、人に確認":current>=5?"再検査 OK → 文脈へ":current>=3?"画面幅の超過 → 文脈へ":current>=2?"編集結果 → 文脈へ":"結果を待機":"必要に応じた検証：テスト・ルール・モデル・人"}</small></div>
          <span className="loop-return-label">結果を文脈に反映</span>
        </div>
        <div className="harness-termination" data-outcome={demo&&finished?handedOff?"human":"delivered":"pending"}><span>終了制御</span><span>受入条件を満たす <b>→ 引き渡し</b></span><span>上限・障害 <b>→ 人へ確認</b></span></div>
      </div>
      {demo?<>
        <div className="agent-demo-toolbar"><label>終了条件の例<select aria-label="終了条件の例" value={scenario} onChange={e=>changeScenario(e.target.value as Scenario)}><option value="complete">修正して引き渡す</option><option value="limit">検査1回で停止</option><option value="blocked">権限の不足</option></select></label><small>説明用シミュレーション · AI未接続</small></div>
        <div className="execution-track" aria-label="Webページ制作の工程">{agentSteps.map((item,i)=><button key={item.phase} disabled={i>end} aria-label={`${i+1} ${item.title}`} aria-current={i===current?"step":undefined} onClick={()=>selectStep(i)}><span>{String(i+1).padStart(2,"0")}</span><small>{item.phase}</small></button>)}</div>
        <div className="execution-controls"><button aria-label="前のステップ" disabled={current===0} onClick={()=>selectStep(current-1)}>←</button><button disabled={finished} onClick={()=>setPlaying(v=>!v)}>{playing?"一時停止":"工程を再生"}</button><button disabled={finished} onClick={()=>selectStep(current+1)}>次の工程 →</button><button aria-label="Agentデモをリセット" onClick={()=>selectStep(0)}>↺</button></div>
      </>:<p className="architecture-reading">枠は実行上の責任範囲を表し、同じ場所への配置を意味しません。</p>}
    </div>
    <aside className="architecture-inspector" aria-label={demo?"現在の実行工程":"選択した要素の説明"}>
      {demo?<AgentExperiment step={current} scenario={scenario} handedOff={handedOff}/>:<div className="architecture-detail" aria-live="polite"><span className="inspector-label">{part===3?"RUNTIME FRAMEWORK":part===4?"AGENT LOOP":"SELECTED ELEMENT"}</span><h2>{selected.name}<span>{selected.ja}</span></h2><p>{selected.detail}</p><dl><div><dt>{part===3?"管理するもの":part===4?"循環する情報":"入力"}</dt><dd>{detail.input}</dd></div><div><dt>{part===3?"制御の結果":part===4?"次のラウンドへ":"出力"}</dt><dd>{detail.output}</dd></div></dl><p className="architecture-design">{detail.design}</p></div>}
    </aside>
    <p className="architecture-principle">{demo?"完了判定は受入条件に基づく。実行上限・障害時は停止し、人に判断を求める。":"ツールの実行成功と、タスクの目標達成は別の判断。検証の要否と方法は、タスクに応じて選ぶ。"}</p>
  </div>;
}
