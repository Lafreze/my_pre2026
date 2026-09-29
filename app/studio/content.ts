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
  { id: "name", title: "私について", subtitle: "01 / MY JOURNEY", chapter: 0, anchor: [-1.4, 2.1, -2.41] },
  { id: "notebook", title: "Transformerとの出会い", subtitle: "02 / FIELD NOTES", chapter: 1, anchor: [-1.74, .9, -1.45] },
  { id: "board", title: "LLMからAgentへ", subtitle: "03 / THE EVOLUTION", chapter: 2, anchor: [.7, 2.35, -2.33] },
  { id: "monitor", title: "Agentの中をみる", subtitle: "04 / INSIDE AN AGENT", chapter: 3, anchor: [-.96, 1.48, -1.65] },
  { id: "checklist", title: "アイデアを、動くものに", subtitle: "05 / IDEAS INTO APPS", chapter: 4, anchor: [2.15, .75, .95] },
  { id: "library", title: "参考資料", subtitle: "ARCHIVE / 20 PAGES", chapter: -1, anchor: [-2.64, 1.9, .48] },
];
export const chapters = [
  { title: "私について", en: "MY JOURNEY", time: 95, range: "0:00–1:35", view: "name" as ViewId, question: "画像処理から、\nAIとつくる毎日へ。", point: "王 博 / WANG BO", old: ["intro"], next: "履歴のつながりから、筆記帳のTransformer体験へ。", script: "皆さん、こんにちは。王博です。私の仕事の出発点は、画像処理です。2023年より前はKIOXIAで画像処理に関わり、画像分類のモデル開発などに取り組んでいました。その時、分類モデルをVGGからViTへ変えたところ、私の扱っていたタスクで性能が大きく改善しました。Transformerの力を、最初に実感した経験です。一方で、データが少ない条件ではResNetの方がよい結果になることもあり、モデルの強さは、データや条件と一緒に考える必要があると学びました。2023年にハイテクへ入社した後も、画像の次フレーム予測、画像分類、Active Learningなどに取り組んできました。現在はMulti Beamグループを兼任し、ADC関連の開発を中心に担当しています。今日は、その画像処理の経験から、LLM、そしてAgentへと、自分の見方や使い方がどう変わってきたかをお話しします。最後には、小さなアイデアが実際に動く例を、一緒に触っていただきます。" },
  { title: "Transformerとの出会い", en: "MY FIRST TRANSFORMER MOMENT", time: 75, range: "1:35–2:50", view: "notebook" as ViewId, question: "モデルが変わると、\n見える可能性も変わる。", point: "VGG → ViT。画像分類で感じた、大きな変化。", old: ["intro", "reasoning"], next: "画像での驚きから、2022年のGPT体験へ。研究板に移動。", script: "先ほどのViTの話を、もう少しだけ紹介します。VGGからViTへの変更で、同じ目的の画像分類でも、まだ改善できる余地があることを実感しました。画像を部分ごとに捉え、その関係を扱うTransformerに、大きな可能性を感じたのです。ただし、これは私が扱ったデータと評価条件での経験です。いつでもViTが勝つ、という話ではありません。特にデータが少ない学習条件では、ResNetの方が安定してよい結果になることもありました。大規模な事前学習を使うか、一から学習するかでも条件は変わります。この経験から、私が大切にしているのは、モデル名だけで判断せず、手元のデータで試し、結果を見て選ぶことです。その後、2022年にGPTの文章生成を初めて体験して、画像の世界で感じた変化が、今度は言葉の世界でも起きている、と驚きました。" },
  { title: "LLMからAgentへ", en: "FROM ANSWERS TO ACTIONS", time: 130, range: "2:50–5:00", view: "board" as ViewId, question: "「答える」から、\n「やり遂げる」へ。", point: "私の使い方は、会話 → 道具 → 仕事の一連の流れへ。", old: ["timeline", "agent", "concepts"], next: "3段階を選んで体験の変化を見る。次はモニターの内部構成へ。", script: "2022年、初めてGPTに触れた時は、自然な文章を生成する力に大きな衝撃を受けました。以前なら用途ごとに自然言語処理を組み立てていたことも、言葉で指示して試せるようになった。私には、開発の入口そのものが変わったように感じられました。従来の手法がすべて不要になったというより、選べる方法が大きく増えた、ということです。その後、GPTの能力が高まり、流暢な対話だけでなく、ツールを使う流れが身近になりました。私もAPIを使って、日常の作業を助ける簡単なツールをつくるようになりました。ここでは、モデルが必要な操作を選び、プログラムが実際にその処理を実行し、結果を返します。さらに、目標に向けて操作と確認を繰り返すAgentを使うようになりました。私自身、OpenClawで個人用のAgentを組んでみたものの、当時の自分の構成では、まだ安定して任せられる状態ではありませんでした。その後、Claude CodeやCodexを使う中で、実装して、動かし、直す一連の作業を任せやすくなったと感じています。これは私の利用体験の順序で、Agent研究や製品の登場順を表すものではありません。今では、思いついたことの多くを、まず動く形にして試せるようになりました。では、そのAgentは何でできているのでしょうか。" },
  { title: "Agentは何でできている？", en: "INSIDE AN AGENT", time: 130, range: "5:00–7:10", view: "monitor" as ViewId, question: "考えるモデルに、\n仕事を進める仕組みを。", point: "Model・Context・Tools・Harness・Loop", old: ["agent", "mcp", "harness", "engineering"], next: "5つの構成要素を選ぶ。「動きをみる」で実行と確認の循環へ。", script: "Agentを見る時、私は五つの役割に分けて考えます。最初はModelです。目的や文脈を受け取り、推論し、文章や次の操作を生成する中心です。次はContext。指示、関連するファイル、会話、作業の履歴など、その時に判断するための情報です。三つ目はTools。ファイルを読んだり書いたり、コマンドを実行したり、ブラウザーで確認したりする手段です。モデルが操作の要求を出し、実行環境がそれを動かします。四つ目がHarness。ツールの接続、権限、状態の管理、実行環境、検証など、作業が続けられるように支える仕組みです。最後はLoop。行動の結果を観察し、必要なら計画を変えて、また行動する循環です。これは唯一の標準分類ではなく、働きを理解するための整理です。動きの例も見てみましょう。ログを要約する小さな画面をつくったところ、ボタンが狭い画面からはみ出しています。Agentは結果を確認し、幅の指定を直し、同じ条件でもう一度確かめます。目標を満たしたら止める。難しい場合や判断が必要な場合は、人に戻す。この画面は仕組みを説明するローカルデモで、ライブのAIには接続していません。MCPはこうしたツールや情報をつなぐ方法の一つで、Agentに必ず必要なものではありません。" },
  { title: "アイデアを、動くものに", en: "FROM AN IDEA TO AN APP", time: 170, range: "7:10–10:00", view: "checklist" as ViewId, question: "思いついたら、\nまず触れる形に。", point: "この発表画面も、Codexとつくりました。", old: ["vibe", "adoption", "takeaway"], next: "使い道を選び、この発表画面ができるまでを振り返る。最後は自由探索へ。", script: "こうした仕組みが揃うと、アイデアを試すための準備が小さくなります。例えば、データを見やすくする小さな画面、繰り返し作業を減らすツール、説明しながら触ってもらえる資料。最初から大きなシステムを目指さず、目的を絞ったものから試せます。今、皆さんが見ているこの発表画面も、私がCodexを使ってつくったものです。部屋のモデルを見せたい、物件に近づいて説明したい、次の章へ自然に移りたい。そうした意図を伝え、動いたものを見て、気になるところを直していきます。Agentがつくり、人が見て判断する。この往復が、アイデアを実際の体験に近づけます。もちろん、動く試作と、実際の業務で安心して使えるものは同じではありません。必要な確認を重ねながら育てます。具体例として、この画面ができるまでを振り返ります。最初のアイデアは、画像処理の経験からAgentの話までを、物件を巡りながら伝えることでした。次に、自己紹介、LLMからAgentへの発展、Agentの構成、応用という順番を言葉にしました。その意図をもとに実装し、実際に操作して確かめます。例えば、説明を右側に出すよりも、パソコンの画面自体に表示した方が、物件との関係が伝わる。次の章へ進む時は、全景に戻すより、隣の物件へ直接移った方が流れを保てる。スマートフォンでは、文字やボタンが枠からはみ出さないかを確かめる。こうした気づきを伝え直すことで、試作を改善しています。最初から細部をすべて決める必要はありません。目標と確認できる条件を決め、触って分かったことを次に返す。それが、今の私にとってのAgentの使い方です。皆さんなら、まず何を形にしてみたいでしょうか。ありがとうございました。" },
];
export const sourceChecked = "2026-09-29";
export const sources = [
  { title: "An Image is Worth 16×16 Words", date: "2020-10-22", url: "https://arxiv.org/abs/2010.11929", note: "ViTの原論文。大規模事前学習の結果と、本人の個別タスクの体験を区別。" },
  { title: "Function calling", date: "現行ドキュメント", url: "https://developers.openai.com/api/docs/guides/function-calling", note: "モデルによる操作要求と、アプリケーションによるツール実行を区別。" },
  { title: "Building effective agents", date: "2024-12-19", url: "https://www.anthropic.com/engineering/building-effective-agents", note: "あらかじめ決めたWorkflowと、結果に応じて進むAgentの違い。構成を考えるための資料。" },
  { title: "Codex documentation", date: "現行ドキュメント", url: "https://learn.chatgpt.com/docs", note: "Codexの公式資料。発表中の利用体験・職歴は本人提供の内容。" },
];
export const agentParts = [
  { id: "model", name: "Model", ja: "考える", icon: "◈", detail: "目的と文脈を受け取り、推論・生成し、次の操作を選ぶ。", example: "「この幅なら、ボタンは収まる？」" },
  { id: "context", name: "Context", ja: "状況を知る", icon: "≋", detail: "指示、ファイル、会話、作業履歴。判断に必要な情報を渡す。", example: "要件 / コード / これまでの実行結果" },
  { id: "tools", name: "Tools", ja: "手を動かす", icon: "⌘", detail: "ファイルの編集、実行、ブラウザー確認。操作は接続された環境が実行する。", example: "読む → 書く → 動かす → 確かめる" },
  { id: "harness", name: "Harness", ja: "作業を支える", icon: "▧", detail: "実行環境、権限、状態、検証を管理し、作業の継続を支える。", example: "実行環境 / 接続 / 記録 / 制御" },
  { id: "loop", name: "Loop", ja: "結果から進む", icon: "↻", detail: "結果を観察し、修正・再計画・完了・人への確認を選ぶ。", example: "Plan → Act → Observe → 次の判断" },
];
export const legacyTopics = [
  ["intro", "自己紹介", "個人"], ["cover", "表紙", "背景"], ["manifesto", "論点", "背景"], ["overview", "全体像 / 3D Atlas", "仕組み"], ["timeline", "年表", "背景"], ["agent", "Agent / Tool Use", "仕組み"], ["mcp", "MCP", "仕組み"], ["concepts", "用語整理", "仕組み"], ["vibe", "Vibe Coding", "制作"], ["commodity", "Product価値", "制作"], ["engineering", "Engineering Stack", "仕組み"], ["harness", "Harness / Loop", "仕組み"], ["reasoning", "Reasoning", "背景"], ["media", "画像・音声・動画", "背景"], ["open-local", "Open / Local", "背景"], ["trust", "Evals / Security", "検証"], ["adoption", "社内導入", "検証"], ["synthesis", "3層モデル", "仕組み"], ["takeaway", "まとめ", "背景"], ["sources", "出典", "出典"],
];
export const agentSteps = [
  { phase: "Goal", title: "完了の条件を決める", action: "ログを要約する・結果を読む・320px幅でも操作できる。", file: "acceptance.md", code: "[ ] summarize logs\n[ ] read the result\n[ ] button fits at 320px", broken: false },
  { phase: "Plan", title: "小さく分ける", action: "画面をつくる → ログの要約処理をつなぐ → 狭い画面で確認する。", file: "plan.md", code: "1. Create report view\n2. Connect summary action\n3. Verify at 320px", broken: false },
  { phase: "Act", title: "ファイルを変更する", action: "最初のレイアウトを表示。ボタンには固定幅を指定。", file: "report.css", code: ".report-button {\n  width: 380px;\n}", broken: true },
  { phase: "Observe", title: "問題を見つける", action: "同じ320pxの枠で観察。ボタンの右端がはみ出している。", file: "layout-check", code: "viewport: 320px\nbutton:   380px\nFAIL: button exceeds viewport", broken: true },
  { phase: "Act", title: "幅の指定を直す", action: "固定幅を外し、親要素の幅に合わせる。", file: "report.css", code: ".report-button {\n  width: 100%;\n  box-sizing: border-box;\n}", broken: false },
  { phase: "Verify", title: "同じ条件で確かめる", action: "同じ320pxの枠に収まり、操作できる。結果と再開も確認。", file: "layout-check", code: "viewport: 320px\nbutton:   284px\nPASS: button inside viewport", broken: false },
  { phase: "Deliver", title: "結果と確認範囲を渡す", action: "確認した条件を添えて完了。公開の判断は人へ。", file: "delivery.md", code: "✓ summarize / read / retry\n✓ fits at 320px\n→ human review", broken: false },
];
