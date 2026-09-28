export type ObjectId = "name" | "notebook" | "board" | "monitor" | "cards" | "checklist" | "library";
export type ViewId = ObjectId | "room";
export type CameraPreset = { position: [number, number, number]; target: [number, number, number]; span: number };
export const cameras: Record<ViewId, CameraPreset> = {
  room: { position: [8, 9.5, 10], target: [0, .85, 0], span: 12.1 },
  name: { position: [3.1, 2.9, 4.2], target: [-1.32, .86, -1.25], span: 3.75 },
  notebook: { position: [2.3, 3.6, 3.8], target: [-1.3, .78, -1.25], span: 3.5 },
  board: { position: [2.2, 2.8, 5.2], target: [.7, 1.7, -2.3], span: 4.5 },
  monitor: { position: [1, 2.3, 3.5], target: [-1.35, 1, -1.5], span: 3.25 },
  cards: { position: [5.5, 4.7, 6.5], target: [1.6, .62, 1], span: 3.5 },
  checklist: { position: [5.1, 4.7, 6.5], target: [1.8, .67, 1], span: 3.6 },
  library: { position: [4, 3.5, 5], target: [-2.5, 1, .35], span: 4.4 },
};
export const objects: { id: ObjectId; title: string; subtitle: string; chapter: number; anchor: [number, number, number] }[] = [
  { id: "name", title: "私について", subtitle: "01 / PROFILE", chapter: 0, anchor: [-1.63, .89, -1.30] },
  { id: "notebook", title: "小さなアイデア", subtitle: "02 / NOTEBOOK", chapter: 1, anchor: [-1.74, .9, -1.45] },
  { id: "board", title: "回答から、実行へ", subtitle: "04 / RESEARCH", chapter: 3, anchor: [.7, 2.35, -2.33] },
  { id: "monitor", title: "Agentの仕事場", subtitle: "05 / WORKBENCH", chapter: 4, anchor: [-.96, 1.48, -1.65] },
  { id: "cards", title: "Day Cardをひく", subtitle: "06 / PLAY & MAKE", chapter: 5, anchor: [1.33, .9, 1.05] },
  { id: "checklist", title: "人が確かめること", subtitle: "07 / REVIEW", chapter: 6, anchor: [2.15, .75, .95] },
  { id: "library", title: "参考資料", subtitle: "ARCHIVE / 24 PAGES", chapter: 2, anchor: [-2.64, 1.9, .48] },
];
export const chapters = [
  { title: "自己紹介", en: "A LITTLE ABOUT ME", time: 40, range: "0:00–0:40", view: "name" as ViewId, question: "小さなアイデアを、\n動くものに。", point: "AI Agentとつくる、私のワークスタジオ", bullets: ["日常の気づきを、試せる形へ。"], old: ["intro"], next: "「最近、取り組んでいること」を開く。", script: "皆さん、こんにちは。王博です。2023年に中途入社し、シス1に配属されました。2025年からはMulti Beamチームも兼務しています。今日は、私が生成AIをどう使って、小さなアイデアを動くものにしているかを紹介します。技術の名前を一つずつ覚えるというより、仕事の進め方がどう変わるのかを、一緒に見ていただければと思います。この部屋は、日々の試行錯誤を表した、発表用のワークスタジオです。" },
  { title: "最近の関心", en: "FROM A SMALL IDEA", time: 45, range: "0:40–1:25", view: "notebook" as ViewId, question: "思いついたら、\n試してみたい。", point: "最近の関心は、CodexなどのCoding Agent。", bullets: ["言葉で、体験の目標を伝える", "動くものを見て、次を考える"], old: ["vibe", "manifesto"], next: "筆記帳を開いてから「スタジオへ」。", script: "最近、特に関心を持っているのは、CodexなどのCoding Agentです。例えば、ちょっと気分を切り替えられるカードのページがあったら面白い、と考えます。以前なら、アイデアをメモしたところで止まることもありました。今は、どんな操作をして、どんな反応が返ってほしいかを言葉にして、まず動く形を試せます。大切なのは、一度の指示ですべて完成させることではありません。手元で触り、違和感を見つけ、もう一度伝える。その小さな往復に、私は可能性を感じています。" },
  { title: "私のワークスタジオ", en: "A PLACE TO TRY THINGS", time: 35, range: "1:25–2:00", view: "room" as ViewId, question: "ここから、\nつくってみる。", point: "気づく、つくる、触る、直す。", bullets: ["机で、考えを形にする", "作品台で、使い心地を確かめる", "資料棚で、仕組みに立ち戻る"], old: ["overview", "game-process"], next: "研究ボードへ。物件からも移動できます。", script: "少し引いて、部屋全体を見てみましょう。奥の机は、思いつきを書き留め、Agentと制作する場所です。壁のボードには、その仕組みを整理しました。手前のテーブルでは、できた作品を実際に触れます。横の本棚には、詳しい技術説明と、元の発表資料を残しています。観察して、記録して、つくって、試して、直す。この流れを、今日は部屋の中を移動しながらたどります。気になる物から開くこともできます。" },
  { title: "回答から、タスクの実行へ", en: "ANSWERS → ACTIONS", time: 90, range: "2:00–3:30", view: "board" as ViewId, question: "答えの先に、\n何ができる？", point: "変わったのは、モデルの周りにある仕組み。", bullets: ["LLM：推論と生成", "Tool Use：外部の操作を実行", "Agent：結果を見て、次の行動へ"], old: ["agent", "timeline", "concepts"], next: "ボードの3つの項目を選択。次にモニターへ。", script: "まず、文章を生成することと、タスクを実行することは分けて考えます。LLMは、文脈をもとに推論や生成を行います。しかし、コードを提案するだけでは、ファイルは変わりません。Tool Useでは、システムがモデルの要求を受けて、ファイルの編集やブラウザーの確認といった外部操作を実行します。Agentは、目標とその結果を受け取り、次に何をするかを選びながら進みます。決まった順序で処理するWorkflowも有効で、両方を組み合わせられます。最近の公開例では、CodexのWindows対応によって、普段の開発環境で作業と確認を進めやすくなりました。また、長い作業の実行環境をモデル側の処理から分ける設計も議論されています。モデルだけでなく、その周囲の道具と環境を見ることが大切です。" },
  { title: "Agentが働く仕組み", en: "INSIDE THE WORKBENCH", time: 125, range: "3:30–5:35", view: "monitor" as ViewId, question: "うまくいかなければ、\nどう進める？", point: "Plan → Act → Observe → Verify", bullets: ["目標を、確認できる条件にする", "操作の結果を、次の判断に戻す", "条件を満たしたら、止める"], old: ["agent", "mcp", "harness", "engineering"], next: "1ステップずつ進む。狭い画面の失敗と修正を比較。", script: "ここでは、カードを引いて結果を見る小さなページを例にします。これは実際のAgentを接続した画面ではなく、仕組みのデモです。最初に、カードが引けること、結果を読めること、狭い画面でもボタンが収まることを目標にします。計画を立て、ファイルを変更し、実行結果を見ます。すると、ボタンが画面からはみ出しています。動いたというだけでは、完成ではありません。幅の指定を直し、同じ画面幅でもう一度確認します。こうして、行動、観察、判断、修正を繰り返し、条件を満たしたところで止めます。この制御の循環がLoopです。情報、ツール、状態、実行環境、検証を支えるのがHarnessです。両者の範囲は実装によって重なります。MCPは、ツールや文脈をつなぐためのプロトコルです。自分で計画する機能でも、安全を自動で保証する機能でもありません。AgentにMCPやRAGが必須というわけでもありません。今見たように、確かめられる結果が次の行動につながることが、この例の中心です。" },
  { title: "アイデアが、触れるものになる", en: "IDEA → SOMETHING REAL", time: 145, range: "5:35–8:00", view: "cards" as ViewId, question: "まず、一枚。\n触って、確かめる。", point: "Day Card — 小さな体験から始める。", bullets: ["Idea → Design → Build", "Try：実際にひいてみる", "Improve：使い心地を見直す"], old: ["game-case", "game-process", "game-sprint"], next: "テーマを選ぶ → カードを引く → 裏返す → もう一度。", script: "作品の例がDay Cardです。元の資料には、問いを入力し、カードを引いて結果を見る、という体験の目標が記されています。元のURLは本日の確認では開けないため、旧版に残る画面も用意しました。ここでは、その入口をローカルで触れる小さなデモにしました。まずテーマを選び、一枚引いて、裏返してみます。結果を読んだら、もう一度試せます。制作を考える時は、Idea、Design、Build、Try、Improveの順で整理すると分かりやすくなります。人が体験の目標を決め、AIが画面やコードの案を補い、人が触って採否を判断する流れです。ただし、元作品の実際の会話履歴や変更前後の版は、この資料にはありません。ここでの工程整理や、先ほどの幅の修正を、Day Cardで本当に起きた出来事として紹介しているわけではありません。実物の入口と説明用の体験を区別しています。皆さんも、押す場所が分かるか、結果を読みやすいか、また試したくなるかを見てください。コードが実行できることと、気持ちよく使えることの間に、人が確かめる余地があります。" },
  { title: "任せること、判断すること", en: "MADE WITH AI. JUDGED BY US.", time: 75, range: "8:00–9:15", view: "checklist" as ViewId, question: "「できた」を、\n誰が決める？", point: "Agentが実行し、人が目標と品質を判断する。", bullets: ["目的に合っているか", "小さい画面でも使えるか", "根拠と公開範囲は適切か"], old: ["trust", "synthesis", "adoption"], next: "確認項目を選び、作品の表示の変化を見る。", script: "最後に、人が何を判断するのかを整理します。Agentには、調査、実装、テストなどを任せられます。それでも、何のためにつくるのか、何をもって完成とするのかは、人が決める必要があります。このチェックリストでは、操作、読みやすさ、公開する内容を確認します。チェックを付けること自体が、実物の品質を保証するわけではありません。本当の端末での操作や、用途に応じた検証と結び付けて使います。Prompt、Context、Harness、Loopは、新しいものが前のものを消す階段ではなく、一緒に設計する観点です。試作できた後こそ、使う人の目で確かめることが大切です。" },
  { title: "次は、何をつくる？", en: "THE NEXT SMALL THING", time: 45, range: "9:15–10:00", view: "room" as ViewId, question: "次は、\n何をつくる？", point: "小さくつくる。触って確かめる。改善する。", bullets: ["日々の「こうだったら」を、出発点に。"], old: ["takeaway"], next: "自由探索へ。気になる物件や資料棚を開く。", script: "今日の話は、特別な大きい開発だけの話ではありません。日常の小さな不便や、こうだったら面白いという気づきが、出発点になります。Agentの力を借りると、その考えを、手元で試せるものに近づけられます。そして、触って分かったことを次の改善につなげます。小さくつくる。触って確かめる。改善する。私が今、続けてみたいのは、この繰り返しです。ここからは自由に部屋を探索できます。詳しい仕組みや出典は、資料棚からご覧ください。ありがとうございました。" },
];
export const legacyTopics = [
  ["intro", "自己紹介", "個人"], ["cover", "表紙", "背景"], ["manifesto", "論点", "背景"], ["overview", "全体像 / 3D Atlas", "仕組み"], ["timeline", "年表", "背景"], ["agent", "Agent / Tool Use", "仕組み"], ["mcp", "MCP", "仕組み"], ["concepts", "用語整理", "仕組み"], ["vibe", "Vibe Coding", "制作"], ["commodity", "Product価値", "制作"], ["engineering", "Engineering Stack", "仕組み"], ["harness", "Harness / Loop", "仕組み"], ["game-process", "ゲーム制作プロセス", "制作"], ["game-agents", "Multi-Agent制作", "制作"], ["game-sprint", "90分制作ループ（旧版の仮定）", "制作"], ["game-case", "Webゲーム制作 / Day Card", "制作"], ["reasoning", "Reasoning", "背景"], ["media", "画像・音声・動画", "背景"], ["open-local", "Open / Local", "背景"], ["trust", "Evals / Security", "検証"], ["adoption", "社内導入", "検証"], ["synthesis", "3層モデル", "仕組み"], ["takeaway", "まとめ", "背景"], ["sources", "出典（原文51件）", "出典"],
];
export const sources = [
  { title: "Codex app for Windows", date: "2026-03-04", url: "https://learn.chatgpt.com/docs/changelog", note: "普段のWindows環境で、開発作業と結果のレビューを一つのアプリに集約。" },
  { title: "Scaling Managed Agents", date: "2026-04-08", url: "https://www.anthropic.com/engineering/managed-agents", note: "長い作業を支える設計例。Harnessと実行環境の分離を議論。" },
  { title: "Building effective agents", date: "2024-12-19", url: "https://www.anthropic.com/engineering/building-effective-agents", note: "WorkflowとAgentを区別し、組み合わせる。" },
  { title: "MCP — Architecture overview", date: "版 2026-07-28", url: "https://modelcontextprotocol.io/docs/2026-07-28/learn/architecture", note: "MCPは文脈交換のプロトコル。LLMの利用や判断手順は規定しない。" },
];
export const agentSteps = [
  { phase: "Goal", title: "完了の条件を決める", action: "カードを引く・結果を読む・320px幅でも操作できる。", file: "acceptance.md", code: "[ ] draw a card\n[ ] read the result\n[ ] button fits at 320px", broken: false },
  { phase: "Plan", title: "小さく分ける", action: "画面をつくる → カードを引く処理をつなぐ → 狭い画面で確認する。", file: "plan.md", code: "1. Create card view\n2. Connect draw action\n3. Verify at 320px", broken: false },
  { phase: "Act", title: "ファイルを変更する", action: "最初のレイアウトを表示。ボタンには固定幅を指定。", file: "card.css", code: ".draw-button {\n  width: 380px;\n}", broken: true },
  { phase: "Observe", title: "問題を見つける", action: "同じ320pxの枠で観察。ボタンの右端がはみ出している。", file: "layout-check", code: "viewport: 320px\nbutton:   380px\nFAIL: button exceeds viewport", broken: true },
  { phase: "Act", title: "幅の指定を直す", action: "固定幅を外し、親要素の幅に合わせる。", file: "card.css", code: ".draw-button {\n  width: 100%;\n  box-sizing: border-box;\n}", broken: false },
  { phase: "Verify", title: "同じ条件で確かめる", action: "同じ320pxの枠に収まり、操作できる。結果と再開も確認。", file: "layout-check", code: "viewport: 320px\nbutton:   284px\nPASS: button inside viewport", broken: false },
  { phase: "Deliver", title: "結果と確認範囲を渡す", action: "確認した条件を添えて完了。公開の判断は人へ。", file: "delivery.md", code: "✓ draw / reveal / reset\n✓ fits at 320px\n→ human review", broken: false },
];
