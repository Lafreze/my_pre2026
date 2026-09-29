"use client";
import { useState, type Dispatch, type SetStateAction } from "react";
import { agentSteps } from "./content";
type Props={step:number;setStep:Dispatch<SetStateAction<number>>;playing:boolean;setPlaying:Dispatch<SetStateAction<boolean>>};
const samples=[[12.4,9.8,14.1],[12.4,28.6,14.1]];
export default function AgentExperiment({step,setStep,playing,setPlaying}:Props){
 const [sample,setSample]=useState(0);
 const values=samples[sample],mean=values.reduce((a,b)=>a+b,0)/values.length,min=Math.min(...values),max=Math.max(...values),complete=step===6;
 const select=(n:number)=>{setPlaying(false);setStep(n);};
 return <div className="agent-experiment">
  <div className="log-analysis" data-complete={complete}>
   <div className="log-title"><span><i/> LOG ANALYSIS</span><small>サンプルデータ</small></div>
   <div className="sample-controls" role="group" aria-label="計測データ"><button aria-pressed={sample===0} onClick={()=>{setSample(0);select(0);}}>データ A</button><button aria-pressed={sample===1} onClick={()=>{setSample(1);select(0);}}>データ B</button><span>処理時間 / ms</span></div>
   <div className="sample-chart" aria-label="3件の処理時間">{values.map((value,i)=><div key={i}><span>RUN {String(i+1).padStart(2,"0")}</span><div><i style={{width:`${value/30*100}%`}}/></div><strong>{value.toFixed(1)}</strong></div>)}</div>
   <div className="analysis-result" aria-live="polite"><div><small>平均</small><strong>{complete?mean.toFixed(1):"—"}<span> ms</span></strong></div><div><small>最小 / 最大</small><strong>{complete?`${min.toFixed(1)} / ${max.toFixed(1)}`:"—"}<span> ms</span></strong></div></div>
   <button className="summary-action" onClick={()=>select(6)}>{complete?"再計算する":"要約を計算"}<span aria-hidden="true">↗</span></button>
   <p className="analysis-status">{complete?`3件を集計済み。合計 ${values.reduce((a,b)=>a+b,0).toFixed(1)} ms ÷ 3件。`:"データを選び、要約を計算できます。"}</p>
   <small className="analysis-method">数値はブラウザー内で計算。生成AIの推論結果ではありません。</small>
  </div>
  <div className="execution-explanation">
   <div className="experiment-caption"><span>実行例</span><small>固定工程のデモ · AI未接続</small></div>
   <h2>計測ログを読み、統計を報告する</h2>
   <p className="experiment-intro">入力の確認 → ツールで集計 → 結果の照合。実際のAgentは観測結果に応じて、次の操作を選びます。</p>
   <div className="execution-track" aria-label="Agentの工程">{agentSteps.map((item,i)=><button key={item.phase+i} aria-label={`${i+1} ${item.title}`} aria-current={i===step?"step":undefined} onClick={()=>select(i)}><span>{i+1}</span><small>{item.phase}</small></button>)}</div>
   <div className="execution-detail" aria-live="polite"><span>STEP {String(step+1).padStart(2,"0")}</span><h3>{agentSteps[step].title}</h3><p>{agentSteps[step].action}</p><code>{agentSteps[step].code}</code></div>
   <div className="execution-controls"><button aria-label="前のステップ" disabled={step===0} onClick={()=>select(step-1)}>←</button><button disabled={complete&&!playing} onClick={()=>setPlaying(v=>!v)}>{playing?"一時停止":"工程を再生"}</button><button disabled={complete} onClick={()=>select(step+1)}>次の工程 →</button><button aria-label="Agentデモをリセット" onClick={()=>select(0)}>↺</button></div>
  </div>
 </div>;
}
