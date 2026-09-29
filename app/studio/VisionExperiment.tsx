"use client";
import { useState, type CSSProperties } from "react";
export default function VisionExperiment(){
 const [spread,setSpread]=useState(45),[patch,setPatch]=useState(5);
 return <div className="vision-experiment">
  <div className="patch-lab"><div className="patch-scene" style={{"--spread":spread/100} as CSSProperties}>{Array.from({length:16},(_,i)=><button key={i} aria-label={`パッチ ${i+1}`} aria-pressed={patch===i} onClick={()=>setPatch(i)} style={{"--row":Math.floor(i/4)-1.5,"--col":i%4-1.5,"--tone":`${105+(i*17)%70}`} as CSSProperties}><span>{String(i+1).padStart(2,"0")}</span></button>)}</div><label className="patch-slider">画像<span>パッチ列</span><input type="range" min="0" max="100" value={spread} aria-label="パッチの分離" onChange={e=>setSpread(Number(e.target.value))}/></label></div>
  <div className="vision-explanation"><div className="vision-model-change"><span>VGG</span><b>→</b><strong>ViT</strong></div><p>私の画像分類タスクでは、<strong>VGGからViTへの変更で性能が改善。</strong></p><div className="patch-pipeline"><span>PATCH {String(patch+1).padStart(2,"0")}</span><i>→</i><span>Embedding</span><i>→</i><span>Transformer</span></div><p className="patch-description">ViTは画像をパッチに分割し、埋め込みと位置情報を使って処理します。</p><small>4×4の概念図。分割数・色は説明用で、実測のAttentionではありません。</small></div>
 </div>;
}
