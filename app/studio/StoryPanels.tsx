import { llmMilestones, productSteps, advantages } from './storyDetails';

export function LLMDevelopment({ selected, onSelect }: { selected:number; onSelect:(n:number)=>void }) {
  const item=llmMilestones[selected];
  return <div className="llm-development">
    <div className="llm-era-rail" role="tablist" aria-label="LLMの発展の節目">{llmMilestones.map((era,i)=><button role="tab" aria-selected={selected===i} aria-controls="llm-era-detail" onClick={()=>onSelect(i)} key={era.name}><time>{era.year}</time><strong>{era.name}</strong><span>{era.short}</span></button>)}</div>
    <div className="llm-era-detail" id="llm-era-detail" role="tabpanel" aria-live="polite">
      <div className="llm-era-copy"><span className="model-eyebrow">{item.year} / {item.name}</span><h2>{item.title}</h2><p>{item.text}</p><div className="llm-terms">{item.terms.map(term=><span key={term}>{term}</span>)}</div></div>
      <aside className="llm-era-note"><span>主な変化</span><h3>{item.shift}</h3><p>{item.example}</p><div className="llm-context-glyph" data-era={selected} aria-hidden="true">{[0,1,2,3,4].map(i=><i key={i}/>)}<b>↗</b></div></aside>
    </div>
    <div className="llm-source-row"><p>代表的な変化の抜粋。各技術の起源や、全製品の公開順を示す年表ではありません。</p><a href={item.url} target="_blank" rel="noreferrer">{item.source} ↗</a>{item.secondUrl&&<a href={item.secondUrl} target="_blank" rel="noreferrer">{item.secondLabel} ↗</a>}</div>
  </div>;
}

export function ProductJourney({ selected,onSelect }: { selected:number;onSelect:(n:number)=>void }) {
  const step=productSteps[selected];
  return <div className="product-journey">
    <p className="product-intro">Agentを活用したソフトウェア開発の基本的な進め方。検証結果に応じて、前の工程を見直す。</p>
    <div className="product-step-rail" role="tablist" aria-label="Agentを活用した製品開発の工程">{productSteps.map((s,i)=><button key={s.en} id={`product-step-${i}`} role="tab" aria-selected={i===selected} aria-controls="product-step-detail" onClick={()=>onSelect(i)}><small>{s.en}</small><strong>{s.name}</strong></button>)}</div>
    <section className="product-step-detail" id="product-step-detail" role="tabpanel" aria-labelledby={`product-step-${selected}`} aria-live="polite"><header><span className="model-eyebrow">{step.en}</span><h2>{step.title}</h2></header><div className="product-responsibilities"><article><h3>人による判断</h3><p>{step.human}</p></article><article><h3>Agentによる処理</h3><p>{step.ai}</p></article><article><h3>確認する成果</h3><p>{step.artifact}</p></article></div><p className="product-check"><b>確認事項</b>{step.criterion}</p></section>
    <p className="product-footnote">自動化できる範囲は、製品・実行環境・権限により異なる。本発表画面も、Codexによる実装と操作確認を反復して制作。</p>
  </div>;

}

export function ProductAdvantage() {
 return <div className="product-advantage"><p className="advantage-intro">生成AIの活用を成果につなげるには、<strong>課題設定・専門知識・品質評価・運用</strong>に関する判断が重要となる。</p><div className="advantage-grid">{advantages.map((item,i)=><article key={item.en}><span className="advantage-symbol" aria-hidden="true">{['⌕','▤','◇','↻'][i]}</span><span className="model-eyebrow">{item.en}</span><h2>{item.name}</h2><p>{item.text}</p><small>{item.example}</small></article>)}</div><div className="advantage-closing"><p>専門性をどの業務に活かし、成果をどう評価するか。</p></div></div>;
}
