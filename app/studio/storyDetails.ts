// Historical milestones use primary sources; personal memories are separate.
export const llmMilestones = [
  { year:"2017", name:"Transformer", short:"文脈を捉える", title:"Attentionによる系列の関係表現", text:"文中のどの部分を参照するかを学ぶ仕組み。系列を順番に処理する制約を減らし、大規模な学習につながる土台になりました。", shift:"文脈の扱い方が変わる", example:"「それ」が指す対象を、周囲の言葉との関係から捉える。", terms:["Self-attention","並列学習","位置の情報"], source:"Attention Is All You Need · 2017", url:"https://arxiv.org/abs/1706.03762" },
  { year:"2018–20", name:"Pre-training", short:"汎用の土台へ", title:"大規模事前学習とFew-shot学習", text:"GPT系列では次のトークンを予測する事前学習を拡大。GPT-3は、プロンプトに例を入れて様々な課題を解くFew-shotの可能性を示しました。", shift:"用途ごとのモデルから、共通の基盤へ", example:"文章の例を渡して、翻訳・分類・要約へ切り替える。", terms:["次トークン予測","事前学習","In-context learning"], source:"Language Models are Few-Shot Learners · 2020", url:"https://arxiv.org/abs/2005.14165" },
  { year:"2022", name:"Instructions", short:"意図に応える", title:"指示学習と人のフィードバック", text:"SFT（教師あり微調整）とRLHF（人の評価に基づく強化学習）により、指示に沿う応答を学習。事前学習の規模と、応答の使いやすさを分けて改善します。", shift:"言葉で頼めるインターフェースへ", example:"「この文章を、初めて読む人向けに三点で要約して」。", terms:["SFT","人のフィードバック","RLHF"], source:"InstructGPT 論文 · 2022", url:"https://arxiv.org/abs/2203.02155" },
  { year:"2023", name:"Multimodal", short:"画像も文脈に", title:"画像とテキストの統合", text:"GPT-4の技術報告は、画像とテキストを入力するモデルを紹介。画面や図を言葉と一緒に扱えることで、説明・確認の対象が広がります。", shift:"文章の対話から、見ながら話す体験へ", example:"グラフと説明文を一緒に渡し、読み取りを確かめる。", terms:["画像＋テキスト","共通の文脈","認識の確認"], source:"GPT-4 Technical Report · 2023", url:"https://arxiv.org/abs/2303.08774" },
  { year:"2023–", name:"Tool Use", short:"外部とつなぐ", title:"ツールを介した検索・計算・操作", text:"モデルがツール名と引数を出し、接続されたプログラムが実行。返ってきた観測結果を次の判断に使います。利用可能なツールに応じて、外部情報や計算結果を扱えます。", shift:"生成した答えを、現実の結果とつなぐ", example:"ログを読む → 集計を実行 → 結果を受け取って説明する。", terms:["構造化された呼び出し","実行環境","観測結果"], source:"Toolformer · 2023", url:"https://arxiv.org/abs/2302.04761", secondUrl:"https://developers.openai.com/api/docs/guides/function-calling", secondLabel:"実行の仕組み" },
  { year:"2024–", name:"Reason & Act", short:"推論と実行へ", title:"推論能力と実行ループの組み合わせ", text:"推論能力の学習が進む一方、Coding Agentはファイル編集やテストを反復。モデルの能力と、観測結果を使う実行ループの両方が重要になります。", shift:"一回の回答から、目標までの一連の仕事へ", example:"実装 → テストの失敗を読む → 修正 → 同じ条件で再確認。", terms:["推論","Coding Agent","結果からの修正"], source:"SWE-agent · 2024 / DeepSeek-R1 · 2025", url:"https://arxiv.org/abs/2405.15793", secondUrl:"https://arxiv.org/abs/2501.12948", secondLabel:"推論の原論文" },
];
export const agentDetails = [
  { input:"目的・指示・現在の文脈", output:"回答 / ツール名と引数", design:"精度だけでなく、待ち時間・費用・ツール選択の安定性も、実際のタスクで比べる。", example:"例：失敗したテストを読み、次に確認するファイルを選ぶ。" },
  { input:"指示・資料・履歴・検索結果", output:"今回の判断に必要な情報", design:"Contextは今見えている情報。Memoryは保持する情報。RAGは必要な資料を検索して文脈に加える方法。", example:"例：仕様書の該当部分と、直前の実行結果を渡す。" },
  { input:"ツール名・引数・呼び出しID", output:"結果 / 失敗理由 / 観測", design:"入力形式と返り値を明確に。MCPは接続の共通化を助けるが、権限や実行の責任は実行環境にある。", example:"例：read_file、編集、テスト、ブラウザーでの表示確認。" },
  { input:"設定・許可・作業状態", output:"管理された実行と記録", design:"実行環境、権限、ログ、状態の保存、検証、再試行を管理。役割分担は実装によって異なる。", example:"例：変更差分を残す。失敗を追跡する。外部公開は確認を挟む。" },
  { input:"目的と前回の実行結果", output:"継続 / 修正 / 完了 / 人へ", design:"「できた」という文章だけで完了にしない。終了条件、回数・時間の上限、判断を人へ戻す条件を決める。", example:"例：同じテストが通るまで直し、結果を添えて渡す。" },
];
export const productSteps = [
  { name:"課題定義", en:"DISCOVER", title:"対象業務と課題を定義", human:"実際の作業を観察し、困る場面と現在のやり方を言葉にする。", ai:"聞き取りの論点を整理し、解決案と見落とした条件を出す。", artifact:"実験担当者が、複数ログの差分を毎回手作業で探している。", criterion:"「何を作るか」の前に、誰がいつ使うかを決める。" },
  { name:"仕様設計", en:"DEFINE", title:"最小の仕様と受け入れ条件", human:"必要な入力・出力と、できたと判断する条件を選ぶ。", ai:"画面案、仕様、作業の分け方を提案する。曖昧な点を洗い出す。", artifact:"2つのCSVを読み込み、差の大きい項目を一覧にする。", criterion:"空欄・形式違い・データなしでも、次に何をすべきか分かる。" },
  { name:"実装", en:"BUILD", title:"入力から出力までの試作", human:"例のデータと使う状況を渡す。触って違和感を伝える。", ai:"画面と処理を実装し、動かしてエラーを読み、修正する。", artifact:"読み込み → 比較 → 元の値を確認、までを一度通せる。", criterion:"見た目だけでなく、実際の入力から出力まで確かめる。" },
  { name:"検証", en:"VALIDATE", title:"機能の正しさと業務上の有効性", human:"現場の例外や誤りを判断し、使う人の反応を見る。", ai:"テスト、画面サイズ、失敗ケースを確認し、変更差分を整理する。", artifact:"比較結果を元データと照合。実際の担当者に操作してもらう。", criterion:"誤検出や見落とし、確認にかかる手間を調べる。" },
  { name:"運用", en:"DELIVER", title:"配布・運用・継続改善", human:"公開範囲、運用担当、優先する改善を決める。", ai:"使い方、エラー表示、記録、配布の準備を手伝う。", artifact:"小さく使い始め、利用状況と要望を次の改善へ戻す。", criterion:"データの扱い・権限・費用・保守も、製品の一部。" },
];
export const advantages = [
  { name:"課題の理解", en:"UNDERSTAND", text:"誰が、どの場面で困るかを知る。機能を増やす前に、解く価値のある課題を選ぶ。", example:"例：現場の作業を見て、本当の待ち時間を見つける。" },
  { name:"固有の知識とデータ", en:"KNOW", text:"業務の文脈、判断の基準、良いデータ。汎用モデルに、その場で必要な知識を渡せること。", example:"画像処理で培った評価の観点も、ここにつながる。" },
  { name:"設計と品質の判断", en:"DESIGN", text:"何を作らないかを決める。迷わない操作、伝わる説明、細部の品質を選び取る。", example:"候補を生成する速さに、判断する理由を加える。" },
  { name:"運用と信頼", en:"EARN TRUST", text:"必要な人に届け、結果を確かめ、直し続ける。使われる関係と運用を積み重ねる。", example:"不具合への対応、検証記録、利用者との対話。" },
];
