// Historical milestones use primary sources; personal memories are separate.
export const llmMilestones = [
  { year:"2017", name:"Transformer", short:"文脈を捉える", title:"Attentionによる系列の関係表現", text:"系列内の要素間の関係をAttentionで表現する。逐次処理への依存を減らし、学習の並列化を可能にした。", shift:"文脈の扱い方が変わる", example:"「それ」が指す対象を、周囲の言葉との関係から捉える。", terms:["Self-attention","並列学習","位置の情報"], source:"Attention Is All You Need · 2017", url:"https://arxiv.org/abs/1706.03762" },
  { year:"2018–20", name:"Pre-training", short:"汎用的な事前学習", title:"大規模事前学習とFew-shot学習", text:"GPT系列では次のトークンを予測する事前学習を拡大。GPT-3は、プロンプトに例を入れて様々な課題を解くFew-shotの可能性を示した。", shift:"用途ごとのモデルから、共通の基盤へ", example:"文章の例を渡して、翻訳・分類・要約へ切り替える。", terms:["次トークン予測","事前学習","In-context learning"], source:"Language Models are Few-Shot Learners · 2020", url:"https://arxiv.org/abs/2005.14165" },
  { year:"2022", name:"Instructions", short:"意図に応える", title:"指示学習と人のフィードバック", text:"SFT（教師あり微調整）とRLHF（人の評価に基づく強化学習）により、指示に沿う応答を学習。事前学習の規模と、指示への追従性をそれぞれ改善する。", shift:"自然言語の指示への追従", example:"「この文章を、初めて読む人向けに三点で要約して」。", terms:["SFT","人のフィードバック","RLHF"], source:"InstructGPT 論文 · 2022", url:"https://arxiv.org/abs/2203.02155" },
  { year:"2023", name:"Multimodal", short:"画像も文脈に", title:"画像とテキストの統合", text:"GPT-4の技術報告は、画像とテキストを入力するモデルを紹介。画像とテキストを併せて扱うことで、説明・確認の対象を拡大する。", shift:"画像を含む入力への対応", example:"グラフと説明文を入力し、解釈の妥当性を確認する。", terms:["画像＋テキスト","共通の文脈","認識の確認"], source:"GPT-4 Technical Report · 2023", url:"https://arxiv.org/abs/2303.08774" },
  { year:"2023–", name:"Tool Use", short:"外部とつなぐ", title:"ツールを介した検索・計算・操作", text:"モデルがツール名と引数を生成し、システムが実行する。取得情報や計算結果を、次のモデル呼び出しの文脈に反映する。", shift:"外部情報・実行結果の利用", example:"ログを読む → 集計を実行 → 結果を受け取って説明する。", terms:["構造化された呼び出し","実行環境","観測結果"], source:"Toolformer · 2023", url:"https://arxiv.org/abs/2302.04761", secondUrl:"https://developers.openai.com/api/docs/guides/function-calling", secondLabel:"実行の仕組み" },
  { year:"2024–", name:"Reason & Act", short:"推論と実行へ", title:"推論能力と実行ループの組み合わせ", text:"推論能力の学習が進む一方、Coding Agentはファイル編集やテストを反復。モデルの能力と、観測結果を使う実行ループの両方が重要となる。", shift:"実行結果に基づくタスクの反復", example:"実装 → テストの失敗を読む → 修正 → 同じ条件で再確認。", terms:["推論","Coding Agent","結果からの修正"], source:"SWE-agent · 2024 / DeepSeek-R1 · 2025", url:"https://arxiv.org/abs/2405.15793", secondUrl:"https://arxiv.org/abs/2501.12948", secondLabel:"推論の原論文" },
];
export const agentDetails = [
  { input:"指示・資料・直前の結果を含む文脈", output:"回答 / ツール名と引数 / 確認の依頼", design:"操作要求を生成するのはModel。実際の呼び出しや権限の適用はHarnessが担う。" },
  { input:"目標・関連資料・ツール結果・履歴", output:"次のモデル呼び出しに必要な情報", design:"Memoryは情報の保持。RAGは資料を検索して文脈に加える方法。長期記憶は必須ではない。" },
  { input:"ツール名・引数・呼び出しID", output:"取得した情報 / 処理結果 / 失敗理由", design:"読み取りや計算もToolsの役割。MCPは接続方法の一つで、Agentの必須条件ではない。" },
  { input:"モデル呼び出し・ツール・状態・権限", output:"継続 / 完了 / 上限で停止 / 人による判断", design:"実行ループを含む管理の枠組み。責任範囲は実装によって異なり、単一の配置場所を指さない。" },
  { input:"Context → Model → ツール実行 → 結果・観測 → Context", output:"文脈を更新して継続 / 完了 / 人による判断", design:"検索結果は直接文脈へ反映。コード変更後は必要に応じてテストを実行。Harnessが循環と停止を管理する。" },
];
export const productSteps = [
  { name:"課題定義", en:"DISCOVER", title:"対象業務と課題の定義", human:"業務の実態を観察し、利用者、作業手順、負担を特定する。", ai:"聞き取り項目を整理し、解決案と制約条件の検討を支援する。", artifact:"複数の実験ログから差分を手作業で抽出している状況を整理。", criterion:"対象の利用者、利用場面、改善目標を明確にする。" },
  { name:"仕様設計", en:"DEFINE", title:"最小限の仕様と受入条件", human:"入出力、対象範囲、完了と判断する基準を定義する。", ai:"画面案、仕様案、作業分担を提案し、不明確な条件を整理する。", artifact:"2つのCSVを比較し、差の大きい項目を一覧表示する仕様。", criterion:"欠損値、形式不一致、空データへの対応を規定する。" },
  { name:"実装", en:"BUILD", title:"入出力を一貫して確認できる試作", human:"入力例と利用条件を提示し、操作性と出力を確認する。", ai:"画面と比較処理を実装し、実行結果に基づいて修正する。", artifact:"読込・比較・元データの参照を一連の操作で実行できる試作。", criterion:"実際の入力に対し、想定した結果が得られることを確認する。" },
  { name:"検証", en:"VALIDATE", title:"機能の正しさと業務上の有効性", human:"業務上の例外を評価し、利用者による操作検証を行う。", ai:"テストを実行し、異常系や表示の不具合を確認する。", artifact:"元データとの照合結果と、利用者による操作検証の記録。", criterion:"誤検出、見落とし、確認作業に要する時間を評価する。" },
  { name:"運用", en:"DELIVER", title:"配布・運用・継続改善", human:"公開範囲、運用責任、改善の優先順位を決定する。", ai:"操作手順、エラー表示、記録機能、配布準備を支援する。", artifact:"限定的な試行導入から開始し、利用状況に基づいて改善。", criterion:"データ管理、権限、費用、保守体制を確認する。" },
];
export const advantages = [
  { name:"課題設定", en:"PROBLEM DEFINITION", text:"業務上の負担と制約を把握し、改善効果の高い課題を選定する。", example:"作業分析・利用者の要求整理" },
  { name:"専門知識とデータ", en:"DOMAIN KNOWLEDGE", text:"業務知識と適切なデータを提供し、生成結果の妥当性を判断する。", example:"評価基準・データ品質の管理" },
  { name:"設計・品質評価", en:"DESIGN & EVALUATION", text:"必要な機能と操作を設計し、受入条件に基づいて品質を検証する。", example:"設計レビュー・機能検証" },
  { name:"運用・改善", en:"OPERATIONS", text:"利用状況を継続的に確認し、不具合対応と改善の優先順位を決定する。", example:"検証記録・利用者からの評価" },
];
