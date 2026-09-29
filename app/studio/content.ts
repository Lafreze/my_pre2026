import { llmMilestones } from "./storyDetails";
export type ObjectId = "name" | "notebook" | "board" | "monitor" | "checklist" | "library";
export type ViewId = ObjectId | "room";
export type CameraPreset = { position: [number, number, number]; target: [number, number, number]; span: number };
// The overview keeps its garden framing. Close-ups are calculated from the
// actual presentation planes in room.ts, so HTML and model share one camera.
export const cameras: Record<ViewId, CameraPreset> = {
  room: { position: [8, 9.5, 10], target: [.15, .8, .2], span: 16 },
  name: { position: [-1.4, 2.1, -.4], target: [-1.4, 2.1, -2.42], span: 1.5 },
  notebook: { position: [-1.79, 2, -1.58], target: [-1.79, .808, -1.58], span: .6 },
  board: { position: [.62, 1.81, 1], target: [.62, 1.81, -2.38], span: 2.4 },
  monitor: { position: [-.98, 1.213, -.6], target: [-.98, 1.213, -1.795], span: .8 },
  checklist: { position: [2.12, 2, 1.12], target: [2.12, .708, 1.127], span: .8 },
  library: { position: [4, 3.5, 5], target: [-2.5, 1, .35], span: 4.4 },
};
export const objects: { id: ObjectId; title: string; subtitle: string; chapter: number; anchor: [number, number, number] }[] = [
  { id: "name", title: "自己紹介", subtitle: "01 / MY JOURNEY", chapter: 0, anchor: [-1.4, 2.1, -2.41] },
  { id: "notebook", title: "画像分類でのTransformer活用", subtitle: "02 / FIELD NOTES", chapter: 1, anchor: [-1.74, .9, -1.45] },
  { id: "board", title: "LLMの発展と利用経験", subtitle: "03 / THE EVOLUTION", chapter: 2, anchor: [.7, 2.35, -2.33] },
  { id: "monitor", title: "Agentの構成と実行過程", subtitle: "04 / INSIDE AN AGENT", chapter: 3, anchor: [-.96, 1.48, -1.65] },
  { id: "checklist", title: "AIを活用した製品開発", subtitle: "05 / IDEAS INTO APPS", chapter: 4, anchor: [2.15, .75, .95] },
  { id: "library", title: "参考資料", subtitle: "ARCHIVE / 20 PAGES", chapter: -1, anchor: [-2.64, 1.9, .48] },
];
export const chapters = [
  { title: "自己紹介", en: "MY JOURNEY", time: 95, range: "0:00–1:35", view: "name" as ViewId, question: "はじめまして。王 博です。", point: "画像処理の開発と、今の仕事について。", old: ["intro"], next: "履歴のつながりから、筆記帳のTransformer体験へ。", script: "皆さん、こんにちは。王博です。これまで、画像処理の開発に携わってきました。今日は、自分がAIを使ってきた経験と、最近のAgentの使い方を紹介します。2023年より前はKIOXIAで、画像分類などに取り組んでいました。その時、VGGからViTへモデルを変えると、私のタスクでは性能が大きく改善しました。Transformerの力を最初に実感した経験です。一方で、データが少ない条件ではResNetの方がよい結果になることもありました。2023年にハイテクへ入社した後も、画像の次フレーム予測、画像分類、Active Learningなどに取り組んできました。現在はMulti Beamグループを兼任し、ADC関連の開発を中心に担当しています。画像処理の話から始めて、LLMの発展、Agentの仕組み、そしてアイデアを製品にしていく話へつなげたいと思います。どうぞよろしくお願いします。" },
  { title: "画像分類でのTransformer活用", en: "VISION TRANSFORMERS", time: 75, range: "1:35–2:50", view: "notebook" as ViewId, question: "モデルが変わると、\n見える可能性も変わる。", point: "VGG → ViT。画像分類で感じた、大きな変化。", old: ["intro", "reasoning"], next: "画像での驚きから、2022年のGPT体験へ。研究板に移動。", script: "先ほどのViTの話を、もう少し紹介します。VGGからViTへの変更で、同じ画像分類でも改善できる余地があることを実感しました。画像の部分どうしの関係を扱うTransformerに、可能性を感じたのです。ただし、これは私のデータと評価条件での経験です。特にデータが少ない学習条件では、ResNetの方が安定してよい結果になることもありました。大規模な事前学習を使うか、一から学習するかでも条件は変わります。モデル名だけで決めず、手元のデータで試して選ぶ。その経験が、その後のLLMの見方にもつながっています。" },
  { title: "LLMの発展と利用経験", en: "LLM DEVELOPMENT", time: 130, range: "2:50–5:00", view: "board" as ViewId, question: "「答える」から、\n「やり遂げる」へ。", point: "私の使い方は、会話 → 道具 → 仕事の一連の流れへ。", old: ["timeline", "agent", "concepts"], next: "六つの節目をたどり、「私の体験」で個人の使用歴を補足。次はモニターの内部構成へ。", script: "LLMの発展を、代表的な変化から見てみます。2017年のTransformerは、Attentionで文脈の関係を扱う土台です。その後、大量の文章で次のトークンを予測する事前学習が拡大し、GPT-3ではプロンプトに少数の例を入れて様々な課題を解く可能性が示されました。2022年には、指示と回答の例で学ぶSFTや、人のフィードバックを使うRLHFが、意図に応える使い方を支えます。私もこの年、初めてGPTを体験して、文章生成の力に驚きました。従来の自然言語処理がすべて不要になるというより、自然な言葉から試せる範囲が大きく増えた感覚です。さらに画像を含む入力へ広がり、ツールを通じて外部の情報や処理に接続するようになります。モデルが操作を要求し、プログラムが実行して結果を返す。私もAPIで日常作業を助ける簡単なツールをつくりました。今は、推論する力と、実装して確かめる仕組みを組み合わせる方向に進んでいます。私自身はOpenClawで個人Agentを組み、当時はまだ安定して任せられませんでしたが、Claude CodeやCodexを使う中で任せられる作業が広がったと感じています。画面の技術の発展と、私の体験は分けて見られます。個人の使用順は研究や製品の登場順ではありません。" },
  { title: "Agentの構成と実行過程", en: "INSIDE AN AGENT", time: 130, range: "5:00–7:10", view: "monitor" as ViewId, question: "Agentの構成と実行過程", point: "Model・Context・Tools・Harness・Loop", old: ["agent", "mcp", "harness", "engineering"], next: "5つの構成要素を選ぶ。「実行例」でデータを切り替え、集計結果を確認。", script: "Agentの構成は、ここでは五つの役割で整理します。Modelは文脈を受け取り、回答や次のツール呼び出しを選びます。Contextは今回の判断に見えている指示、資料、履歴です。Memoryは保持する情報、RAGは必要な資料を検索して文脈へ入れる方法で、同じものではありません。Toolsはファイル編集やテストなどの手段です。モデルが引数を出し、実行環境が処理し、結果や失敗理由を返します。MCPは接続を共通化する方法の一つです。Harnessは環境、権限、状態、記録、検証などを支えます。Loopは観測結果を受けて、継続、修正、完了、人への確認を選ぶ循環です。各部品を選ぶと、入力と出力、設計の要点が見られます。すべてのAgentが同じ構成で、長期記憶を必ず持つという意味ではありません。実行例では、計測ログを読み、形式と単位を確認し、ツールで平均・最小・最大を計算します。元データと照合してから、対象件数と根拠を添えて報告します。入力が不明な場合は確認に戻し、値を推測しません。画面の工程は固定した説明用デモですが、集計はブラウザー内で実際に計算しています。AIへの接続はありません。" },
  { title: "AIを活用した製品開発", en: "AI PRODUCT DEVELOPMENT", time: 170, range: "7:10–10:00", view: "checklist" as ViewId, question: "AIを活用した製品開発", point: "この発表画面も、Codexとつくりました。", old: ["vibe", "adoption", "takeaway"], next: "五つの工程を選び、人とAIの役割を見る。「競争力」で議論を開き、最後は自由探索へ。", script: "では、アイデアを製品にする時、AIとどう進めるのでしょうか。例えば実験ログの差分を手作業で探すのが大変だ、という困りごとを考えます。これは説明用の企画例です。まず、誰がどの場面で困るのかを確かめます。次に、二つのCSVを比較して差を見る、という小さな価値に絞り、できたと判断する条件を決めます。AIと仕様や画面を整理し、端から端まで動く試作をつくります。それを実際の入力で試し、元の値と照合し、使う人に触ってもらう。最後に使い方、データの扱い、運用や保守を整えて、小さく届けます。この発表画面もCodexで実装し、操作して気づいたことを伝え直しながらつくっています。つくる手間が減っても、役に立つかを選ぶ仕事は残ります。そこで、競争力はどこにあるのか。私は、現場の困りごとを理解すること、固有の知識やデータ、何を作らないかも含めて選ぶこと、必要な人に届けて信頼を積み重ねることが大切だと考えます。画像処理で培った評価の観点も、AIとものをつくる時に活かせるはずです。皆さんの仕事の中で、自分たちだから気づける困りごとはどこにあるでしょうか。ありがとうございました。" },
];
export const sourceChecked = "2026-09-29";
export const sources = [
  ...llmMilestones.map(era=>({title:era.source,date:era.year,url:era.url,note:era.shift})),
  { title: "DeepSeek-R1", date:"2025-01-22",url:"https://arxiv.org/abs/2501.12948",note:"強化学習による推論能力の研究例。Agentの実行環境とは区別。" },
  { title: "An Image is Worth 16×16 Words", date: "2020-10-22", url: "https://arxiv.org/abs/2010.11929", note: "ViTの原論文。大規模事前学習の結果と、本人の個別タスクの体験を区別。" },
  { title: "Function calling", date: "現行ドキュメント", url: "https://developers.openai.com/api/docs/guides/function-calling", note: "モデルによる操作要求と、アプリケーションによるツール実行を区別。" },
  { title: "Building effective agents", date: "2024-12-19", url: "https://www.anthropic.com/engineering/building-effective-agents", note: "あらかじめ決めたWorkflowと、結果に応じて進むAgentの違い。構成を考えるための資料。" },
  { title: "Codex documentation", date: "現行ドキュメント", url: "https://learn.chatgpt.com/docs", note: "Codexの公式資料。発表中の利用体験・職歴は本人提供の内容。" },
];
export const agentParts = [
  { id: "model", name: "Model", ja: "推論・生成", icon: "◈", detail: "目的と文脈を受け取り、推論・生成し、次の操作を選ぶ。", example: "目的と観測から、次の操作を選択" },
  { id: "context", name: "Context", ja: "入力情報", icon: "≋", detail: "指示、ファイル、会話、作業履歴。判断に必要な情報を渡す。", example: "要件 / コード / これまでの実行結果" },
  { id: "tools", name: "Tools", ja: "外部操作", icon: "⌘", detail: "ファイルの編集、実行、ブラウザー確認。操作は接続された環境が実行する。", example: "読む → 書く → 動かす → 確かめる" },
  { id: "harness", name: "Harness", ja: "実行管理", icon: "▧", detail: "実行環境、権限、状態、検証を管理し、作業の継続を支える。", example: "実行環境 / 接続 / 記録 / 制御" },
  { id: "loop", name: "Loop", ja: "反復制御", icon: "↻", detail: "結果を観察し、修正・再計画・完了・人への確認を選ぶ。", example: "Plan → Act → Observe → 次の判断" },
];
export const legacyTopics = [
  ["intro", "自己紹介", "個人"], ["cover", "表紙", "背景"], ["manifesto", "論点", "背景"], ["overview", "全体像 / 3D Atlas", "仕組み"], ["timeline", "年表", "背景"], ["agent", "Agent / Tool Use", "仕組み"], ["mcp", "MCP", "仕組み"], ["concepts", "用語整理", "仕組み"], ["vibe", "Vibe Coding", "制作"], ["commodity", "Product価値", "制作"], ["engineering", "Engineering Stack", "仕組み"], ["harness", "Harness / Loop", "仕組み"], ["reasoning", "Reasoning", "背景"], ["media", "画像・音声・動画", "背景"], ["open-local", "Open / Local", "背景"], ["trust", "Evals / Security", "検証"], ["adoption", "社内導入", "検証"], ["synthesis", "3層モデル", "仕組み"], ["takeaway", "まとめ", "背景"], ["sources", "出典", "出典"],
];
export const agentSteps = [
  { phase: "目的", title: "集計条件を定義", action: "処理時間の平均・最小・最大を、単位と件数を添えて報告する。", code: "mean / min / max · unit: ms" },
  { phase: "計画", title: "処理手順を分解", action: "データ取得、入力検証、集計、結果の照合に分ける。", code: "read → validate → aggregate → verify" },
  { phase: "入力", title: "ツールでデータを取得", action: "計測ログから3件の数値を読み込む。", code: 'read_csv("sample.csv") → 3 rows' },
  { phase: "検証", title: "入力の形式と単位を確認", action: "欠損・数値形式・単位を確認。不明な値は推測せず、確認に戻す。", code: "finite values ✓ / unit: ms ✓" },
  { phase: "集計", title: "統計を計算", action: "数値の集計はプログラムで実行し、結果を受け取る。", code: "mean = sum(values) / count(values)" },
  { phase: "照合", title: "元データと結果を照合", action: "件数と合計を再確認し、平均が最小値と最大値の間にあるか調べる。", code: "count = 3 · min ≤ mean ≤ max" },
  { phase: "報告", title: "根拠を添えて報告", action: "統計値・単位・対象件数を示す。データの原因までは断定しない。", code: "3 samples · descriptive statistics" },
];
