"use client";
import { useState } from "react";
import { useRunner } from "./LabControls";
import { Scene, Playback, Signal } from "./SceneControls";

export function CloudLocalScene({active}:{active:boolean}) {
  const [network,setNetwork]=useState(true),[privateData,setPrivateData]=useState(false),[gpu,setGpu]=useState(true);
  const [target,setTarget]=useState<"cloud"|"local">("local");
  const runner=useRunner(active,8,260);
  const blocked=target==="cloud"?(!network||privateData):!gpu;
  const progress=blocked?Math.min(.9999,runner.step/4):runner.step/8;
  const route:[number,number][]=target==="local"?[[145,172],[340,172],[340,262]]:blocked?[[145,172],privateData?[470,172]:[220,172]]:[[145,172],[470,172],[525,172],[525,92],[690,92]];
  const status=runner.step===0?"READY":blocked&&runner.step>=4?"BLOCKED":runner.step===8?"COMPLETE":"PROCESSING";
  const send=(next:"cloud"|"local")=>{setTarget(next);runner.reset();runner.play();};
  const reset=()=>runner.reset();
  return <Scene name="Cloud / Local データフロー" className="cloud-scene"><div className="scene-toolbar"><div className="scene-tabs"><button type="button" aria-pressed={network} onClick={()=>{setNetwork(value=>!value);reset();}}>{network?"◉ ONLINE":"○ OFFLINE"}</button><button type="button" aria-pressed={privateData} onClick={()=>{setPrivateData(value=>!value);reset();}}>{privateData?"▣ 社内文書":"◇ 公開情報"}</button><button type="button" aria-pressed={gpu} onClick={()=>{setGpu(value=>!value);reset();}}>{gpu?"GPU ON":"GPU OFF"}</button></div><span className="scene-demo">DEMO</span></div>
    <div className="scene-canvas-scroll"><div className="cloud-map" data-target={target} data-status={status}><svg preserveAspectRatio="none" viewBox="0 0 800 360" aria-hidden="true"><rect x="20" y="25" width="430" height="310" rx="26" className="network-boundary"/><path d="M470 15V340" strokeDasharray="5 8" className="network-border"/><path d="M145 172H340V262" className={`wire ${target==="local"?"selected":""}`}/><path d="M145 172H525V92H690" className={`wire ${target==="cloud"?"selected":""}`}/>{runner.step>0&&<Signal points={route} progress={progress} color={blocked&&runner.step>=4?"#f1787e":"#62d9c7"}/>}<circle cx="340" cy="172" r="5" className="wire-joint"/></svg>
    <span className="boundary-label">ORGANIZATION</span><div className="network-document" draggable onDragStart={event=>{event.dataTransfer.setData("application/x-scene-document","document");event.dataTransfer.effectAllowed="copy";}}><i>▤</i><b>{privateData?"INTERNAL":"PUBLIC"}</b><span>report.pdf</span><em/><em/><em/></div>
    <button type="button" className="network-node node-local" onClick={()=>send("local")} onDragOver={event=>{if(event.dataTransfer.types.includes("application/x-scene-document"))event.preventDefault();}} onDrop={event=>{event.preventDefault();if(event.dataTransfer.getData("application/x-scene-document"))send("local");}} aria-label="Localで処理" data-online={gpu}><i>▦</i><b>LOCAL</b><small>{gpu?"GPU READY":"POWER OFF"}</small></button>
    <button type="button" className="network-node node-cloud" onClick={()=>send("cloud")} onDragOver={event=>{if(event.dataTransfer.types.includes("application/x-scene-document"))event.preventDefault();}} onDrop={event=>{event.preventDefault();if(event.dataTransfer.getData("application/x-scene-document"))send("cloud");}} aria-label="Cloudで処理" data-online={network}><i>☁</i><b>CLOUD</b><small>{network?"CONNECTED":"OFFLINE"}</small></button>
    <div className="network-output" role="status"><span className="status-led" data-status={status}/><b>{status}</b><code>{status==="BLOCKED"?target==="cloud"?privateData?"DATA BOUNDARY":"NETWORK OFFLINE":"GPU UNAVAILABLE":status==="COMPLETE"?"SUMMARY → 3 POINTS":"report.pdf"}</code></div></div></div>
    <div className="scene-metrics"><span>ROUTE<b>{target.toUpperCase()}</b></span><span>外部送信<b>{target==="cloud"&&!blocked&&runner.step===8?"1":"0"}</b></span><span>DATA<b>{privateData?"INTERNAL":"PUBLIC"}</b></span><button type="button" onClick={reset} aria-label="フローをリセット">↺</button></div>
  </Scene>;
}

