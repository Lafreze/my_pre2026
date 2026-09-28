"use client";
import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { useRunner } from "./LabControls";
import { Scene, Playback } from "./SceneControls";

function Landscape({ time=0, night=false }: {time?:number;night?:boolean}) {
  const id=useId().replaceAll(":","");
  return <svg preserveAspectRatio="xMidYMid slice" className="landscape" viewBox="0 0 900 480" role="img" aria-label="月明かり、山並み、湖"><defs><linearGradient id={`${id}-sky`} x2="0" y2="1"><stop stopColor={night?"#091b3b":"#7885ae"}/><stop offset="1" stopColor={night?"#435479":"#e7b0a1"}/></linearGradient><linearGradient id={`${id}-water`} x2="0" y2="1"><stop stopColor="#557d8e"/><stop offset="1" stopColor="#16394c"/></linearGradient><linearGradient id={`${id}-moon`} x2="0" y2="1"><stop stopColor="#fff1c3" stopOpacity=".5"/><stop offset="1" stopColor="#d6e8ed" stopOpacity="0"/></linearGradient></defs><rect width="900" height="480" fill={`url(#${id}-sky)`}/>{Array.from({length:26},(_,i)=><circle key={i} cx={(i*137+43)%900} cy={(i*67+23)%220} r={i%3===0?1.6:1} fill="#fff6de" opacity={night?.7:.2}/>)}<circle cx={660-time*36} cy={90+time*20} r="40" fill="#f5e6c8"/><path d="M0 274 116 126 224 241 363 91 531 270 703 179 900 298V480H0Z" fill="#34445e"/><path d="m305 159 58-68 58 66-42-20-16 17-22-16Z" fill="#b9c5d1" opacity=".65"/><path d={`M0 330 172 ${242-time*4} 331 314 522 198 714 326 900 231V480H0Z`} fill="#1a3849"/><path d="M0 352Q238 323 480 350T900 340V480H0Z" fill={`url(#${id}-water)`}/><path d="m647 352-73 128h169l-67-128Z" fill={`url(#${id}-moon)`}/>{Array.from({length:9},(_,i)=><path key={i} d={`M${480+i*9+time*15} ${364+i*12}h${250-i*17}`} stroke="#b9d3d5" opacity={.18-i*.01} strokeWidth="1"/>)}<g transform={`translate(${time*50} 0)`}><path d="M157 386h82l-18 13h-47Z" fill="#0b2431"/><path d="M198 384v-47l-20 47Z" fill="#edd3ad"/><path d="M201 343v40h24Z" fill="#c4d4cb"/></g><path d="M0 455q70-65 166 25H0Z" fill="#102a32"/><g stroke="#132b36" fill="none" strokeWidth="4"><path d="M28 442V302m0 20-23 31m23-15 30 28m-30-7-31 29m31-6 42 37"/></g></svg>;
}
export function MediaScene({active}:{active:boolean}) {
  const [mode,setMode]=useState(1),[night,setNight]=useState(true),[playingAudio,setPlayingAudio]=useState(false);
  const runner=useRunner(active,120,75);
  const audio=useRef<HTMLAudioElement>(null);
  useEffect(()=>{if(!active||mode!==2)audio.current?.pause();},[active,mode]);
  const text="静かな湖に、\nひとつの灯り。\n次の一歩は、ここから。";
  return <Scene name="マルチモーダル作品" className="media-scene"><div className="media-format-rail" role="group" aria-label="メディア形式">{["TEXT","IMAGE","AUDIO","VIDEO"].map((label,index)=><button key={label} type="button" aria-label={label} aria-pressed={mode===index} onClick={()=>{setMode(index);runner.reset();}}><span>{["Aa","◈","≋","▷"][index]}</span>{label}</button>)}<span className="scene-demo">DEMO</span></div>
    <div className="media-screen" data-format={mode} data-night={night}>
      {(mode===1||mode===3) && <Landscape night={night} time={mode===3?runner.step/120:0}/>}
      {mode===0 && <div className="media-typeset" key={mode}><span>QUIET HORIZONS</span><p>{text.split("\n").map((line,index)=><span style={{"--line":index} as CSSProperties} key={line}>{line}</span>)}</p><i>01 — 03</i></div>}
      {mode===2 && <div className="sound-stage" data-playing={playingAudio}><div className="sound-disc"><span>☾</span><i/></div><div className="sound-wave" aria-hidden="true">{Array.from({length:48},(_,i)=><i key={i} style={{"--bar":i,"--height":`${15+Math.abs(Math.sin(i*1.71))*75}%`} as CSSProperties}/>)}</div><button type="button" className="sound-toggle" onClick={()=>{if(audio.current?.paused)void audio.current.play().catch(()=>{});else audio.current?.pause();}} aria-label={playingAudio?"音を停止":"音を再生"}>{playingAudio?"Ⅱ":"▶"}</button><span>QUIET HORIZONS · 0:03</span></div>}
      <div className="media-overlay"><span>QUIET HORIZONS</span>{(mode===1||mode===3)&&<button type="button" aria-label="昼夜を切り替え" aria-pressed={night} onClick={()=>setNight(value=>!value)}>{night?"☾":"☀"}</button>}<small>{["COPY 01","FRAME 01","SOUND 01",`${String(Math.round(runner.step/12)).padStart(2,"0")} : 10`][mode]}</small></div>
    </div>
    <audio ref={audio} src="/card-chime.wav" preload="none" onPlay={()=>setPlayingAudio(true)} onPause={()=>setPlayingAudio(false)} onEnded={()=>setPlayingAudio(false)} aria-label="静かな3音のベル"><track kind="captions" src="/card-chime.vtt" srcLang="ja" label="日本語" default/></audio>
    {mode===3 && <Playback runner={runner}/>}
  </Scene>;
}
