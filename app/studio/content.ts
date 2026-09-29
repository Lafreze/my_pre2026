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
  { title: "Agentの構成と実行過程", en: "INSIDE AN AGENT", time: 130, range: "5:00–7:10", view: "monitor" as ViewId, question: "Agentの構成と実行過程", point: "Harnessの中で、文脈・判断・操作・フィードバックをつなぐ", old: ["agent", "mcp", "harness", "engineering"], next: "Harnessの枠とLoopの経路を示す。「動きを見る」で修正・再検査・交付を再生し、上限や障害で止まる例も確認。", script: "Agentの構成を、実行の流れに沿って説明します。外側のHarnessは実行を管理する枠組みです。モデルを呼び出し、ツールへの要求を実行に回し、状態や権限、回数・時間の制限を管理します。枠は責任の整理であり、モデルやツールが同じ場所にあるという意味ではありません。Contextには、指示、関連資料、ツール結果、履歴の要約を入れ、毎回の判断に合わせて更新します。Memoryは情報の保持、RAGは必要な資料を検索して文脈に加える方法で、Contextと同じ意味ではありません。Modelはこの文脈から次の操作を判断し、ツール呼び出しや回答を生成します。Toolsは検索、読み取り、計算、編集、実行の手段です。結果を次の文脈へ戻す回路がLoopです。Loopという別の部品が判断するのではなく、更新された文脈を受け取ったモデルが次の一手を判断します。実行例は、小さなWebページを作る説明用シミュレーションです。コードを生成し、ブラウザーで確認すると、ボタンが画面幅を超えていると分かります。この結果を文脈に戻し、幅を修正して再検査します。受入条件は、320ピクセル幅で表示でき、ボタンを操作できることです。「できた」という回答だけでは完了にしません。条件を満たした記録と成果物を渡します。回数の上限に達した時や権限がなく進めない時は、未解決の点を伝えて人の判断を求めます。検証には、タスクに応じてテスト、ルール、モデル、人を使います。役割の境界は実装によって異なり、画面は仕組みを伝えるための簡略図です。" },
  { title: "AIを活用した製品開発", en: "AI PRODUCT DEVELOPMENT", time: 170, range: "7:10–10:00", view: "checklist" as ViewId, question: "AIを活用した製品開発", point: "この発表画面も、Codexとつくりました。", old: ["vibe", "adoption", "takeaway"], next: "五つの工程を選び、人とAIの役割を見る。「競争力」で議論を開き、最後は自由探索へ。", script: "では、アイデアを製品にする時、AIとどう進めるのでしょうか。例えば実験ログの差分を手作業で探すのが大変だ、という困りごとを考えます。これは説明用の企画例です。まず、誰がどの場面で困るのかを確かめます。次に、二つのCSVを比較して差を見る、という小さな価値に絞り、できたと判断する条件を決めます。AIと仕様や画面を整理し、端から端まで動く試作をつくります。それを実際の入力で試し、元の値と照合し、使う人に触ってもらう。最後に使い方、データの扱い、運用や保守を整えて、小さく届けます。この発表画面もCodexで実装し、操作して気づいたことを伝え直しながらつくっています。つくる手間が減っても、役に立つかを選ぶ仕事は残ります。そこで、競争力はどこにあるのか。私は、現場の困りごとを理解すること、固有の知識やデータ、何を作らないかも含めて選ぶこと、必要な人に届けて信頼を積み重ねることが大切だと考えます。画像処理で培った評価の観点も、AIとものをつくる時に活かせるはずです。皆さんの仕事の中で、自分たちだから気づける困りごとはどこにあるでしょうか。ありがとうございました。" },
];
export const sourceChecked = "2026-09-29";
export const sources = [
  ...llmMilestones.map(era=>({title:era.source,date:era.year,url:era.url,note:era.shift})),
  { title: "DeepSeek-R1", date:"2025-01-22",url:"https://arxiv.org/abs/2501.12948",note:"強化学習による推論能力の研究例。Agentの実行環境とは区別。" },
  { title: "An Image is Worth 16×16 Words", date: "2020-10-22", url: "https://arxiv.org/abs/2010.11929", note: "ViTの原論文。大規模事前学習の結果と、本人の個別タスクの体験を区別。" },
  { title: "Function calling", date: "現行ドキュメント", url: "https://developers.openai.com/api/docs/guides/function-calling", note: "モデルによる操作要求と、アプリケーションによるツール実行を区別。" },
  { title: "Scaling Managed Agents", date: "2026-04-08", url: "https://www.anthropic.com/engineering/managed-agents", note: "Harnessによるモデル呼び出しとツールのルーティング。実行管理と配置場所を区別。" },
  { title: "Building effective agents", date: "2024-12-19", url: "https://www.anthropic.com/engineering/building-effective-agents", note: "あらかじめ決めたWorkflowと、結果に応じて進むAgentの違い。構成を考えるための資料。" },
  { title: "Codex documentation", date: "現行ドキュメント", url: "https://learn.chatgpt.com/docs", note: "Codexの公式資料。発表中の利用体験・職歴は本人提供の内容。" },
];
export const agentParts = [
  { id: "model", name: "Model", ja: "次の一手を判断", detail: "現在の文脈から、次のツール呼び出し、回答、確認の依頼を生成する。" },
  { id: "context", name: "Context", ja: "毎回更新される文脈", detail: "指示、関連資料、ツール結果、履歴の要約をまとめ、次の判断に渡す。" },
  { id: "tools", name: "Tools", ja: "情報取得・操作", detail: "検索・読み取り・計算・編集・実行の手段。実行結果や失敗理由を返す。" },
  { id: "harness", name: "Harness", ja: "実行を管理する枠組み", detail: "モデルを呼び出し、ツール実行を調整。状態を保ち、権限・回数・時間の制限を適用する。" },
  { id: "loop", name: "Loop", ja: "結果を次の判断へ戻す経路", detail: "ツールの結果を文脈に戻し、次のモデル呼び出しへつなぐ。独立した判断主体ではない。" },
];
export const legacyTopics = [
  ["intro", "自己紹介", "個人"], ["cover", "表紙", "背景"], ["manifesto", "論点", "背景"], ["overview", "全体像 / 3D Atlas", "仕組み"], ["timeline", "年表", "背景"], ["agent", "Agent / Tool Use", "仕組み"], ["mcp", "MCP", "仕組み"], ["concepts", "用語整理", "仕組み"], ["vibe", "Vibe Coding", "制作"], ["commodity", "Product価値", "制作"], ["engineering", "Engineering Stack", "仕組み"], ["harness", "Harness / Loop", "仕組み"], ["reasoning", "Reasoning", "背景"], ["media", "画像・音声・動画", "背景"], ["open-local", "Open / Local", "背景"], ["trust", "Evals / Security", "検証"], ["adoption", "社内導入", "検証"], ["synthesis", "3層モデル", "仕組み"], ["takeaway", "まとめ", "背景"], ["sources", "出典", "出典"],
];
export const agentSteps = [
  { phase:"目標", node:"context", title:"Webページの条件を定義", action:"紹介ページを制作。受入条件は、320px幅で表示が収まり、ボタンを操作できること。", code:"条件：横の超過なし / クリック応答あり" },
  { phase:"生成", node:"model", title:"コードを生成", action:"ModelがHTMLとCSSの編集を要求。Harnessがツール実行に回し、ファイルを保存する。", code:"Model → edit_file(HTML, CSS)" },
  { phase:"検査", node:"tools", title:"ブラウザーで確認", action:"保存結果を文脈に追加。ブラウザーで320px幅の表示と、ボタンのクリック応答を調べる。", code:"browser.check(width: 320, click: true)" },
  { phase:"観測", node:"context", title:"ボタンの幅超過を発見", action:"ボタンの右端が画面幅を64px超過。検査結果をContextに追加し、修正判断の材料にする。", code:"右端 384px − 画面幅 320px = +64px" },
  { phase:"修正", node:"model", title:"検査結果に基づいて修正", action:"Modelが固定幅の変更を要求。Harnessが編集を実行する。この時点では、まだ完了としない。", code:"width: 100%; box-sizing: border-box;" },
  { phase:"再検査", node:"tools", title:"受入条件で再検査", action:"幅の超過がなく、クリック応答もあることを確認。再検査の結果を次の文脈へ戻す。", code:"overflow: 0px / click: OK / 検査 2回" },
  { phase:"完了", node:"harness", title:"成果物と検査結果を渡す", action:"受入条件を満たした記録を確認して終了。実装と検査結果をまとめ、利用者に渡す。", code:"HTML + CSS / 320px検査・操作確認の記録" },
];
