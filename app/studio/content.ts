import { llmMilestones } from "./storyDetails";
export type ObjectId = "name" | "notebook" | "board" | "monitor" | "checklist" | "library";
export type ViewId = ObjectId | "room";
export const physicalObject = (view: ViewId): ViewId => view === "notebook" ? "name" : view === "board" ? "monitor" : view;
export type CameraPreset = { position: [number, number, number]; target: [number, number, number]; span: number };
// The overview keeps its garden framing. Close-ups are calculated from the
// actual presentation planes in room.ts, so HTML and model share one camera.
export const cameras: Record<ViewId, CameraPreset> = {
  room: { position: [8.2, 8.6, 11], target: [.15, .55, .2], span: 15.9 },
  name: { position: [-1.4, 2.1, -.4], target: [-1.4, 2.1, -2.42], span: 1.5 },
  notebook: { position: [-1.79, 2, -1.58], target: [-1.79, .808, -1.58], span: .6 },
  board: { position: [.62, 1.81, 1], target: [.62, 1.81, -2.38], span: 2.4 },
  monitor: { position: [-.98, 1.213, -.6], target: [-.98, 1.213, -1.795], span: .8 },
  checklist: { position: [2.12, 2, 1.12], target: [2.12, .708, 1.127], span: .8 },
  library: { position: [4, 3.5, 5], target: [-2.5, 1, .35], span: 4.4 },
};
export const objects: { id: ObjectId; title: string; subtitle: string; chapter: number; anchor: [number, number, number] }[] = [
 {id:"name",title:"私について",subtitle:"01 / PERSONAL JOURNAL",chapter:0,anchor:[.38,.50,.53]},
 {id:"monitor",title:"LLMとAgent",subtitle:"AI WORKBENCH",chapter:2,anchor:[-.98,1.3,-1.74]},
 {id:"checklist",title:"アイデアを形にする",subtitle:"PRODUCT STUDIES",chapter:3,anchor:[1.26,1.00,-2.13]},
 {id:"library",title:"過去の資料",subtitle:"REFERENCE ARCHIVE",chapter:-1,anchor:[-2.43,1.95,.95]},
];
export const chapters = [
  { title: "自己紹介", en: "MY JOURNEY", time: 40, range: "0:00–0:40", view: "name" as ViewId, question: "画像処理と機械学習を中心に取り組んできた仕事", point: "経歴と本発表の対象。", old: ["intro"], next: "同じ本の次のページへ。TransformerからAgentにつながる見方の変化を話す。", script: "王博です。画像処理と機械学習の開発をしてきました。2023年以前はKIOXIAで画像処理や画像分類モデルを担当し、2023年に日立ハイテクのシス１に配属され、画質改善、前フレーム予測、画像分類、Active Learningを担当しています。2025年からはMulti Beamチームで兼務し、クラスタリングとADC関連の開発に取り組んでいます。発表のテーマは、生成AIの活用が文章生成から製品開発へ広がっていることです。モデル単体が製品を完成させるという意味ではなく、Agentがツールを利用して実装と検証を支援します。要件、品質、公開の判断には、人の関与が必要です。" },
  { title: "TransformerとAI活用の変化", en: "TRANSFORMER TO AGENT", time: 75, range: "0:40–1:55", view: "notebook" as ViewId, question: "Transformerとの接点とAI活用の変化", point: "画像認識での経験から、生成AIの開発支援への応用へ。", old: ["intro", "timeline"], next: "2017年のTransformer、2020年のViT、2022年のGPTとの出会いから、現在へ。次にLLMの使い方を具体例で示す。", script: "2017年、Transformerは機械翻訳で成果を示しました。言語分野の進展は知っていても、画像処理の仕事をしていた私には、自分の仕事とどう結びつくのか、まだ実感がありませんでした。見方が変わったのは、2020年に発表されたViTです。大規模な事前学習によって、画像認識でも高い性能を示しました。私が担当したタスクでも、VGGからViTへの変更で性能が改善し、Transformerの力を実感しました。それでも、その後の変化までは想像していませんでした。2022年に初めてGPTに触れた時は、文章生成の力に驚きましたが、まだ賢い対話ボットとして見ていました。今では、調べる、考える、コードを書く、さらに実行結果を確認して修正するところまで、AIと進めるようになりました。これほど日常の一部になるとは、当時は思っていませんでした。次に、LLMの応答生成、ツール利用、Agentによるタスク遂行を、同じ課題で比較します。" },
  { title: "LLMとAgent", en: "LLM & AGENT SYSTEMS", time: 340, range: "1:55–7:35", view: "monitor" as ViewId, question: "Agentの構成と実行過程", point: "Harnessの中で、文脈・判断・操作・フィードバックをつなぐ", old: ["timeline", "concepts", "agent", "mcp", "harness", "engineering"], next: "利用形態を比較し、構成、実行過程、発展の順に説明。発展は年表・製品の用途・技術の役割を分けて示す。", script: "LLMの使い方の広がりを、イベント参加登録ページの制作を共通の課題として比較します。「応答生成」では、要求からコードを生成します。この例では人がコードを保存し、動作を確認します。私は2022年に初めてGPTを使い、文章生成の力に驚きました。「ツール実行」では、モデルがファイル編集のツールを要求し、システムが実行して結果を返します。私もAPIで業務支援ツールを開発しました。ツール利用が一度に限られるという意味ではありません。「タスク遂行」では、編集したページをブラウザーで検査し、ボタンの幅超過という結果を次の文脈に戻します。その結果を踏まえて修正し、再検査して、受入条件を満たした成果物を渡します。上限や障害で進めない時は人に確認します。これらは三世代の製品ではなく、LLMを使う仕組みの比較です。Agentでもモデルとツールを利用します。私自身はOpenClawでの試行を経て、Claude CodeやCodexを使う中で、任せられる作業が広がったと感じています。次に、この実行を支える構成を説明します。Agentの構成を、実行の流れに沿って説明します。外側のHarnessは実行を管理する枠組みです。モデルを呼び出し、ツール要求に対し、権限と規則に基づいて実行、承認待ち、拒否を選び、状態や権限、回数・時間の制限を管理します。枠は責任の整理であり、モデルやツールが同じ場所にあるという意味ではありません。Contextには、指示、関連資料、ツール結果、履歴の要約を入れ、毎回の判断に合わせて更新します。Memoryは情報の保持、RAGは必要な資料を検索して文脈に加える方法で、Contextと同じ意味ではありません。Modelはこの文脈から次の操作を判断し、ツール呼び出し要求や回答を生成します。Toolsは検索、読み取り、計算、編集、実行の手段です。文脈からモデルの判断、ツール実行、結果や観測の反映、次の文脈までを含む全体の循環がAgent Loopです。Harnessがこの循環を組織します。Loopという別の部品が判断するのではなく、更新された文脈を受け取ったモデルが次の行動を判断します。実行例は、小さなWebページを作る説明用シミュレーションです。コードを生成し、ブラウザーで確認すると、ボタンが画面幅を超えていると分かります。この結果を文脈に戻し、幅を修正して再検査します。受入条件は、320ピクセル幅で表示でき、ボタンを操作できることです。モデルの完了宣言だけでは完了と判定しません。条件を満たした記録と成果物を渡します。回数の上限に達した時や権限がなく進めない時は、未解決の点を伝えて人の判断を求めます。ツールの実行成功と、目標の達成は別の判断です。検索結果はそのまま次の文脈へ入れられますが、コードの変更後にはテストが必要な場合があります。検証は必要に応じて、テスト、ルール、モデル、人を使います。役割の境界は実装によって異なり、画面は仕組みを伝えるための簡略図です。この構成を踏まえて、AIによる開発支援とタスク委任の発展を確認します。2021年のCopilotは、エディター内でコードの候補を提案しました。2022年から2023年には対話による協働が広がり、ReActのように推論と行動を往復させる研究も進みました。2024年には、開発環境やコンピューターを実際に操作する製品が広がります。2025年のClaude CodeやCodexでは、実装から検査までをタスクとして委ね、成果物と記録を確認する使い方が広がりました。2026年には、記録や起動条件を持ち、会話をまたいで仕事を追う方向も見られます。OpenClawの前身は2025年11月、現在の名称は2026年1月からです。MuseやDotsも、個人の目標を継続して支える製品例です。常駐は、モデルが常に動いていることや、無制限に操作することを意味しません。これらは単純な世代交代ではありません。プログラミング、アプリ生成、汎用の仕事、継続的な協働という複数の流れが交わっています。それを支えるのが実行管理や状態、記憶、起動条件です。MCPはツールやデータとの接続、A2AはAgent間の連携、Skillsは仕事の方法の再利用を支えます。いずれも新しいモデルや必須の部品ではありません。このように、モデルの能力だけでなく、仕事を続けられる仕組みが発展してきました。次に、こうした仕組みが製品開発への参加をどう広げるのか、また、どのような課題と専門性が求められるのかを整理します。" },
  { title: "AIを活用した製品開発", en: "AI PRODUCT DEVELOPMENT", time: 230, range: "7:35–11:25", view: "checklist" as ViewId, question: "製品開発への参加の広がりと専門性", point: "試作を始めやすくなる一方、コードの理解と品質の判断が必要となる。", old: ["vibe", "adoption", "takeaway"], next: "「開発の変化」で要件・試作・改善を切り替え、「開発上の課題」「専門性」「まとめ」の順に進む。最後の矢印で全景へ戻る。", script: "LLMとAgentツールの発展により、アイデアを動作する試作へ移す技術的な障壁が下がりつつあります。実装経験が少ない人でも、自然言語で目的や必要な機能を伝え、画面と動作を確認しながら開発に参加しやすくなっています。これは技術知識が不要になるという意味ではありませんが、実装方法をすべて習得してから着手する以外の選択肢が広がったと考えています。最初に、利用者、課題、制約を言語化し、Agentに共有します。次に、試作を操作して想定との違いを確認します。文章だけでは曖昧だった要求も、実際の画面や動作を見ることで具体化できます。その結果を次の変更に反映し、小さな範囲で修正と検証を繰り返します。すべての要件を最初から確定するのではなく、早期の試作で利用価値を確認し、必要な機能と品質を段階的に整える進め方です。反復開発自体は以前からありますが、Agentによる実装と検証の支援で取り組みやすくなります。一方、試作が動作することと、本番で安全に運用できることは異なります。第一の課題は、コードの把握不足です。生成や修正の量が理解の範囲を超えると、設計意図や依存関係を追えず、不具合の原因特定が難しくなります。変更を小さく区切り、差分と実行結果を確認することが必要です。第二に、安全性の見落としがあります。動作するコードにも、認証や権限の不備、機密情報の漏えいにつながる実装が含まれる可能性があります。実行権限とデータの範囲を限定し、アクセス制御や依存関係を検査します。第三に、評価の不足です。Agentの完了報告だけで判断せず、受入条件、異常系、実データ、実際の操作に基づいて検証する必要があります。AIによる説明やレビューにも誤りがあるため、テストと人による確認を組み合わせます。こうした開発で重要になるのが、専門性の維持と更新です。業務を理解し、解決する価値のある課題と評価基準を定めること。設計やコードを理解し、変更の影響とリスクを説明できる状態を保つこと。そして、正確性、安全性、保守性、運用上の効果を評価することです。画像処理やADC関連開発で蓄積した知識も、課題設定と検証に生かせます。最後に三点でまとめます。生成AIは、文章の生成に加えて、ツールを通じた実装と検証を支援するようになりました。アイデアを早期に試作し、評価と改善を重ねやすくなった一方、生成物の理解と品質の確認は引き続き必要です。実装支援を活用しながら、成果を理解し評価する専門性を継続して磨くことが、今後の取り組みの基盤になると考えています。" },
];
export const sourceChecked = "2026-09-29";
export const sources = [
  ...llmMilestones.map(era=>({title:era.source,date:era.year,url:era.url,note:era.shift})),
  { title: "DeepSeek-R1", date:"2025-01-22",url:"https://arxiv.org/abs/2501.12948",note:"強化学習による推論能力の研究例。Agentの実行環境とは区別。" },
  { title: "An Image is Worth 16×16 Words", date: "2020-10-22", url: "https://arxiv.org/abs/2010.11929", note: "ViTの原論文。大規模事前学習の結果と、本人の個別タスクの体験を区別。" },
  { title: "Function calling", date: "現行ドキュメント", url: "https://developers.openai.com/api/docs/guides/function-calling", note: "モデルによる操作要求と、アプリケーションによるツール実行を区別。" },
  { title: "Writing effective tools for agents", date: "2025-09-11", url: "https://www.anthropic.com/engineering/writing-tools-for-agents", note: "モデル呼び出しとツール実行の循環。ツール結果と、必要に応じた検証を区別。" },
  { title: "Scaling Managed Agents", date: "2026-04-08", url: "https://www.anthropic.com/engineering/managed-agents", note: "Harnessによるモデル呼び出しとツールのルーティング。実行管理と配置場所を区別。" },
  { title: "Building effective agents", date: "2024-12-19", url: "https://www.anthropic.com/engineering/building-effective-agents", note: "あらかじめ決めたWorkflowと、結果に応じて進むAgentの違い。構成を考えるための資料。" },
  { title: "Codex documentation", date: "現行ドキュメント", url: "https://learn.chatgpt.com/docs", note: "Codexの公式資料。発表中の利用体験・職歴は本人提供の内容。" },
];
export const agentParts = [
  { id: "model", name: "Model", ja: "次の行動を判断", detail: "現在の文脈から、次のツール呼び出し要求、回答、確認の依頼を生成する。" },
  { id: "context", name: "Context", ja: "毎回更新される文脈", detail: "指示、関連資料、ツール結果、履歴の要約をまとめ、次の判断に渡す。" },
  { id: "tools", name: "Tools", ja: "情報取得・操作", detail: "検索・読み取り・計算・編集・実行の手段。実行結果や失敗理由を返す。" },
  { id: "harness", name: "Harness", ja: "実行を管理する枠組み", detail: "モデルを呼び出し、状態と制限を管理。ツール要求は権限と規則に応じて実行・承認待ち・拒否に分ける。" },
  { id: "loop", name: "Agent Loop", ja: "Harnessが組織する実行サイクル", detail: "文脈、モデルの判断、ツール実行、結果の反映を含む全体の循環。独立した判断主体ではない。" },
];
export const legacyTopics = [
  ["intro", "自己紹介", "個人"], ["cover", "表紙", "背景"], ["manifesto", "論点", "背景"], ["overview", "全体像 / 3D Atlas", "仕組み"], ["timeline", "年表", "背景"], ["agent", "Agent / Tool Use", "仕組み"], ["mcp", "MCP", "仕組み"], ["concepts", "用語整理", "仕組み"], ["vibe", "Vibe Coding", "制作"], ["commodity", "Product価値", "制作"], ["engineering", "Engineering Stack", "仕組み"], ["harness", "Harness / Loop", "仕組み"], ["reasoning", "Reasoning", "背景"], ["media", "画像・音声・動画", "背景"], ["open-local", "Open / Local", "背景"], ["trust", "Evals / Security", "検証"], ["adoption", "社内導入", "検証"], ["synthesis", "3層モデル", "仕組み"], ["takeaway", "まとめ", "背景"], ["sources", "出典", "出典"],
];
export const agentSteps = [
  { phase:"目標", node:"context", title:"Webページの条件を定義", action:"紹介ページを制作。受入条件は、320px幅で表示が収まり、ボタンを操作できること。", code:"条件：横の超過なし / クリック応答あり" },
  { phase:"生成", node:"model", title:"コードを生成", action:"ModelがHTMLとCSSの編集を要求。Harnessが権限を確認して編集を実行する。", code:"Modelの要求 → Harnessの許可 → edit_file()" },
  { phase:"検査", node:"tools", title:"ブラウザーで確認", action:"保存結果を文脈に追加。ブラウザーで320px幅の表示と、ボタンのクリック応答を調べる。", code:"browser.check(width: 320, click: true)" },
  { phase:"観測", node:"context", title:"ボタンの幅超過を発見", action:"ボタンの右端が画面幅を64px超過。検査結果をContextに追加し、修正判断の材料にする。", code:"右端 384px − 画面幅 320px = +64px" },
  { phase:"修正", node:"model", title:"検査結果に基づいて修正", action:"Modelが固定幅の変更を要求。Harnessが編集を実行する。この時点では、まだ完了としない。", code:"width: 100%; box-sizing: border-box;" },
  { phase:"再検査", node:"tools", title:"受入条件で再検査", action:"幅の超過がなく、クリック応答もあることを確認。再検査の結果を次の文脈へ戻す。", code:"overflow: 0px / click: OK / 検査 2回" },
  { phase:"完了", node:"harness", title:"成果物と検査結果を提出", action:"受入条件を満たした記録を確認して終了。実装と検査結果をまとめ、利用者に渡す。", code:"HTML + CSS / 320px検査・操作確認の記録" },
];
