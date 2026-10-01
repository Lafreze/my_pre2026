export const productSections = [
  {id:"process", label:"開発プロセス", title:"AIを活用した製品開発", next:"従来の開発との比較へ"},
  {id:"comparison", label:"開発の比較", title:"開発における役割分担の変化", next:"専門性と貢献へ"},
  {id:"value", label:"競争力", title:"生成AI時代の専門性と貢献", next:"発表のまとめへ"},
  {id:"summary", label:"まとめ", title:"生成AIの活用と、人の役割", next:"庭を自由に探索する"},
] as const;
export type ProductSection = typeof productSections[number]["id"];

const comparison = [
  {phase:"調査・設計", before:"人が資料やコードを調査し、設計案を整理する。", after:"Agentが調査・設計案を提示し、人が要件と方針を決定する。"},
  {phase:"実装", before:"人がコードを記述し、開発ツールを操作する。", after:"Agentがコードを変更し、人が差分と実装方針を確認する。"},
  {phase:"検証・修正", before:"人がテスト・CIの結果を分析し、修正する。", after:"Agentが検証と修正を反復し、人が受入条件で評価する。"},
  {phase:"公開・運用", before:"人が公開を判断し、監視・自動化を用いて運用する。", after:"Agentが準備・調査を支援し、人が公開と運用を判断する。"},
];

export function DevelopmentComparison() {
  return <section className="development-comparison" aria-label="従来の開発とAgentを活用した開発の比較">
    <p className="comparison-intro">作業の一部をAgentに委ねることで、人は目的の明確化と成果の評価に注力できる。</p>
    <table><caption className="studio-sr">代表的な開発工程における役割分担</caption><thead><tr><th scope="col">工程</th><th scope="col">従来の開発</th><th scope="col">Agentを活用する開発</th></tr></thead><tbody>{comparison.map(row=><tr key={row.phase}><th scope="row">{row.phase}</th><td>{row.before}</td><td>{row.after}</td></tr>)}</tbody></table>
    <div className="comparison-boundary"><span>変わらない要件</span><p>解決すべき課題、品質基準、公開判断の責任を明確にする。</p></div>
    <p className="comparison-note">代表的な進め方の比較。従来も自動化やCI/CDを利用する。委任できる範囲と効果は、課題・環境・権限により異なる。</p>
  </section>;
}

export function PresentationConclusion() {
  return <section className="presentation-conclusion" aria-label="発表のまとめ">
    <p className="conclusion-intro">生成AIの利用は、回答の生成から、ツールを通じた実装・検証の支援へ広がっている。</p>
    <div className="conclusion-points">
      <article><span className="model-eyebrow">CAPABILITY</span><h2>生成から実行へ</h2><p>モデルの出力をツールによる操作につなぎ、製品開発の工程を支援する。</p></article>
      <article><span className="model-eyebrow">SYSTEM</span><h2>結果を次の判断へ</h2><p>Harnessが実行と制限を管理し、Agent Loopが結果を文脈に反映する。</p></article>
      <article><span className="model-eyebrow">CONTRIBUTION</span><h2>専門性を成果へ</h2><p>人が課題・評価基準を定め、品質と運用を判断する。業務知識が活用の基盤となる。</p></article>
    </div>
    <div className="conclusion-note"><span>今後の検討</span><p>担当業務での適用範囲と、成果を確認する評価方法。</p></div>
    <p className="conclusion-signature">王 博 <span>WANG BO</span></p>
  </section>;
}
