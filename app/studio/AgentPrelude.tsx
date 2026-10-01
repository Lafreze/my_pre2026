export default function AgentPrelude() {
  return <div className="agent-prelude">
    <header className="prelude-heading"><span className="model-eyebrow">TRANSFORMER → LLM → AGENT</span><h1 tabIndex={-1}>Transformerとの接点とAI活用の変化</h1></header>
    <div className="prelude-chapters">
      <article><span className="prelude-year">2017 <small>Transformer</small></span><h2>言語分野での成果</h2><p>機械翻訳で高い性能を示したTransformer。当時の画像処理業務では、活用の可能性を十分に実感できていなかった。</p></article>
      <article><span className="prelude-year">2020 <small>ViT</small></span><h2>画像認識への展開</h2><p>大規模事前学習を用いたViTは、画像認識でも高い性能を示した。後に担当タスクでも性能改善を経験し、Transformerの有効性を実感した。</p></article>
      <article><span className="prelude-year">2022 <small>GPTの初回利用</small></span><h2>文章生成能力との接点</h2><p>自然な文章生成に強い印象を受けた。一方、当初の認識は高度な対話支援であり、現在の実行支援への発展は想定していなかった。</p></article>
    </div>
    <div className="prelude-present"><span>現在の活用</span><div><h2>対話支援から、開発工程への応用</h2><p>情報収集、コード生成、実行結果の確認と修正にAIを活用。<br/>対話だけでなく、ツールと実行環境を組み合わせる利用へと広がっている。</p></div></div>
  </div>;
}
