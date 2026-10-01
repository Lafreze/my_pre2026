"use client";
import {useEffect,useMemo,useState} from "react";
import {defaultPlace,forecastURL,liveEnvironment,parseConditions,previewEnvironment,type Conditions,type Daytime,type Place,type Season,type Weather} from "./environment";

export function useStudioWeather() {
  const [place,setPlace]=useState<Place>(defaultPlace),[mode,setMode]=useState<"live"|"preview">("live");
  const [season,setSeason]=useState<Season>("autumn"),[time,setTime]=useState<Daytime>("morning"),[weather,setWeather]=useState<Weather>("clear");
  const [reading,setReading]=useState<{place:Place;conditions:Conditions}|null>(null),[error,setError]=useState(""),[loading,setLoading]=useState(true),[retry,setRetry]=useState(0),[now,setNow]=useState(()=>Date.now());
  useEffect(()=>{
    const id=requestAnimationFrame(()=>{try{const p=JSON.parse(localStorage.getItem("studio-weather-place")||"null");if(p&&typeof p.name==="string"&&p.name.length<=100&&Number.isFinite(p.latitude)&&Math.abs(p.latitude)<=90&&Number.isFinite(p.longitude)&&Math.abs(p.longitude)<=180)setPlace(p);}catch{/* Optional city preference. */}});
    return()=>cancelAnimationFrame(id);
  },[]);
  useEffect(()=>{
    if(mode!=="live")return;
    let disposed=false,controller:AbortController|null=null;
    async function refresh(){
      if(document.hidden)return;
      controller?.abort();controller=new AbortController();const current=controller;
      setLoading(true);setError("");
      const timeout=setTimeout(()=>current.abort(),12000);
      try{
        const response=await fetch(forecastURL(place),{signal:current.signal});
        if(!response.ok)throw new Error("天気を取得できませんでした");
        const conditions=parseConditions(await response.json());
        if(Date.now()-conditions.timestamp>90*60000||conditions.timestamp-Date.now()>15*60000)throw new Error("最新の天気を確認できません");
        if(!disposed&&!current.signal.aborted){setReading({place,conditions});setNow(Date.now());}
      }catch{if(!disposed&&controller===current)setError("取得できませんでした");}
      finally{clearTimeout(timeout);if(!disposed&&controller===current)setLoading(false);}
    }
    void refresh();const poll=setInterval(()=>void refresh(),15*60000);
    const clock=setInterval(()=>{if(!document.hidden)setNow(Date.now());},60000);
    const visible=()=>{if(!document.hidden)void refresh();};document.addEventListener("visibilitychange",visible);
    return()=>{disposed=true;controller?.abort();clearInterval(poll);clearInterval(clock);document.removeEventListener("visibilitychange",visible);};
  },[mode,place,retry]);
  const current=reading?.place.latitude===place.latitude&&reading?.place.longitude===place.longitude?reading.conditions:null;
  const stale=!!current&&now-current.timestamp>90*60000;
  const environment=useMemo(()=>mode==="live"&&current?liveEnvironment(place,current,new Date(now)):previewEnvironment(season,time,weather),[mode,current,place,now,season,time,weather]);
  const changePlace=(next:Place)=>{setPlace(next);setMode("live");try{localStorage.setItem("studio-weather-place",JSON.stringify(next));}catch{/* Optional city preference. */}};
  return {place,mode,setMode,season,setSeason,time,setTime,weather,setWeather,current,environment,error,loading,stale,changePlace,retry:()=>setRetry(n=>n+1)};
}
