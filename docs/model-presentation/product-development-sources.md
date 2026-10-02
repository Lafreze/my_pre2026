# 製品開発の変化と専門性

2026-10-02 整理。第四章は特定製品の性能比較や実証データではなく、LLM・Agentを使う開発の進め方と留意点を説明する発表資料。

- 「技術的な障壁が下がりつつある」は定性的な整理。「知識が不要」「誰でも安全な製品を自動で完成できる」とは表現しない。
- 早期の試作と段階的改善は従来からある反復開発。Agentは実装・検証の作業を支援し得るが、効果は要件と環境による。
- [Building effective agents](https://www.anthropic.com/engineering/building-effective-agents)（確認日2026-10-02）：ツール、環境からのフィードバック、人の関与・停止条件を含む実行過程の整理。
- [GitHub Copilot code review](https://docs.github.com/en/copilot/concepts/agents/code-review)（確認日2026-10-02）：レビュー結果の確認、見落としや誤りの可能性、人によるレビューの併用。コードや説明の生成成功を、品質保証とは扱わない。
- コード理解、アクセス制御、データの取扱い、受入条件の確認は、この発表で整理した実務上の観点。特定ツールの脆弱性発生率や作業短縮率は示さない。
- 個人履歴は本人からの最新指定に従う。2023年シス１配属、画質改善・前フレーム予測・画像分類・Active Learning、2025年からMulti Beamチーム兼務、クラスタリング・ADC関連開発。今回は本人指定の「前フレーム予測」を使用。

全屏実装の参考：[MDN Fullscreen API](https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API)（確認日2026-10-02）。ブラウザー主導の退出、fullscreenchange、APIが許可されない場合を個別に扱う。
