import { llmMilestones, productSteps, advantages } from './storyDetails';

export function LLMDevelopment({ selected, onSelect }: { selected:number; onSelect:(n:number)=>void }) {
  const item=llmMilestones[selected];
  return <div className="llm-development">
    <div className="llm-era-rail" role="tablist" aria-label="LLMの発展の節目">{llmMilestones.map((era,i)=><button role="tab" aria-selected={selected===i} aria-controls="llm-era-detail" onClick={()=>onSelect(i)} key={era.name}><time>{era.year}</time><strong>{era.name}</strong><span>{era.short}</span></button>)}</div>
    <div className="llm-era-detail" id="llm-era-detail" role="tabpanel" aria-live="polite">
      <div className="llm-era-copy"><span className="model-eyebrow">{item.year} / {item.name}</span><h2>{item.title}</h2><p>{item.text}</p><div className="llm-terms">{item.terms.map(term=><span key={term}>{term}</span>)}</div></div>
      <aside className="llm-era-note"><span>何が変わった？</span><h3>{item.shift}</h3><p>{item.example}</p><div className="llm-context-glyph" data-era={selected} aria-hidden="true">{[0,1,2,3,4].map(i=><i key={i}/>)}<b>↗</b></div></aside>
    </div>
    <div className="llm-source-row"><p>代表的な変化の抜粋。各技術の起源や、全製品の公開順を示す年表ではありません。</p><a href={item.url} target="_blank" rel="noreferrer">{item.source} ↗</a>{item.secondUrl&&<a href={item.secondUrl} target="_blank" rel="noreferrer">{item.secondLabel} ↗</a>}</div>
  </div>;
}

export function ProductJourney({ selected,onSelect }: { selected:number;onSelect:(n:number)=>void }) {
  const step=productSteps[selected];
  return <div className="product-journey">
    <div className="product-brief"><span>ひとつの例</span><p>実験ログの差分を、もっと楽に確認したい。</p><small>説明用の企画例 / 実際の業務データは使用していません</small></div>
    <div className="product-step-rail" role="tablist" aria-label="アイデアから製品への工程">{productSteps.map((s,i)=><button key={s.en} role="tab" aria-selected={i===selected} aria-controls="product-step-detail" onClick={()=>onSelect(i)}><small>{s.en}</small><strong>{s.name}</strong><span aria-hidden="true">{i===4?'↻':'→'}</span></button>)}</div>
    <div className="product-step-detail" id="product-step-detail" role="tabpanel" aria-live="polite"><div className="product-deliverable"><span className="model-eyebrow">{step.en} / この段階で残すもの</span><h2>{step.title}</h2><p>{step.artifact}</p><div className="product-artifact" aria-hidden="true"><i/><i/><i/><span>{['現場のメモ','小さな仕様','動く試作','確認した結果','使われる製品'][selected]}</span><b>↗</b></div></div><div className="product-collaboration"><div><span>人が決める</span><p>{step.human}</p></div><div><span>AIと進める</span><p>{step.ai}</p></div><p className="product-check"><b>確認すること</b>{step.criterion}</p></div></div>
    <p className="product-footnote">この発表画面も、Codexで実装し、操作して気づいた点を伝え直してつくっています。</p>
  </div>;
}

export function ProductAdvantage() {
 return <div className="product-advantage"><p className="advantage-intro">実装にかかる手間が小さくなるほど、<strong>何を選び、どこまで確かめ、どう届けるか</strong>が問われる。私がこれから大切にしたいのは、この四つです。</p><div className="advantage-grid">{advantages.map((item,i)=><article key={item.en}><span className="advantage-symbol" aria-hidden="true">{['⌕','▤','◇','↻'][i]}</span><span className="model-eyebrow">{item.en}</span><h2>{item.name}</h2><p>{item.text}</p><small>{item.example}</small></article>)}</div><div className="advantage-closing"><span>皆さんと考えたいこと</span><p>自分たちだから気づける困りごとは、どこにあるでしょうか。</p></div></div>;
}
