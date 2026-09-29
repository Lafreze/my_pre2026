"use client";
import { Component, lazy, Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { chapters, objects, legacyTopics, sources, sourceChecked, type ObjectId, type ViewId } from "./content";
import ModelPresentation from "./ModelPresentation";
import "./studio.css";
import "./presentation.css";
import "./chapters.css";
import "./experiments.css";
import "./agentArchitecture.css";
import "./desktopStory.css";
const Canvas=lazy(()=>import("./StudioCanvas"));
class SceneBoundary extends Component<{children:ReactNode;fallback:ReactNode},{failed:boolean}>{state={failed:false};static getDerivedStateFromError(){return {failed:true};}render(){return this.state.failed?<div className="scene-error-page"><p>3Dを準備できませんでした。内容はこのままご覧いただけます。</p>{this.props.fallback}</div>:this.props.children;}}
const format=(seconds:number)=>`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,"0")}`;
export default function Studio(){
  const [chapter,setChapter]=useState(0),[mode,setMode]=useState<"guide"|"explore">("guide"),[overview,setOverview]=useState(true);
  const [reference,setReference]=useState(false),[referencePage,setReferencePage]=useState<string|null>(null),[query,setQuery]=useState(""),[category,setCategory]=useState("すべて");
  const [index,setIndex]=useState(false),[notes,setNotes]=useState(false),[elapsed,setElapsed]=useState(0),[timer,setTimer]=useState(false);
  const [step,setStep]=useState(0),[playing,setPlaying]=useState(false),[board,setBoard]=useState(0),[agentTab,setAgentTab]=useState<"parts"|"loop">("parts"),[part,setPart]=useState(0),[application,setApplication]=useState(0);
  const [skip,setSkip]=useState(0),[ready,setReady]=useState(false);
  const [profile,setProfile]=useState({name:"王 博",romanName:"WANG BO"});
  const dialog=useRef<HTMLDialogElement>(null),notesDialog=useRef<HTMLDialogElement>(null),lastFocus=useRef<HTMLElement|null>(null);
  const c=chapters[chapter],view:ViewId=overview?"room":c.view;
  useEffect(()=>{
    const init=requestAnimationFrame(()=>{
      try{
        const person=JSON.parse(localStorage.getItem("gen-ai-profile-v1")||"null");if(person)setProfile(old=>({...old,...person}));
        const saved=JSON.parse(sessionStorage.getItem("work-studio-v3")||"null");
        if(saved){setStep(Math.max(0,Math.min(6,Number(saved.step)||0)));}
      }catch{/* Local memory is optional. Each visit starts from the garden entrance. */}
      const oldSlide=new URLSearchParams(location.search).get("slide");if(oldSlide){setReferencePage(oldSlide);setReference(true);}setReady(true);
    });return()=>cancelAnimationFrame(init);
  },[]);
  useEffect(()=>{if(!ready)return;try{sessionStorage.setItem("work-studio-v3",JSON.stringify({step}));}catch{/* Storage may be disabled. */}},[ready,step]);
  useEffect(()=>{if(!timer||reference)return;const id=setInterval(()=>setElapsed(s=>s+1),1000);return()=>clearInterval(id);},[timer,reference]);
  useEffect(()=>{if(reference){lastFocus.current=document.activeElement as HTMLElement;dialog.current?.showModal();}else{dialog.current?.close();lastFocus.current?.focus();}},[reference]);
  useEffect(()=>{if(notes)notesDialog.current?.showModal();else notesDialog.current?.close();},[notes]);
  const go=useCallback((n:number)=>{setChapter(Math.max(0,Math.min(chapters.length-1,n)));setOverview(false);setIndex(false);setPlaying(false);setMode("guide");},[]);
  const explore=useCallback(()=>{setOverview(true);setMode("explore");setIndex(false);setPlaying(false);},[]);
  const openReference=useCallback(()=>{setReference(true);setPlaying(false);},[]);
  const select=useCallback((id:ObjectId)=>{
    if(id==="library"){openReference();return;}
    if(!overview&&id===c.view){if(id==="board")setBoard(b=>(b+1)%3);return;}
    go(objects.find(o=>o.id===id)!.chapter);
  },[go,openReference,overview,c.view]);
  const closeReference=()=>{setReference(false);setReferencePage(null);try{const person=JSON.parse(localStorage.getItem("gen-ai-profile-v1")||"null");if(person)setProfile(old=>({...old,...person}));}catch{/* Profile edits remain local to the archive. */}};
  useEffect(()=>{const key=(e:KeyboardEvent)=>{
    if(document.querySelector(".llm-background[open]")||reference||notes||e.defaultPrevented||(e.target as HTMLElement).closest("input,textarea,select,[contenteditable=true]"))return;
    if(e.key==="Escape"){explore();return;}
    if((e.target as HTMLElement).closest("button,a,summary"))return;
    if(e.key==="ArrowRight"||e.key==="ArrowDown"){e.preventDefault();go(chapter+1);}
    if(e.key==="ArrowLeft"||e.key==="ArrowUp"){e.preventDefault();go(chapter-1);}
    if(e.key==="Enter"&&overview){e.preventDefault();go(chapter);}
  };window.addEventListener("keydown",key);return()=>window.removeEventListener("keydown",key);},[chapter,go,reference,notes,overview,explore]);
  const presentation=(n:number)=><ModelPresentation chapter={n} active={chapter===n&&!overview&&!reference&&!notes} profile={profile} board={board} setBoard={setBoard} agentTab={agentTab} setAgentTab={setAgentTab} part={part} setPart={setPart} step={step} setStep={setStep} playing={playing} setPlaying={setPlaying} application={application} setApplication={setApplication} onNext={()=>go(n+1)} onExplore={explore}/>;
  const content=presentation(chapter),panels=chapters.map((ch,n)=>({id:ch.view,content:presentation(n)}));
  return <main className="work-studio model-led-studio" data-chapter={chapter} data-mode={mode} data-ready={ready} data-overview={overview} data-view={view}>
    <div className="studio-app" inert={reference||notes}>
      <header className="studio-header"><button className="studio-brand" aria-label="スタジオの全景に戻る" onClick={explore}><span className="studio-monogram">w<span>.</span></span><span>WANG BO</span></button><div className="studio-header-actions"><button className="studio-index-toggle" aria-expanded={index} aria-controls="studio-index" onClick={()=>setIndex(v=>!v)}>目次 <span>{index?"−":"+"}</span></button></div></header>
      {index&&<nav id="studio-index" className="studio-index" aria-label="章を選ぶ"><div className="studio-index-head"><span>A JOURNEY THROUGH FIVE OBJECTS</span><button onClick={()=>setIndex(false)} aria-label="目次を閉じる">×</button></div><div className="studio-mode" role="group" aria-label="表示モード"><button aria-pressed={!overview} onClick={()=>go(chapter)}>ストーリー</button><button aria-pressed={overview} onClick={explore}>自由探索</button></div>{chapters.map((ch,i)=><button className="studio-index-chapter" key={ch.title} aria-label={`${i+1} ${ch.title}`} aria-current={chapter===i&&!overview?"step":undefined} onClick={()=>go(i)}><span>{ch.title}</span><b>↗</b></button>)}<button className="studio-archive-entry" aria-label="参考資料" onClick={()=>{setIndex(false);openReference();}}>過去の資料 ↗</button><button className="studio-presenter" aria-label="講者モードを開く" onClick={()=>{setIndex(false);setNotes(true);}}>講者メモ・タイマー ↗</button></nav>}
      <div className="studio-body"><section className="studio-stage" aria-label="3Dスタジオ"><SceneBoundary fallback={content}><Suspense fallback={<div className="studio-loading">スタジオを準備しています…</div>}><Canvas overview={overview} view={view} chapter={chapter} paused={reference||notes} boardStep={board} review={0} onSelect={select} skipToken={skip} agentStep={step} panels={panels}/></Suspense></SceneBoundary><button className="studio-skip" onClick={()=>setSkip(n=>n+1)}>移動をスキップ →</button></section></div>
      {!overview&&<footer className="studio-footer"><div className="studio-location"><span className="studio-live-dot"/><span>{c.en}</span><small>{String(chapter+1).padStart(2,"0")+" / "+String(chapters.length).padStart(2,"0")}</small></div><div className="studio-navigation"><button aria-label="全景に戻る" onClick={explore}>⌂</button><button aria-label="前の章" disabled={chapter===0} onClick={()=>go(chapter-1)}>←</button><div className="journey-dots" aria-label="五つの章">{chapters.map((ch,i)=><button key={ch.title} aria-label={`${i+1}章 ${ch.title}`} aria-current={chapter===i?"step":undefined} onClick={()=>go(i)}><i/></button>)}</div><button aria-label="次の章" disabled={chapter===chapters.length-1} onClick={()=>go(chapter+1)}>→</button></div></footer>}
      <div className="studio-sr" aria-live="polite">第{chapter+1}章 {c.title}。{overview?"全景を表示中。":"モデルに直接表示しています。"}</div>
    </div>
    <dialog ref={dialog} className="studio-library-dialog" onKeyDown={e=>{if(e.key==="Escape"){e.preventDefault();closeReference();}}} onCancel={e=>{e.preventDefault();closeReference();}}><div className="studio-dialog-top"><div><span>THE REFERENCE SHELF</span><h2>参考資料 / フルバージョン</h2></div><button onClick={closeReference} aria-label="資料を閉じて元の章に戻る">元の章に戻る ×</button></div>{reference&&<>{referencePage?<><div className="studio-archive-bar"><button onClick={()=>setReferencePage(null)}>← 目次へ</button><p>参考資料 · 編集・並べ替えも利用できます</p><a href={`/reference/?slide=${encodeURIComponent(referencePage)}`} target="_blank" rel="noreferrer">別タブ ↗</a></div><iframe key={referencePage} title="旧版フルバージョン" src={`/reference/?slide=${encodeURIComponent(referencePage)}`} className="studio-legacy-frame"/></>:<div className="studio-library-content"><p>関連する20ページを収録。本編で扱わない年表・MCP・三層モデルも、ここから。制作時間など旧版の表現は当時の記述であり、検証済みの実績を意味しません。</p><div className="studio-library-search"><input type="search" aria-label="資料を検索" placeholder="テーマを探す：MCP、Agent、制作…" value={query} onChange={e=>setQuery(e.target.value)}/><select aria-label="資料の分類" value={category} onChange={e=>setCategory(e.target.value)}>{["すべて","個人","背景","仕組み","制作","検証","出典"].map(v=><option key={v}>{v}</option>)}</select></div><div className="studio-library-grid">{legacyTopics.filter(([,label,cat])=>(category==="すべて"||cat===category)&&label.toLowerCase().includes(query.toLowerCase())).map(([id,label,cat],i)=><button onClick={()=>setReferencePage(id)} key={id}><small>{cat}</small><span>{label}</span><b>{String(i+1).padStart(2,"0")} ↗</b></button>)}</div>{!legacyTopics.some(([,label,cat])=>(category==="すべて"||cat===category)&&label.toLowerCase().includes(query.toLowerCase()))&&<p>一致する資料がありません。別の言葉で検索してください。</p>}<div className="studio-source-list"><h3>このガイドの根拠</h3><p>確認日：{sourceChecked} · 公開年月と、資料を確認した日を区別しています。</p>{sources.map(s=><a href={s.url} key={s.title} target="_blank" rel="noreferrer"><time>{s.date}</time><b>{s.title} ↗</b><span>{s.note}</span></a>)}<a href="/studio/source-audit.json" target="_blank"><b>出典リンクの確認記録 ↗</b><span>到達確認と内容の検証を区別。未確認の記述は新しい主線に使用していません。</span></a><a href="/atlas/" target="_blank">旧版の独立3D Atlas ↗</a></div></div>}</>}</dialog>
    <dialog ref={notesDialog} className="studio-notes-dialog" onCancel={()=>setNotes(false)}><div className="studio-dialog-top"><div><span>PRESENTER NOTES · 画面共有時は閉じてください</span><h2>{String(chapter+1).padStart(2,"0")} {c.title}</h2></div><button onClick={()=>setNotes(false)}>閉じる ×</button></div><div className="studio-notes-content"><div className="studio-notes-clock"><b>{format(elapsed)}</b><span>全体の経過 / 目安 {format(chapters.reduce((sum,item)=>sum+item.time,0))}<br/>この章の目安 {c.time}秒（操作込み）</span><button onClick={()=>setTimer(v=>!v)}>{timer?"計時を停止":"計時を開始"}</button><button onClick={()=>{setTimer(false);setElapsed(0);}}>リセット</button></div><p className="studio-script">{c.script}</p><div className="studio-next-cue"><small>次の操作</small><p>{c.next}</p></div><p className="studio-footnote">発表者の操作で進行します。自動で章は切り替わりません。原資料：{c.old.join(" / ")}</p><div className="studio-demo-controls"><button disabled={chapter===0} onClick={()=>go(chapter-1)}>← 前の章</button><button disabled={chapter===chapters.length-1} onClick={()=>go(chapter+1)}>次の章 →</button></div></div></dialog>
  </main>;
}

