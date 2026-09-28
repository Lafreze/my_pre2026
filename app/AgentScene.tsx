"use client";
import { useState } from "react";
import { useRunner } from "./LabControls";
import { Scene, Playback, Signal } from "./SceneControls";

export function AgentScene({active}:{active:boolean}) {
  const [scenario,setScenario]=useState(0);
  const runner=useRunner(active,12,280);
  const phase=Math.min(4,Math.floor(runner.step/3));
  const flows=[
    ["MESSAGE","LLM",scenario===1?"ASK ?":"回答","利用者","転記"],
    scenario===2?["FORM","RULE","API ×","RETRY","HUMAN"]:["FORM","RULE",scenario===1?"INPUT ?":"API",scenario===1?"WAIT":"CHECK",scenario===1?"WAIT":"DRAFT"],
    scenario===2?["GOAL","PLAN","API ×","OBSERVE","RECOVER"]:["GOAL","PLAN",scenario===1?"ASK ?":"TOOLS",scenario===1?"WAIT":"VERIFY",scenario===1?"WAIT":"DRAFT"],
  ];
  const results=[phase<2?"…":scenario===1?"日付待ち":"申請文",phase<4?"…":scenario===2?"担当者へ":scenario===1?"日付待ち":"DRAFT-042",phase<4?"…":scenario===2?"保存状態を確認 ✓":scenario===1?"日付待ち":"DRAFT-042 ✓"];
  return <Scene name="Chatbot Workflow Agent" className="controller-scene"><div className="scene-toolbar"><div className="scene-tabs" role="group" aria-label="実行条件">{["通常","情報不足","APIエラー"].map((label,index)=><button type="button" key={label} aria-pressed={scenario===index} onClick={()=>{setScenario(index);runner.reset();}}>{label}</button>)}</div><span className="scene-demo">DEMO</span></div><div className="controller-lanes">{["CHATBOT","WORKFLOW","AGENT"].map((name,lane)=>{
    const stopped=scenario===1&&phase>=2;
    const current=stopped?2:phase;
    const points:[number,number][]=[[45,90],[135,90],[225,90],[315,90],[315,190]];
    if(lane===2&&scenario===2){points[3]=[225,190];points[4]=[135,190];}
    return <article className="controller-lane" key={name} data-lane={lane} data-scenario={scenario} data-status={stopped?"waiting":phase===4?"done":"running"}><header><span>0{lane+1}</span><b>{name}</b><i/></header><div className="controller-track"><svg preserveAspectRatio="none" viewBox="0 0 360 255" aria-hidden="true"><path d={lane===2&&scenario===2?"M45 90H225V190H135V90":"M45 90H315V190"} className="wire"/>{lane===2&&<path d="M135 90V215H315V90" className="wire loop-wire"/>}{runner.step>0&&<Signal points={points} progress={stopped?.5:runner.step/12} color={scenario===2&&phase===2?"#ed8e82":lane===2?"#58d6bf":"#76b4ef"}/>}</svg>{flows[lane].map((label,index)=><div className={`controller-node node-${index}`} key={`${index}-${label}`} data-active={index===current} data-complete={index<current}><span>{["▤","✦",scenario===2?"×":"⌘","◎","✓"][index]}</span><small>{label}</small></div>)}{lane===2&&<span className="controller-loop">↶</span>}</div><div className="controller-artifact" aria-live="polite"><span>{lane===0?"TEXT":"STATE"}</span><b>{results[lane]}</b><small>{phase===4?lane===0?"人が実行":scenario===2?lane===1?"上限で停止":"重複なし":scenario===1?"人へ質問":"承認前で停止":"大阪 / 出張申請"}</small></div></article>;
  })}</div><Playback runner={runner}/></Scene>;
}
