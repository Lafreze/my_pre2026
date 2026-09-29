"use client";
import { useState, type CSSProperties } from "react";
const stages=["画像","パッチ分割","トークン列"];
export default function VisionExperiment(){
 const [stage,setStage]=useState(0),[patch,setPatch]=useState(5),[info,setInfo]=useState(false);
 const patches=Array.from({length:16},(_,i)=>i);
 const style=(i:number)=>({backgroundPosition:`${i%4/3*100}% ${Math.floor(i/4)/3*100}%`,"--patch-index":i} as CSSProperties);
 return <>
  <div className="vision-practice">
   <section className="vit-mechanism" aria-label="ViTの原理の概念図">
    <div className="vit-stage-tabs" role="tablist" aria-label="画像からトークンへ">{stages.map((s,i)=><button key={s} role="tab" aria-selected={stage===i} aria-controls="vit-visual" onClick={()=>setStage(i)}><small>0{i+1}</small>{s}</button>)}</div>
    <div id="vit-visual" className="vit-visual" data-stage={stage} role="tabpanel">
     {stage<2?<div className="vit-image-grid" data-split={stage===1}>{patches.map(i=><button className="vit-image-patch" style={style(i)} key={i} aria-label={`パッチ ${i+1}`} aria-pressed={stage===1&&patch===i} tabIndex={stage===1?0:-1} onClick={()=>{setPatch(i);setStage(1);}}>{stage===1&&<span>{String(i+1).padStart(2,"0")}</span>}</button>)}</div>:<div className="vit-sequence"><div className="vit-sequence-heading"><span>全16パッチを順番に埋め込む</span><small>選択：{String(patch+1).padStart(2,"0")}</small></div><div className="vit-token-grid">{patches.map(i=><button key={i} className="vit-token" aria-label={`トークン ${i+1}`} aria-pressed={patch===i} onClick={()=>setPatch(i)}><i style={style(i)}/><span><b/ ><b/><b/></span><small>+ pos {i+1}</small></button>)}</div><p><b>[CLS]</b><span>＋ 全パッチの埋め込み ＋ 位置情報</span><i>→</i><span>Encoderへ</span></p></div>}
     <div className="vit-image-caption"><span>基板の傷を模した説明用画像</span><small>概念図</small><button aria-label="ViTの詳しい説明" aria-expanded={info} onClick={()=>setInfo(v=>!v)}>i</button></div>
    </div>
    <div className="vit-pipeline" aria-label="画像の分割、埋め込みと位置情報、Transformer、分類結果"><span>画像の分割<small>全パッチ</small></span><b>→</b><span>Patch embeddings<small>＋ 位置情報</small></span><b>→</b><span>Transformer<small>相互の関係を処理</small></span><b>→</b><span>分類結果<small>例：欠陥あり</small></span></div>
    {info&&<div className="vit-info" role="note"><button aria-label="ViTの説明を閉じる" onClick={()=>setInfo(false)}>×</button><strong>原論文の分類モデル</strong><p>全パッチを線形投影し、位置埋め込みと学習可能な[CLS]トークンを加えます。Encoderの[CLS]出力を分類ヘッドへ渡します。</p><small>選択は位置の対応を示します。図は説明用で、学習済みモデルの推論結果ではありません。</small></div>}
   </section>
   <aside className="vision-observations"><span className="model-eyebrow">私の画像分類タスクでの経験</span><div><small>OBSERVATION 01</small><h2>モデル変更で改善</h2><p>VGGからViTへの変更で、<br/>分類性能が改善しました。</p></div><div><small>OBSERVATION 02</small><h2>条件が変わると結果も変わる</h2><p>データが少ない条件では、<br/>ResNetが上回るケースもありました。</p></div><p className="vision-scope">個人の実験経験であり、一般則ではありません。</p></aside>
  </div>
  <p className="chapter-takeaway">モデルの選択は、<strong>データ量・事前学習・学習条件</strong>とセットで考える。</p>
 </>;
}
