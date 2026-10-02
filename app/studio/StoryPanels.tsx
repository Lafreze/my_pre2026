import { llmMilestones } from './storyDetails';

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
