"use client";
import {useEffect,useRef,useState} from "react";
import {seasons,times,weathers,type Daytime,type Place,type Season,type Weather} from "./environment";
import type {useStudioWeather} from "./useStudioWeather";

export default function EnvironmentMenu({state,motion,onMotion,onCamera}:{state:ReturnType<typeof useStudioWeather>;motion:boolean;onMotion:()=>void;onCamera:(command:"closer"|"farther"|"reset")=>void}) {
  const [query,setQuery]=useState(""),[results,setResults]=useState<Place[]>([]),[searchStatus,setSearchStatus]=useState(""),[locating,setLocating]=useState(false);
  const request=useRef<AbortController|null>(null),alive=useRef(true);
  useEffect(()=>{alive.current=true;return()=>{alive.current=false;request.current?.abort();};},[]);
  async function search(){
    request.current?.abort();const controller=new AbortController();request.current=controller;
    setResults([]);if(query.trim().length<2){setSearchStatus("都市名を2文字以上で入力してください");return;}
    setSearchStatus("検索中…");const timeout=setTimeout(()=>controller.abort(),10000);
    try{
      const response=await fetch(`https://geocoding-api.open-meteo.com/v1/search?${new URLSearchParams({name:query.trim(),count:"5",language:"ja",format:"json"})}`,{signal:controller.signal});
      if(!response.ok)throw new Error("search");
      const data=await response.json();
      if(!alive.current||request.current!==controller)return;
      const places=(Array.isArray(data.results)?data.results:[]).filter((r:Record<string,unknown>)=>typeof r.name==="string"&&typeof r.latitude==="number"&&typeof r.longitude==="number").map((r:{name:string;admin1?:string;country?:string;latitude:number;longitude:number})=>({name:[r.name,r.admin1,r.country].filter((v,i,a)=>v&&a.indexOf(v)===i).join(" · "),latitude:r.latitude,longitude:r.longitude}));
      setResults(places);setSearchStatus(places.length?"":"見つかりませんでした。英語名でも検索できます。");
    }catch{if(alive.current&&request.current===controller)setSearchStatus("都市を検索できませんでした");}finally{clearTimeout(timeout);}
  }
  function locate(){
    if(!navigator.geolocation){setSearchStatus("位置情報を利用できません");return;}
    setLocating(true);setSearchStatus("");navigator.geolocation.getCurrentPosition(p=>{if(!alive.current)return;state.changePlace({name:"現在地",latitude:Math.round(p.coords.latitude*100)/100,longitude:Math.round(p.coords.longitude*100)/100});setLocating(false);setResults([]);},()=>{if(alive.current){setLocating(false);setSearchStatus("位置情報を取得できません。都市名で設定できます。");}},{enableHighAccuracy:false,timeout:12000,maximumAge:300000});
  }
  const c=state.current;
  return <details className="environment-menu"><summary aria-label="環境設定"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.4 1.4m11.2 11.2L19 19M5 19l1.4-1.4M17.6 6.4L19 5"/></svg></summary><div className="environment-panel living-environment">
    <div className="environment-mode" role="group" aria-label="環境モード"><button aria-pressed={state.mode==="live"} onClick={()=>state.setMode("live")}>いまの天気</button><button aria-pressed={state.mode==="preview"} onClick={()=>state.setMode("preview")}>季節・天気を試す</button></div>
    {state.mode==="live"?<>
      <div className="weather-current" aria-live="polite"><strong>{state.place.name}</strong><span>{c?`${weathers[c.weather]} · ${Math.round(c.temperature)}°C`:state.loading?"天気を読み込み中…":"プレビュー表示"}</span><small>{state.error?`${state.error} · ${c?"前回の天気を表示":"プレビュー表示"}`:state.stale?"更新待ち · 前回の天気を表示":c?`${new Intl.DateTimeFormat("ja-JP",{timeZone:c.timezone,hour:"2-digit",minute:"2-digit"}).format(c.timestamp)} 更新 · 現地時間` :"東京が初期設定です"}</small>{(state.error||state.stale)&&<button onClick={state.retry}>再取得</button>}</div>
      <details className="weather-place"><summary>場所を変更</summary><form onSubmit={e=>{e.preventDefault();void search();}}><input aria-label="天気の都市名" placeholder="東京 / Tokyo" value={query} maxLength={80} onChange={e=>setQuery(e.target.value)}/><button type="submit">検索</button></form>{results.map(p=><button className="weather-result" key={`${p.latitude},${p.longitude}`} onClick={()=>{state.changePlace(p);setResults([]);setSearchStatus("");}}>{p.name}</button>)}<button onClick={locate} disabled={locating}>{locating?"位置情報を取得中…":"現在地を使用"}</button><small role="status">{searchStatus}</small></details>
      <a className="weather-credit" href="https://open-meteo.com/" target="_blank" rel="noreferrer">Weather · Open-Meteo ↗</a>
    </>:<div className="environment-selects"><label>季節<select aria-label="季節" value={state.season} onChange={e=>state.setSeason(e.target.value as Season)}>{Object.entries(seasons).map(([v,t])=><option key={v} value={v}>{t}</option>)}</select></label><label>時間<select aria-label="時間帯" value={state.time} onChange={e=>state.setTime(e.target.value as Daytime)}>{Object.entries(times).map(([v,t])=><option key={v} value={v}>{t}</option>)}</select></label><label>天気<select aria-label="天気" value={state.weather} onChange={e=>state.setWeather(e.target.value as Weather)}>{Object.entries(weathers).map(([v,t])=><option key={v} value={v}>{t}</option>)}</select></label><small>プレビュー · 実際の観測とは異なります</small></div>}
    <button className="environment-motion" aria-label="庭の動き" aria-pressed={motion} onClick={onMotion}>室内・庭の動き <b>{motion?"ON":"OFF"}</b></button>
    <div className="garden-camera-tools" role="group" aria-label="全景のカメラ"><button aria-label="庭を縮小" onClick={()=>onCamera("farther")}>−</button><button aria-label="庭の視点を戻す" onClick={()=>onCamera("reset")}>視点を戻す</button><button aria-label="庭を拡大" onClick={()=>onCamera("closer")}>＋</button></div>
  </div></details>;
}