const toolNames=["FILES","DATABASE","BROWSER","API","INTERNAL TOOLS","WORKFLOW"];
const toolCalls=[['read_policy','{"section":"travel"}','§3 / 30,000 JPY'],['lookup_employee','{"id":"DEMO-01"}','SYSTEM-1'],['lookup_route','{"to":"大阪"}','14,000 JPY'],['create_draft','{"cost":24000}','DRAFT-042'],['validate_form','{"id":"DRAFT-042"}','PASS'],['prepare_review','{"id":"DRAFT-042"}','AWAITING APPROVAL']];
export function ProtocolScene({active}:{active:boolean}) {
  const [connected,setConnected]=useState([0,3]),[selected,setSelected]=useState(0),[over,setOver]=useState(false);
  const runner=useRunner(active,10,180);
  const connect=(index:number,toggle=false)=>{if(!Number.isInteger(index)||index<0||index>5)return;setSelected(index);setConnected(current=>toggle&&current.includes(index)?current.filter(item=>item!==index):[...new Set([...current,index])]);runner.reset();};
  const destination=40+selected*55;
  const p=runner.step/10;
  const canSend=connected.includes(selected);
  return <Scene name="MCP接続ネットワーク" className="protocol-scene"><div className="scene-toolbar"><div className="protocol-stats"><span>{String(connected.length).padStart(2,"0")}</span>CONNECTIONS</div><span className="scene-demo">DEMO</span></div><div className="scene-canvas-scroll"><div className="protocol-map">
    <svg preserveAspectRatio="none" viewBox="0 0 800 360" aria-hidden="true"><path d="M165 180H365" className="wire selected"/>{toolNames.map((_,index)=><path key={index} d={`M405 180C540 180 540 ${40+index*55} 665 ${40+index*55}`} className={`wire protocol-wire ${connected.includes(index)?"connected":""} ${selected===index?"selected":""}`}/>)}{runner.step>0&&canSend&&<Signal points={p<=.5?[[165,180],[380,180],[545,destination],[665,destination]]:[[665,destination],[545,destination],[380,180],[165,180]]} progress={p<=.5?p*2:(p-.5)*2} color={p<=.5?"#70d9d0":"#c3afff"}/>}</svg>
    <div className="protocol-host" onDragOver={event=>{if(event.dataTransfer.types.includes("application/x-mcp-port")){event.preventDefault();setOver(true);}}} onDragLeave={()=>setOver(false)} onDrop={event=>{event.preventDefault();setOver(false);const raw=event.dataTransfer.getData("application/x-mcp-port");if(raw!=="")connect(Number(raw));}} data-over={over}><span>HOST</span><b>AI APP</b><div className="client-ports">{connected.map(index=><i key={index}>CLIENT {index+1}<em/></i>)}</div></div>
    <button type="button" className="protocol-hub" disabled={!canSend} onClick={()=>{runner.reset();runner.play();}} aria-label="MCPリクエストを送る"><span>MCP</span><i>{runner.playing?"↔":"▶"}</i></button>
    <div className="protocol-servers">{toolNames.map((name,index)=><button type="button" key={name} draggable onDragStart={event=>{event.dataTransfer.setData("application/x-mcp-port",String(index));event.dataTransfer.effectAllowed="copy";}} aria-pressed={connected.includes(index)} onClick={()=>connect(index,true)}><i>{connected.includes(index)?"●":"○"}</i><span>{name}</span><small>{String(index+1).padStart(2,"0")}</small></button>)}</div>
    </div></div><div className="protocol-packet" aria-live="polite"><span>{!canSend?"DISCONNECTED":runner.step===0?"READY":runner.step<=5?"REQUEST →":"← RESPONSE"}</span><code>{!canSend?toolNames[selected]:runner.step===0?toolNames[selected]:runner.step<=5?`${toolCalls[selected][0]} ${toolCalls[selected][1]}`:toolCalls[selected][2]}</code><button type="button" onClick={runner.reset} aria-label="MCPをリセット">↺</button></div></Scene>;
}

export function ConceptScene({active}:{active:boolean}) {
  const [rag,setRag]=useState(true),[mcp,setMcp]=useState(true),[agent,setAgent]=useState(true);
  const runner=useRunner(active,agent?8:4,340);
  const stage=Math.min(3,Math.floor(runner.step/2));
  const toggle=(fn:typeof setRag)=>{fn(value=>!value);runner.reset();};
  const complete=runner.step===runner.last;
  return <Scene name="LLM RAG MCP Agent" className="concept-scene"><div className="scene-toolbar"><div className="scene-tabs"><button type="button" aria-pressed={rag} onClick={()=>toggle(setRag)}>RAG</button><button type="button" aria-pressed={mcp} onClick={()=>toggle(setMcp)}>MCP</button><button type="button" aria-pressed={agent} onClick={()=>toggle(setAgent)}>AGENT</button></div><span className="scene-demo">DEMO</span></div><div className="concept-machine" data-agent={agent} data-stage={stage}>
      <div className="agent-orbit" aria-hidden="true"><span>PLAN</span><span>ACT</span><span>VERIFY</span><span>AGENT</span></div>
      <div className="concept-resource" data-enabled={rag}><div className="document-stack"><i>§3</i><i>旅費規程</i><i>30,000 JPY</i></div><b>RAG</b><span>{rag?"CONTEXT READY":"OFF"}</span></div>
      <div className="concept-model"><span>LLM</span><div className="model-neurons" aria-hidden="true">{Array.from({length:9},(_,i)=><i key={i}/>)}</div><small>{runner.playing?"GENERATING":"MODEL"}</small></div>
      <div className="concept-resource" data-enabled={mcp}><div className="tool-stack"><i>⌘</i><b>create_draft</b><code>{'{cost:24000}'}</code></div><b>MCP</b><span>{mcp?"TOOL READY":"OFF"}</span></div>
      <div className="concept-stream stream-input" data-on={rag&&runner.step>0}/><div className="concept-stream stream-output" data-on={mcp&&runner.step>3}/>
    </div><div className="concept-task"><span>大阪 / 出張申請</span><button type="button" onClick={()=>{runner.reset();runner.play();}} aria-label="出張申請を実行">▶</button><span className="concept-receipt" aria-live="polite">{complete?<><b>{mcp?"DRAFT-042":"申請文"}</b><small>{rag?"§3 引用":"出典 —"} · {agent?"VERIFIED / 承認待ち":"SINGLE RESPONSE"}</small></>:<><b>{runner.playing?["PLAN","CONTEXT","ACTION","VERIFY"][stage]:"READY"}</b><small>10/05 · 24,000 JPY</small></>}</span></div><Playback runner={runner}/></Scene>;
}
