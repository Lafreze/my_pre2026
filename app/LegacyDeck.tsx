"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { flushSync } from "react-dom";
import { CapabilityLab, ReasoningLab, VibeLab } from "./NarrativeLabs";
import { HarnessLab } from "./SystemLabs";
import { TrustLab, AdoptionLab, TakeawayLab } from "./DecisionLabs";
import { AgentAtlas } from "./AgentAtlas";
import { ChronologyScene } from "./ChronologyScene";
import { MediaScene } from "./MediaScene";
import { CloudLocalScene, ProtocolScene, ConceptScene } from "./ConnectionScenes";
import { AgentScene } from "./AgentScene";
import { ArchitectureScene, SystemLayersScene } from "./ArchitectureScenes";
import { CostScene } from "./ProductionScenes";
import { CapabilityMap } from "./CapabilityMap";
import { usePresentationMotion } from "./usePresentationMotion";
import { MermaidDiagram } from "./MermaidDiagram";
import { InsightDialog, type InsightContent } from "./InsightDialog";

const timeline = [
  { year: "2017", phase: "基盤", title: "Transformer", tag: "ARCHITECTURE", text: "再帰処理を使わず、注意機構を中心に系列を扱う設計を提案。並列学習しやすい構造が、その後の大規模言語モデルの基盤になった。", point: "モデルの器ができた", tools: ["TensorFlow", "PyTorch"], source: 1 },
  { year: "2018", phase: "基盤", title: "GPT", tag: "PRE-TRAIN", text: "大量の未ラベル文章で生成的に事前学習し、少量の教師データで個別タスクへ適応する二段階方式を実証。※「GPT-1」は後から定着した呼称。", point: "知識を先に学ぶ", tools: ["OpenAI GPT", "Transformers"], source: 2 },
  { year: "2019", phase: "基盤", title: "GPT-2", tag: "SCALE", text: "15億パラメータ、800万Webページへ拡大。タスクごとの追加学習なしでも、翻訳・要約・質問応答の兆しを示した。悪用への懸念から、段階的な公開も議論になった。", point: "規模が汎用性を生む", tools: ["GPT-2", "Hugging Face"], source: 3 },
  { year: "2020–21", phase: "基盤", title: "GPT-3 / Codex", tag: "IN-CONTEXT", text: "GPT-3は指示と例だけで新しいタスクに対応する文脈内学習を示した。続くCodexは自然言語からコードを生成し、補完型AIを実用製品へ押し上げた。", point: "プロンプトがUIになる", tools: ["OpenAI API", "GitHub Copilot", "Tabnine"], source: 4 },
  { year: "2022", phase: "対話", title: "InstructGPT → ChatGPT", tag: "ALIGNMENT", text: "人間のフィードバックによる強化学習（RLHF）で指示追従を改善。11月30日のChatGPT公開で、技術が会話UIを通じて一般利用へ広がった。", point: "使える会話相手になる", tools: ["ChatGPT", "LangChain"], source: 5 },
  { year: "2022–23", phase: "行動", title: "ReAct / Toolformer", tag: "TOOL USE", text: "「推論」と「行動」を交互に進める研究や、APIをいつ・どう呼ぶかを学習する研究が登場。LLMを外部の情報やツールへ接続する設計が具体化した。", point: "考える＋調べる＋動く", tools: ["ReAct", "AutoGPT", "BabyAGI"], source: 7 },
  { year: "2023", phase: "対話", title: "GPT-4 / マルチモーダル", tag: "MULTIMODAL", text: "テキストに加えて画像入力を扱う大規模マルチモーダルモデルへ。GPT-4のパラメータ数など詳細は非公開であり、単純な規模比較はできない。", point: "世界を複数の形式で理解", tools: ["GPT-4", "Claude 2", "Gemini"], source: 6 },
  { year: "2023", phase: "行動", title: "Function Calling / RAG", tag: "STRUCTURED ACTION", text: "構造化した引数で外部APIを呼べるようになり、検索で根拠を補うRAGと組み合わせた業務アプリが急増。対話を実行へつなぐ基盤が整った。", point: "自然言語をAPIへ変換", tools: ["OpenAI Functions", "LlamaIndex", "LangChain"], source: 9 },
  { year: "2023–24", phase: "開発", title: "AI-native IDE", tag: "PAIR PROGRAMMING", text: "補完だけでなく、コードベース全体を参照し、複数ファイルを会話で編集するIDEが普及。開発者はAIと対話しながら実装するようになった。", point: "補完から共同編集へ", tools: ["Cursor", "Copilot Chat", "Replit AI", "Windsurf"], source: 19 },
  { year: "2024", phase: "行動", title: "Computer Use / Agent", tag: "ACTION LOOP", text: "画面を見てクリックや入力を行うコンピュータ操作が登場。モデルが計画→実行→観察→修正を繰り返すAgentの仕組みが、研究から製品へ移った。", point: "回答ではなく完了を目指す", tools: ["Claude Computer Use", "Devin", "Cline", "Replit Agent"], source: 10 },
  { year: "2024", phase: "接続", title: "MCP", tag: "OPEN STANDARD", text: "Anthropicが11月25日に公開。AIアプリとデータ・ツールを、Host / Client / Server構造でつなぐオープンプロトコル。連携を個別開発から標準化へ進めた。", point: "AIのための共通コネクタ", tools: ["MCP SDK", "Claude Desktop", "MCP Servers"], source: 11 },
  { year: "2025", phase: "開発", title: "Vibe Coding", tag: "NATURAL LANGUAGE DEV", text: "2025年初めに広まった、自然言語で意図を伝え、動作を見ながら反復する開発スタイル。試作のハードルを下げる一方、品質への責任はなくならない。", point: "コードだけでなく意図を扱う", tools: ["Cursor", "Lovable", "Bolt", "Replit Agent"], source: 14 },
  { year: "2025", phase: "行動", title: "Coding Agent", tag: "LONG-HORIZON WORK", text: "端末・IDE・クラウドでリポジトリを読み、編集、テスト、レビューまで行うAgentが、製品として提供され始めた。作業単位は数行の補完から、完了条件を持つタスクへ広がった。", point: "人が書く開発から、任せて検証する開発へ", tools: ["Claude Code", "Codex", "Copilot coding agent", "Gemini CLI"], source: 20 },
  { year: "2025", phase: "運用", title: "Context / Long-running Harness", tag: "RELIABILITY", text: "長い仕事では、コンテキスト切れ、途中状態、早すぎる完了宣言が問題化。進捗ファイル、Git履歴、初期化を担うAgent、段階実行、自己検証によって、セッションをまたいで作業を続ける仕組みが整備された。", point: "賢さを、継続可能な仕事へ変換", tools: ["Claude Agent SDK", "AGENTS.md", "Skills", "Evals"], source: 22 },
  { year: "2026", phase: "運用", title: "Harness Engineering", tag: "EXECUTION SYSTEM", text: "モデルを囲む実行環境、指示、ツール、権限、サンドボックス、テスト、可観測性、記憶を一体で設計する考え方。モデルを替えるだけでなく、仕事が成功しやすい環境を作る。", point: "コードだけでなく、Agentが働ける環境を設計", tools: ["Codex", "Claude Agent SDK", "Agents SDK", "Copilot harness"], source: 21 },
  { year: "2026", phase: "運用", title: "Loop Engineering", tag: "CONTINUOUS ORCHESTRATION", text: "目標→行動→観察→修正を、トリガー・検証・永続状態・停止条件付きで繰り返す設計。2026年時点では新興用語で、確立済みの標準名称ではない。", point: "一度きりの実行から、成果が出るまで回す運用へ", tools: ["Symphony", "IBM Bob", "Automations", "GitHub Actions"], source: 24 },
] as const;

const timelineDetails: Record<string, { why: string; impact: string; boundary: string }> = {
  Transformer: {
    why: "長い系列の関係を注意機構で直接扱い、学習時の並列化をしやすくしたことが、大規模化の重要な前提になった。",
    impact: "言語だけでなく、画像・音声・マルチモーダルなど幅広いモデル設計へ波及した。",
    boundary: "Transformerだけで現在の生成AIが完成したわけではなく、データ、計算資源、学習手法の進歩も不可欠だった。",
  },
  GPT: {
    why: "大量の未ラベル文章で汎用的な表現を学び、下流タスクへ適応する二段階方式の有効性を示した。",
    impact: "用途ごとにゼロからモデルを作る発想から、基盤モデルを複数用途へ適応する発想へ移った。",
    boundary: "2018年論文の正式名称はGenerative Pre-Trainingで、『GPT-1』は後から定着した呼称。",
  },
  "GPT-2": {
    why: "規模を拡大すると、明示的に学習していないタスクにも対応する兆しが強まることを示した。",
    impact: "性能だけでなく、公開方法、悪用可能性、段階的リリースの議論を研究開発の一部にした。",
    boundary: "規模の拡大だけで正確性や安全性が自動的に得られるわけではない。",
  },
  "GPT-3 / Codex": {
    why: "GPT-3は例を文脈に置くだけでタスクへ適応し、Codexは自然言語をコード生成へ接続した。",
    impact: "Promptが設定画面の代わりとなり、AI機能をAPIや開発ツールへ組み込む流れが加速した。",
    boundary: "生成コードは実行可能でも正しいとは限らず、テスト、レビュー、依存関係の確認が必要。",
  },
  "InstructGPT → ChatGPT": {
    why: "人の好みを使った調整と会話UIにより、モデル操作に必要な専門知識を大きく下げた。",
    impact: "生成AIが研究者・開発者向け技術から、一般利用者の日常的な道具へ広がった。",
    boundary: "自然な会話は事実性の保証ではない。もっともらしい誤答を見抜く設計は依然必要。",
  },
  "ReAct / Toolformer": {
    why: "言語生成の途中に検索やAPI利用を組み込み、外部フィードバックを次の判断へ戻す設計を具体化した。",
    impact: "モデル単体の知識に閉じず、調査・計算・操作を組み合わせるAgent設計の基礎になった。",
    boundary: "ツールを呼べることと、正しいツールを安全に選べることは別問題。",
  },
  "GPT-4 / マルチモーダル": {
    why: "文章と画像など複数形式の入力を一つの対話で扱い、AIが読める業務情報の範囲を広げた。",
    impact: "文書、図表、画面、写真を横断した支援が現実的になり、UIもテキスト欄だけではなくなった。",
    boundary: "GPT-4のパラメータ数など詳細は非公開で、単純なモデル規模比較はできない。",
  },
  "Function Calling / RAG": {
    why: "構造化した引数でAPIを呼び、検索した情報を回答文脈へ加える実装パターンが実用化した。",
    impact: "社内検索、問い合わせ、申請支援など、最新・固有データを使う業務アプリが作りやすくなった。",
    boundary: "検索結果にも誤りや攻撃入力があり得る。取得した情報を信頼済み命令として扱ってはいけない。",
  },
  "AI-native IDE": {
    why: "会話とコードベース検索、複数ファイル編集が一つの開発画面に統合された。",
    impact: "補完の受け入れから、変更意図を伝え、差分を確認する共同編集型の作業へ移った。",
    boundary: "製品ごとの対応範囲や登場時期は異なるため、ここでは2023〜24年の潮流として示している。",
  },
  "Computer Use / Agent": {
    why: "専用APIがない画面でも、視覚情報を基にクリックや入力を行う実行経路が生まれた。",
    impact: "AIの作業範囲が回答生成から、既存ソフトをまたぐタスク完了へ広がった。",
    boundary: "画面操作は遅延や誤操作が起こりやすい。重要操作には確認、最小権限、停止手段が必要。",
  },
  MCP: {
    why: "AIアプリごとに個別連携を作る負担を減らすため、データとツールの公開方法を共通化した。",
    impact: "Host / Client / Serverを分離し、Tools、Resources、Promptsを再利用可能な接続として扱える。",
    boundary: "MCPは接続プロトコルであり、接続先の信頼性や操作の安全性を自動保証しない。",
  },
  "Vibe Coding": {
    why: "自然言語で意図を伝え、動作を見ながら短く反復する開発スタイルが広く認知された。",
    impact: "非専門家を含め、アイデアを動く試作品にするまでの時間と初期費用を下げた。",
    boundary: "試作速度と本番品質は別。セキュリティ、テスト、可読性、保守責任は残る。",
  },
  "Coding Agent": {
    why: "リポジトリ、端末、テスト結果を参照しながら、複数工程をまたぐ変更を継続できるようになった。",
    impact: "依頼単位が数行の補完から、完了条件を持つIssueやレビュー可能な成果物へ広がった。",
    boundary: "長時間動けるほど、権限、予算、監査、途中状態、停止条件の設計が重要になる。",
  },
  "Context / Long-running Harness": {
    why: "長い作業で起こる文脈切れ、途中状態の喪失、早すぎる完了宣言を環境側で補う必要が生まれた。",
    impact: "進捗ファイル、Git履歴、段階実行、自己検証を使い、セッションをまたぐ仕事を再開しやすくした。",
    boundary: "長いコンテキストだけでは解決せず、必要情報の選別と外部状態の管理が要る。",
  },
  "Harness Engineering": {
    why: "モデル性能の差だけでなく、周囲の仕様・ツール・権限・テストが成果を左右することが明確になった。",
    impact: "Agentが迷いにくく、失敗を検知しやすい作業環境そのものを設計対象として扱う。",
    boundary: "2026年に注目が高まった実践概念で、構成要素や境界は製品・組織によって異なる。",
  },
  "Loop Engineering": {
    why: "一度のAgent実行ではなく、トリガー、検証、永続状態、再実行、停止を外側から制御する必要がある。",
    impact: "AIタスクを単発デモから、成果が出るまで観測可能に回す運用システムへ発展させる。",
    boundary: "2026年時点では新興用語で、業界全体で確立した標準名称ではない。",
  },
};

const sources = [
  { n: 1, label: "Vaswani et al., Attention Is All You Need (2017)", url: "https://arxiv.org/abs/1706.03762" },
  { n: 2, label: "OpenAI, Improving Language Understanding by Generative Pre-Training (2018)", url: "https://cdn.openai.com/research-covers/language-unsupervised/language_understanding_paper.pdf" },
  { n: 3, label: "OpenAI, Better language models and their implications (2019)", url: "https://openai.com/index/better-language-models/" },
  { n: 4, label: "Brown et al., Language Models are Few-Shot Learners (2020)", url: "https://arxiv.org/abs/2005.14165" },
  { n: 5, label: "OpenAI, Introducing ChatGPT (2022)", url: "https://openai.com/index/chatgpt/" },
  { n: 6, label: "OpenAI, GPT-4 Technical Report / Milestone (2023)", url: "https://openai.com/index/gpt-4-research/" },
  { n: 7, label: "Yao et al., ReAct (2022)", url: "https://arxiv.org/abs/2210.03629" },
  { n: 8, label: "Schick et al., Toolformer (2023)", url: "https://arxiv.org/abs/2302.04761" },
  { n: 9, label: "OpenAI, Function calling and other API updates (2023)", url: "https://openai.com/index/function-calling-and-other-api-updates/" },
  { n: 10, label: "Anthropic, Developing a computer use model (2024)", url: "https://www.anthropic.com/news/developing-computer-use" },
  { n: 11, label: "Anthropic, Introducing the Model Context Protocol (2024)", url: "https://www.anthropic.com/news/model-context-protocol" },
  { n: 12, label: "OpenAI, New tools for building agents / Google, A2A (2025)", url: "https://openai.com/index/new-tools-for-building-agents/" },
  { n: 13, label: "OpenAI API, Model catalog (accessed 2026-08-19)", url: "https://developers.openai.com/api/docs/models" },
  { n: 14, label: "Andrej Karpathy, Software Is Changing (Again) (2025)", url: "https://www.youtube.com/watch?v=LCEmiRjPEtQ" },
  { n: 15, label: "Anthropic, Building effective agents (2024)", url: "https://www.anthropic.com/engineering/building-effective-agents" },
  { n: 16, label: "NIST AI 600-1, Generative AI Profile (2024)", url: "https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence" },
  { n: 17, label: "経済産業省・総務省, AI事業者ガイドライン 第1.2版 (2026)", url: "https://www.meti.go.jp/shingikai/mono_info_service/ai_shakai_jisso/20260331_report.html" },
  { n: 18, label: "IPA, テキスト生成AIの導入・運用ガイドライン (2024)", url: "https://www.ipa.go.jp/jinzai/ics/core_human_resource/final_project/2024/generative-ai-guideline.html" },
  { n: 19, label: "GitHub, Copilot / Copilot Chat product history (2021–)", url: "https://github.blog/news-insights/product-news/introducing-github-copilot-ai-pair-programmer/" },
  { n: 20, label: "OpenAI, Introducing Codex (2025)", url: "https://openai.com/index/introducing-codex/" },
  { n: 21, label: "OpenAI, Harness engineering: leveraging Codex in an agent-first world (2026)", url: "https://openai.com/ja-JP/index/harness-engineering/" },
  { n: 22, label: "Anthropic, Effective harnesses for long-running agents (2025)", url: "https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents" },
  { n: 23, label: "OpenAI, The next evolution of the Agents SDK (2026)", url: "https://openai.com/index/the-next-evolution-of-the-agents-sdk/" },
  { n: 24, label: "IBM, What Is Loop Engineering? (2026) — emerging practice", url: "https://www.ibm.com/think/topics/loop-engineering" },
  { n: 25, label: "OpenAI, An open-source spec for Codex orchestration: Symphony (2026)", url: "https://openai.com/index/open-source-codex-orchestration-symphony/" },
  { n: 26, label: "Anthropic, Scaling Managed Agents: Decoupling the brain from the hands (2026)", url: "https://www.anthropic.com/engineering/managed-agents" },
  { n: 27, label: "OpenAI, Learning to reason with LLMs / o1 (2024)", url: "https://openai.com/index/learning-to-reason-with-llms/" },
  { n: 28, label: "DeepSeek-AI et al., DeepSeek-R1 (2025)", url: "https://arxiv.org/abs/2501.12948" },
  { n: 29, label: "Ho et al., Denoising Diffusion Probabilistic Models (2020)", url: "https://arxiv.org/abs/2006.11239" },
  { n: 30, label: "OpenAI, DALL·E: Creating images from text (2021)", url: "https://openai.com/index/dall-e/" },
  { n: 31, label: "Stability AI, Stable Diffusion Public Release (2022)", url: "https://stability.ai/news-updates/stable-diffusion-public-release" },
  { n: 32, label: "OpenAI, Video generation models as world simulators / Sora (2024)", url: "https://openai.com/index/video-generation-models-as-world-simulators/" },
  { n: 33, label: "Meta AI, Introducing LLaMA (2023)", url: "https://ai.meta.com/blog/large-language-model-llama-meta-ai/" },
  { n: 34, label: "Hu et al., LoRA: Low-Rank Adaptation of Large Language Models (2021)", url: "https://arxiv.org/abs/2106.09685" },
  { n: 35, label: "Ollama, Llama 3.2 goes small and multimodal — local processing (2024)", url: "https://ollama.com/blog/llama3.2" },
  { n: 36, label: "Anthropic, Demystifying evals for AI agents (2026)", url: "https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents" },
  { n: 37, label: "OWASP, Top 10 for Large Language Model Applications (2025)", url: "https://owasp.org/www-project-top-10-for-large-language-model-applications/" },
  { n: 38, label: "Model Context Protocol, 2026-07-28 Specification Release (2026)", url: "https://blog.modelcontextprotocol.io/posts/2026-07-28/" },
  { n: 39, label: "Linux Foundation, Formation of the Agentic AI Foundation (2025)", url: "https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation" },
  { n: 40, label: "OWASP, Top 10 for Agentic Applications (2025)", url: "https://genai.owasp.org/2025/12/09/owasp-top-10-for-agentic-applications-the-benchmark-for-agentic-security-in-the-age-of-autonomous-ai/" },
  { n: 41, label: "IPA, セキュリティ担当者のための生成AIセキュリティ (2026)", url: "https://www.ipa.go.jp/jinzai/ics/core_human_resource/final_project/2026/ai-security.html" },
  { n: 42, label: "OpenAI, Create browser-based games with Codex (accessed 2026-08-27)", url: "https://learn.chatgpt.com/use-cases/browser-games" },
  { n: 43, label: "OpenAI, Subagents in ChatGPT and Codex (accessed 2026-08-27)", url: "https://learn.chatgpt.com/docs/agent-configuration/subagents" },
  { n: 44, label: "OpenAI, Git worktrees in Codex (accessed 2026-08-27)", url: "https://learn.chatgpt.com/docs/environments/git-worktrees" },
  { n: 45, label: "Anthropic, Create custom subagents in Claude Code (accessed 2026-08-27)", url: "https://code.claude.com/docs/en/sub-agents" },
  { n: 46, label: "Hunicke, LeBlanc & Zubek, MDA: A Formal Approach to Game Design and Game Research (2004)", url: "https://aaai.org/papers/ws04-04-001-mda-a-formal-approach-to-game-design-and-game-research/" },
  { n: 47, label: "Unity + USC Games Unlocked, Prototyping / Milestones / Vertical Slice", url: "https://learn.unity.com/course/design-and-publish-your-original-game-unity-usc-games-unlocked/unit/milestones" },
  { n: 48, label: "Microsoft, Xbox Accessibility Guidelines (updated 2026)", url: "https://learn.microsoft.com/en-us/xbox/accessibility/guidelines" },
  { n: 49, label: "OpenAI API, Evals — evaluation structure and testing criteria (accessed 2026-09-02)", url: "https://developers.openai.com/api/reference/java/resources/evals/methods/create" },
  { n: 50, label: "OpenAI API, Responses tools — built-in, MCP, and function tools (accessed 2026-09-02)", url: "https://developers.openai.com/api/reference/cli/resources/responses/methods/retrieve" },
  { n: 51, label: "Lewis et al., Retrieval-Augmented Generation (2020)", url: "https://arxiv.org/abs/2005.11401" },
];

const evolutionChart = String.raw`%%{init: {"themeVariables":{"fontSize":"17px"},"flowchart":{"nodeSpacing":24,"rankSpacing":30,"curve":"linear"}}}%%
flowchart LR
  subgraph FOUNDATION["01 / MODEL · 2017–20"]
    direction LR
    T["2017<br/><b>Transformer</b><br/><small>注意機構</small>"] --> G["2018<br/><b>GPT</b><br/><small>事前学習</small>"] --> S["2019–20<br/><b>GPT-2 / GPT-3</b><br/><small>スケールと文脈内学習</small>"]
  end
  subgraph EXPERIENCE["02 / EXPERIENCE · 2022–24"]
    direction LR
    C["2022<br/><b>ChatGPT</b><br/><small>指示追従と対話</small>"] --> M["2023<br/><b>GPT-4</b><br/><small>マルチモーダル</small>"] --> U["2023<br/><b>Tool Use</b><br/><small>Function Calling</small>"] --> A["2024<br/><b>Agent</b><br/><small>計画・実行ループ</small>"]
  end
  subgraph ECOSYSTEM["03 / AGENTIC · 2024–26"]
    direction LR
    P["2024<br/><b>MCP</b><br/><small>接続の標準化</small>"] --> E["2025<br/><b>Coding Agent</b><br/><small>長時間タスク</small>"] --> H["2025–26<br/><b>Harness</b><br/><small>実行環境と護り</small>"] --> L["2026<br/><b>Loop</b><br/><small>継続オーケストレーション</small>"]
  end
  FOUNDATION ==> EXPERIENCE ==> ECOSYSTEM
  classDef foundation fill:#e7eff6,stroke:#55728c,color:#10233f;
  classDef turning fill:#8ed8f8,stroke:#10233f,color:#10233f,stroke-width:2px;
  class T,G,S foundation;
  class C,M,U,A,P,E,H,L turning;`;

const engineeringStackChart = String.raw`flowchart LR
  P["PROMPT ENGINEERING<br/><small>何を指示するか</small>"] --> C["CONTEXT ENGINEERING<br/><small>何を見せるか</small>"]
  C --> H["HARNESS ENGINEERING<br/><small>どう安全・確実に働かせるか</small>"]
  H --> L["LOOP ENGINEERING<br/><small>どう継続し、検証し、止めるか</small>"]
  P -. "主な顕在化" .-> Y1["2018–23"]
  C -. "主な顕在化" .-> Y2["2023–25"]
  H -. "主な顕在化" .-> Y3["2025–26"]
  L -. "新興用語" .-> Y4["2026–"]
  classDef base fill:#e7eff6,stroke:#55728c,color:#10233f;
  classDef now fill:#8ed8f8,stroke:#10233f,color:#10233f,stroke-width:2px;
  class P,C base;
  class H,L now;`;

const harnessLoopChart = String.raw`%%{init: {"themeVariables":{"fontSize":"14px"},"flowchart":{"nodeSpacing":32,"rankSpacing":42,"curve":"linear"}}}%%
flowchart LR
  TRIGGER(["TRIGGER<br/>人・時刻・Issue・イベント"]) --> GOAL["GOAL / SPEC<br/>成果物・制約・停止条件"]
  GOAL --> HARNESS
  subgraph HARNESS["HARNESS / 実行環境"]
    CTX["CONTEXT<br/>規約・履歴・必要資料"] --> MODEL["MODEL<br/>Agent"]
    MODEL --> TOOL["TOOLS / MCP<br/>File・Shell・API"]
    TOOL --> OBS["OBSERVATION<br/>出力・ログ・差分"]
    OBS --> MODEL
    GUARD["GUARDRAILS<br/>権限・Sandbox・承認"] -.-> MODEL
  end
  HARNESS --> VERIFY{"VERIFY<br/>テスト・Eval・レビュー"}
  VERIFY -- "未達" --> MEMORY["MEMORY<br/>進捗・失敗・次の一手"]
  MEMORY --> GOAL
  VERIFY -- "達成" --> HUMAN{"HUMAN GATE<br/>高影響なら承認"}
  HUMAN -- "承認" --> DONE(["STOP / DELIVER"])
  HUMAN -- "修正" --> MEMORY
  classDef active fill:#8ed8f8,stroke:#10233f,color:#10233f;
  classDef control fill:#c5b9f3,stroke:#10233f,color:#10233f;
  class CTX,MODEL,TOOL,OBS,MEMORY active;
  class GUARD,VERIFY,HUMAN control;`;



const reasoningChart = String.raw`flowchart LR
  Q["問題 / 指示"] --> PLAN["分解・方針"]
  PLAN --> TRY["候補を生成"]
  TRY --> CHECK{"検証できる?"}
  CHECK -- "数式・コード・検索" --> TOOL["外部フィードバック"]
  CHECK -- "内部評価" --> SCORE["自己評価 / Scorer"]
  TOOL --> REVISE["修正"]
  SCORE --> REVISE
  REVISE --> DONE{"十分な品質?"}
  DONE -- "NO" --> PLAN
  DONE -- "YES" --> ANSWER["最終回答 / 行動"]
  classDef think fill:#8ed8f8,stroke:#10233f,color:#10233f;
  classDef verify fill:#c5b9f3,stroke:#10233f,color:#10233f;
  class PLAN,TRY,REVISE think;
  class CHECK,TOOL,SCORE,DONE verify;`;

const riskChart = String.raw`flowchart LR
  R1["生成<br/>幻覚・誤引用"] --> R2["検索接続<br/>Prompt Injection"]
  R2 --> R3["Tool Use<br/>不適切な実行"]
  R3 --> R4["Agent<br/>過剰な権限"]
  R4 --> R5["Multi-Agent<br/>連鎖・責任の拡散"]
  S1["根拠・出典<br/>Eval"] -.-> R1
  S2["入力分離<br/>信頼境界"] -.-> R2
  S3["検証<br/>最小権限"] -.-> R3
  S4["承認・Sandbox<br/>停止"] -.-> R4
  S5["監査・予算<br/>全体停止"] -.-> R5
  classDef risk fill:#d8a6b5,stroke:#10233f,color:#10233f;
  classDef safe fill:#8ed8f8,stroke:#10233f,color:#10233f;
  class R1,R2,R3,R4,R5 risk;
  class S1,S2,S3,S4,S5 safe;`;

type ProfileData = {
  name: string;
  romanName: string;
  currentTeam: string;
  currentNote: string;
  beforeYear: string;
  beforeTitle: string;
  joinYear: string;
  joinTitle: string;
  joinDetail: string;
  currentYear: string;
  currentTitle: string;
  currentDetail: string;
  topic: string;
  topicDetail: string;
};

const defaultProfile: ProfileData = {
  name: "王 博",
  romanName: "WANG BO",
  currentTeam: "シス１ × Multi Beam",
  currentNote: "二つのチームを兼務",
  beforeYear: "～2023",
  beforeTitle: "これまでのキャリア",
  joinYear: "2023～",
  joinTitle: "ハイテクへ中途入社",
  joinDetail: "シス１に配属",
  currentYear: "2025～",
  currentTitle: "Multi Beamチーム",
  currentDetail: "シス１と兼務",
  topic: "生成AIは、どう『仕事を完了するシステム』になったか",
  topicDetail: "LLMの能力、外部接続、Agent制御、運用設計、そして実作例まで",
};

const agentChart = String.raw`flowchart LR
  GOAL(["目標を受け取る"]) --> PLAN["1. 計画する"]
  PLAN --> SELECT{"2. ツールを選ぶ"}
  SELECT --> ACT["3. 実行する"]
  ACT --> OBSERVE["4. 結果を観察する"]
  OBSERVE --> CHECK{"完了条件を満たした?"}
  CHECK -- "NO" --> PLAN
  CHECK -- "YES" --> DONE(["結果を返す"])
  SELECT -. "高影響な操作" .-> HUMAN["人間の承認"]
  HUMAN --> ACT
  classDef action fill:#8ed8f8,stroke:#10233f,color:#10233f;
  classDef gate fill:#e7eff6,stroke:#55728c,color:#10233f;
  class PLAN,ACT,OBSERVE action;
  class SELECT,CHECK,HUMAN gate;`;

const mcpChart = String.raw`%%{init: {"themeVariables":{"fontSize":"12px"},"flowchart":{"nodeSpacing":18,"rankSpacing":28}}}%%
flowchart LR
  subgraph HOST["HOST — AIアプリが権限と会話を管理"]
    MODEL["LLM / Agent"] --> C1["MCP Client"]
    MODEL --> C2["MCP Client"]
    MODEL --> C3["MCP Client"]
  end
  C1 <-->|"JSON-RPC / 能力交渉"| S1["MCP Server<br/>Resources<br/><small>社内文書・DB</small>"]
  C2 <-->|"JSON-RPC / 能力交渉"| S2["MCP Server<br/>Tools<br/><small>検索・API・操作</small>"]
  C3 <-->|"JSON-RPC / 能力交渉"| S3["MCP Server<br/>Prompts<br/><small>定型ワークフロー</small>"]
  classDef client fill:#8ed8f8,stroke:#10233f,color:#10233f;
  classDef server fill:#e7eff6,stroke:#55728c,color:#10233f;
  class C1,C2,C3 client;
  class S1,S2,S3 server;`;

const adoptionChart = String.raw`%%{init: {"themeVariables":{"fontSize":"12px"},"flowchart":{"nodeSpacing":18,"rankSpacing":26}}}%%
flowchart LR
  START["AI活用候補を<br/>選ぶ"] --> VALUE{"業務価値を<br/>測れる?"}
  VALUE -- "NO" --> STOP["目的とKPIを<br/>再定義"]
  VALUE -- "YES" --> FIXED{"固定手順で<br/>解ける?"}
  FIXED -- "YES" --> WORKFLOW["Workflow<br/><small>予測可能・監査しやすい</small>"]
  FIXED -- "NO" --> AGENT["Agent<br/><small>柔軟・自律的</small>"]
  WORKFLOW --> ACTION{"外部へ<br/>書き込む?"}
  AGENT --> ACTION
  ACTION -- "NO / 読み取りのみ" --> PILOT["限定データで試行"]
  ACTION -- "YES" --> APPROVAL["承認点・権限<br/>停止条件を設計"]
  APPROVAL --> PILOT
  PILOT --> EVAL{"評価基準を満たす?"}
  EVAL -- "NO" --> IMPROVE["失敗例から<br/>改善"] --> PILOT
  EVAL -- "YES" --> SCALE["段階的に展開<br/>継続監視"]
  classDef go fill:#8ed8f8,stroke:#10233f,color:#10233f;
  classDef caution fill:#c5b9f3,stroke:#10233f,color:#10233f;
  class WORKFLOW,AGENT,PILOT,SCALE go;
  class APPROVAL,IMPROVE caution;`;

const harnessModules = [
  { id: "context", kind: "INPUT", title: "CONTEXT", short: "規約・履歴・必要情報", purpose: "Agentが判断するために、必要な情報だけを現在の作業へ渡す。", io: "Spec · Docs · History", check: "鮮度・優先順位・情報量を確認する" },
  { id: "tools", kind: "ACTION", title: "TOOLS", short: "File・Shell・API", purpose: "モデルの判断を、読み取り・編集・検索・外部操作へ接続する。", io: "Structured call → Result", check: "引数・副作用・再実行可能性を確認する" },
  { id: "permissions", kind: "GUARD", title: "PERMISSIONS", short: "権限・承認・制約", purpose: "Agentが実行できる範囲を、仕事とリスクに合わせて制限する。", io: "Policy · Approval · Scope", check: "最小権限と高影響操作の承認点を置く" },
  { id: "evals", kind: "VERIFY", title: "TESTS / EVALS", short: "結果・差分・品質判定", purpose: "Agentの自己申告ではなく、観測可能な証拠で完了を判定する。", io: "Test · Diff · Eval criteria", check: "正常系・失敗系・回帰を同じ基準で測る" },
  { id: "state", kind: "CONTINUITY", title: "STATE / MEMORY", short: "状態・進捗・失敗履歴", purpose: "途中状態と次の一手を保存し、セッションをまたいで作業を再開する。", io: "Checkpoint · Git · Progress", check: "再開時に同じ状態を再現できるか確認する" },
  { id: "runtime", kind: "FOUNDATION", title: "RUNTIME & OBSERVABILITY", short: "Sandbox・Logs・Budget・Timeout", purpose: "実行を隔離し、何が起きたかを記録して、予算と時間の上限で止める。", io: "Runtime events → Logs / Metrics", check: "監査ログ・上限・緊急停止を用意する" },
] as const;

type HarnessModuleId = (typeof harnessModules)[number]["id"];

const agentLoopDetails: Record<string, InsightContent> = {
  PLAN: {
    kicker: "AGENT LOOP / 01 PLAN",
    title: "PLAN — 目標を、検証できる手順へ分解する",
    summary: "現在の状態と制約を読み、何をどの順番で行えば完了と判断できるかを決める段階です。計画は固定せず、観察結果に応じて更新します。",
    points: [
      "INPUT：目標、利用可能な情報・ツール、予算、期限、禁止事項。",
      "OUTPUT：依存関係を含む作業順序と、各段階の確認方法。",
      "NEXT：ACTへ渡す前に、高影響操作の承認点と停止条件を置く。",
      "FAILURE：曖昧な完了条件のまま進むと、作業量だけが増えて成果を判定できない。",
    ],
  },
  ACT: {
    kicker: "AGENT LOOP / 02 ACT",
    title: "ACT — 選んだ手段で外部状態を変える",
    summary: "検索、コード編集、API、画面操作などを実行し、計画を現実の変更へ変換する段階です。副作用の大きさに応じて実行権限を制御します。",
    points: [
      "INPUT：PLANが指定した次の操作、対象、引数、期待結果。",
      "OUTPUT：ツール結果、差分、生成物、エラーなどの観測可能な証拠。",
      "NEXT：結果をOBSERVEへ返し、実行前の予想と実際を比較する。",
      "FAILURE：入力検証や冪等性がない操作は、誤更新や重複実行を起こしやすい。",
    ],
  },
  OBSERVE: {
    kicker: "AGENT LOOP / 03 OBSERVE",
    title: "OBSERVE — 実行結果を証拠として読み取る",
    summary: "ツール出力、画面、ログ、テスト、差分を収集し、何が変わったかを把握する段階です。成功という自己申告ではなく外部状態を確認します。",
    points: [
      "INPUT：ACTが返した結果と、実行前に記録した期待状態。",
      "OUTPUT：成功・失敗・不足情報・予期しない副作用の整理。",
      "NEXT：観測結果をREVISEへ渡し、継続・修正・停止を判断する。",
      "FAILURE：ログや差分が不足すると、誤りの原因と影響範囲を追跡できない。",
    ],
  },
  REVISE: {
    kicker: "AGENT LOOP / 04 REVISE",
    title: "REVISE — 証拠から次の計画を選び直す",
    summary: "完了条件と観測結果を照合し、完了、再計画、停止、人への移譲のいずれかを選ぶ制御段階です。無条件に再試行する工程ではありません。",
    points: [
      "INPUT：OBSERVEの証拠、成功基準、残り予算、過去の失敗履歴。",
      "OUTPUT：DONE、REPLAN、STOP、HUMAN ESCALATIONの明示的な分岐。",
      "NEXT：未完了で回復可能なら更新したPLANへ戻す。",
      "FAILURE：再試行上限がないと、同じ失敗を繰り返しコストと時間を消費する。",
    ],
  },
};

const engineeringLayerCards = [
  {
    number: "04", title: "LOOP ENGINEERING", years: "2026—", question: "どう回し、止めるか", text: "トリガー・検証・永続状態・再試行・停止条件を設計する。", examples: "Verify · Retry · Stop · Automation", cls: "stack-loop",
    detail: {
      kicker: "04 / CONTINUOUS CONTROL",
      title: "LOOP ENGINEERING — 継続実行の制御を設計する",
      summary: "単発のAgent実行を、トリガー、検証、再試行、永続状態、停止条件を持つ運用フローへ変える考え方です。2026年時点では新興の実務用語です。",
      points: ["開始条件と再開可能なチェックポイントを定義する。", "検証結果ごとに完了・再計画・停止・人への移譲を分岐する。", "Harnessのログ、状態、Evalを読みながらループを制御する。", "無限再試行を防ぐため、時間・費用・回数の上限を持たせる。"],
      source: { label: "IBM · What Is Loop Engineering?", url: "https://www.ibm.com/think/topics/loop-engineering" },
    },
  },
  {
    number: "03", title: "HARNESS ENGINEERING", years: "2025—26", question: "どう働かせるか", text: "ツール・権限・Sandbox・Testを組み、再現可能な仕事にする。", examples: "Tools · Sandbox · Permission · Test", cls: "stack-harness",
    detail: {
      kicker: "03 / EXECUTION ENVIRONMENT",
      title: "HARNESS ENGINEERING — Agentの作業環境を設計する",
      summary: "モデルの外側に、指示、ツール、権限、Sandbox、状態、テスト、観測を組み、同じ仕事を安全に再現しやすくする設計領域です。",
      points: ["ContextとToolsを、対象業務に必要な最小範囲へ限定する。", "権限、承認、隔離環境で外部操作の影響を制御する。", "テスト、差分、ログを完了判定と原因追跡に利用する。", "Loopはこの環境を利用して、実行と検証を繰り返す。"],
      source: { label: "OpenAI · Harness engineering", url: "https://openai.com/ja-JP/index/harness-engineering/" },
    },
  },
  {
    number: "02", title: "CONTEXT ENGINEERING", years: "2023—25", question: "何を見せるか", text: "必要な文書・履歴・規約だけを選び、判断しやすい情報状態を作る。", examples: "RAG · Memory · AGENTS.md", cls: "stack-context",
    detail: {
      kicker: "02 / INFORMATION DESIGN",
      title: "CONTEXT ENGINEERING — 判断に必要な情報状態を作る",
      summary: "プロンプトだけでなく、取得文書、会話履歴、ツール定義、規約、作業状態を選択・圧縮・配置し、モデルが判断しやすい入力を構成します。",
      points: ["利用者の質問と権限に合う情報だけを取得する。", "新しさ、信頼度、優先順位を示し、矛盾する情報を整理する。", "RAGは情報を取得する手段であり、Context Engineeringは見せ方全体の設計。", "情報過多や古い履歴は判断を悪化させるため、選別と更新が必要。"],
    },
  },
  {
    number: "01", title: "PROMPT ENGINEERING", years: "2018—23", question: "何を指示するか", text: "役割・目的・例・出力形式を言語で定義し、一回の応答を整える。", examples: "System Prompt · Few-shot", cls: "stack-prompt",
    detail: {
      kicker: "01 / INSTRUCTION DESIGN",
      title: "PROMPT ENGINEERING — 一回の応答条件を明確にする",
      summary: "目的、役割、制約、例、出力形式を言語化し、モデルへ何を求めるかを明確にする最も内側の設計です。",
      points: ["曖昧な要求を、対象・条件・出力形式へ分解する。", "Few-shot例は望ましいパターンを示すが、事実の正しさは保証しない。", "Context Engineeringが必要情報を補い、Harnessが実行条件を支える。", "高品質なPromptでも、権限・テスト・監査の代わりにはならない。"],
    },
  },
] as const;

const threeLayerDetails: Record<string, InsightContent> = {
  GENERATION: {
    kicker: "MODEL / CONTENT CREATION",
    title: "GENERATION — 入力条件から新しい出力を作る",
    summary: "言語モデルなら次のトークン、拡散モデルならノイズ除去などを通じて、文章・コード・画像といった候補を生成する能力です。",
    points: ["INPUT：Prompt、Context、生成条件。", "OUTPUT：文章、コード、画像などの候補。", "RELATED：CONTEXT / RAGが根拠を補い、EVALSが用途別の品質を測る。", "RISK：もっともらしい誤り、著作権・出所、形式不一致を別途検証する。"],
    source: { label: "OpenAI · GPT-4 research", url: "https://openai.com/index/gpt-4-research/" },
  },
  REASONING: {
    kicker: "MODEL / PROBLEM SOLVING",
    title: "REASONING — 問題を分解し、候補を検証する",
    summary: "難しい課題に対して推論時の計算を増やし、複数段階の処理や検証を通じて回答精度を高める能力です。人間と同じ思考を意味する言葉ではありません。",
    points: ["INPUT：目標、制約、利用可能な証拠。", "OUTPUT：解答、計画、判断候補。", "RELATED：TOOL USEで計算・検索を行い、EVALSやVerifierで結果を確認する。", "RISK：長い説明や高い確信度だけでは、正しさの証拠にならない。"],
    source: { label: "OpenAI · Learning to reason with LLMs", url: "https://openai.com/index/learning-to-reason-with-llms/" },
  },
  MULTIMODAL: {
    kicker: "MODEL / MULTIPLE MODALITIES",
    title: "MULTIMODAL — 複数形式の情報を扱う",
    summary: "テキスト、画像、音声、動画などを入力または出力として扱う能力です。製品ごとに対応する形式と、入力・生成の方向は異なります。",
    points: ["INPUT：文書、図表、画面、写真、音声など。", "OUTPUT：説明、抽出結果、生成メディアなど。", "RELATED：AgentのOBSERVEを画面や音声へ広げ、GENERATIONの表現形式も増やす。", "RISK：小さい文字、時間的一貫性、個人情報、真正性を形式ごとに評価する。"],
    source: { label: "OpenAI · GPT-4 research", url: "https://openai.com/index/gpt-4-research/" },
  },
  "CONTEXT / RAG": {
    kicker: "SYSTEM / INFORMATION FLOW",
    title: "CONTEXT / RAG — 必要な根拠を現在の入力へ運ぶ",
    summary: "Contextはモデルが現在参照できる入力、RAGは質問に関係する情報を検索し、その一部をContextへ加える実装パターンです。RAG自体がモデルの知識を更新するわけではありません。",
    points: ["INPUT：利用者の質問、アクセス可能な文書・DB、会話履歴。", "OUTPUT：出典付きの関連情報を含むContext。", "RELATED：GENERATION / REASONINGの根拠となり、Context Engineeringが選別・順序・圧縮を設計する。", "RISK：検索漏れ、古い情報、権限逸脱、取得文書内のPrompt Injectionを管理する。"],
    source: { label: "Lewis et al. · Retrieval-Augmented Generation", url: "https://arxiv.org/abs/2005.11401" },
  },
  "FUNCTION CALLING / TOOL USE": {
    kicker: "SYSTEM / ACTION INTERFACE",
    title: "FUNCTION CALLING / TOOL USE — 判断を外部操作へ接続する",
    summary: "モデルがツール名と構造化引数を提案し、Host側のコードが検証・実行して結果を返す仕組みです。モデル自身がAPIを直接実行しているとは限りません。",
    points: ["INPUT：利用可能なツール定義、引数スキーマ、現在の目標。", "OUTPUT：構造化された呼び出し要求と、実行後の結果。", "RELATED：MCPがツール公開を標準化し、WORKFLOW / AGENTが呼び出す順序を決める。", "RISK：引数検証、許可リスト、冪等性、高影響操作の人間承認が必要。"],
    source: { label: "OpenAI · Function calling and other API updates", url: "https://openai.com/index/function-calling-and-other-api-updates/" },
  },
  MCP: {
    kicker: "SYSTEM / OPEN PROTOCOL",
    title: "MCP — AIアプリとデータ・ツールの接続を共通化する",
    summary: "Host、Client、Serverの役割を分け、Tools、Resources、Promptsなどを共通方式で提供するオープンプロトコルです。MCPはAgent間通信そのものを定義するA2Aとは目的が異なります。",
    points: ["INPUT：Serverが公開する能力と、Host側の接続・権限設定。", "OUTPUT：Clientを介した能力発見、呼び出し、結果受信。", "RELATED：CONTEXTにはResources、行動にはToolsを提供し、Agentがそれらを利用する。", "RISK：接続の標準化は、接続先の信頼性・認証・安全性を自動保証しない。"],
    source: { label: "Anthropic · Introducing the Model Context Protocol", url: "https://www.anthropic.com/news/model-context-protocol" },
  },
  "WORKFLOW / AGENT": {
    kicker: "SYSTEM / CONTROL LOGIC",
    title: "WORKFLOW / AGENT — 次の処理を誰が決めるか",
    summary: "Workflowはコードが事前定義した経路を進み、Agentはモデルが状況に応じて次の行動やツールを選びます。自律性が高いほど良いわけではありません。",
    points: ["INPUT：目標、Context、利用可能なTools、制約。", "OUTPUT：処理結果と、次の行動または終了判断。", "RELATED：固定手順はWorkflow、曖昧な探索はAgentと使い分け、両方を組み合わせることもできる。", "RISK：Agentには停止条件、予算、状態管理、承認、観測可能性が必要。"],
    source: { label: "Anthropic · Building effective agents", url: "https://www.anthropic.com/engineering/building-effective-agents" },
  },
  "PROMPT / CONTEXT ENG.": {
    kicker: "ENGINEERING / INSTRUCTION & INFORMATION",
    title: "PROMPT / CONTEXT ENG. — 指示と情報状態を設計する",
    summary: "Prompt Engineeringは要求の伝え方、Context Engineeringは文書、履歴、ツール定義、状態を含む入力全体の構成を扱います。後者は前者を含む、より広い設計対象です。",
    points: ["INPUT：業務目的、規約、利用者情報、取得文書、履歴。", "OUTPUT：モデルが判断しやすい順序と量に整えた入力。", "RELATED：CONTEXT / RAGの取得結果を選別し、HARNESSから毎回再現可能に供給する。", "RISK：古い情報、矛盾、過剰な履歴、優先順位の不明確さが判断を崩す。"],
    source: { label: "OpenAI · Harness engineering", url: "https://openai.com/ja-JP/index/harness-engineering/" },
  },
  HARNESS: {
    kicker: "ENGINEERING / EXECUTION ENVIRONMENT",
    title: "HARNESS — Agentが安全に働ける環境を組む",
    summary: "指示、Context、Tools、権限、Sandbox、状態、テスト、ログをモデルの外側に組み、実行を再現・観測・制御しやすくする考え方です。境界は製品や組織で異なります。",
    points: ["INPUT：仕事の仕様、利用可能な資源、権限ポリシー、完了条件。", "OUTPUT：制約された実行環境と、追跡可能な結果・差分・ログ。", "RELATED：WORKFLOW / AGENTとLOOPが動く作業場になり、EVALSへ証拠を渡す。", "RISK：広すぎる権限、共有状態の衝突、観測不足、再現不能な環境を避ける。"],
    source: { label: "OpenAI · Harness engineering", url: "https://openai.com/ja-JP/index/harness-engineering/" },
  },
  LOOP: {
    kicker: "ENGINEERING / CONTINUOUS CONTROL",
    title: "LOOP — 観察結果から継続・停止を決める",
    summary: "Plan → Act → Observe → Verifyを繰り返し、結果に応じて完了、再計画、停止、人への移譲へ分岐する制御フローです。単なる自動再試行ではありません。",
    points: ["INPUT：現在の状態、直前の結果、成功基準、残り予算。", "OUTPUT：DELIVER、REPLAN、STOP、HUMANの明示的な判断。", "RELATED：HARNESSの状態・ログ・権限を使い、EVALSの判定を次の分岐へ返す。", "RISK：停止条件や失敗履歴がないと、同じ誤りとコストを繰り返す。"],
    source: { label: "IBM · What Is Loop Engineering?", url: "https://www.ibm.com/think/topics/loop-engineering" },
  },
  EVALS: {
    kicker: "ENGINEERING / QUALITY EVIDENCE",
    title: "EVALS — 「できた」を再現可能な判定にする",
    summary: "代表的な入力、期待条件、採点方法、合格基準を用意し、モデルやAgentの品質を継続的に比較する仕組みです。単体テストだけでなく、振る舞い全体を対象にできます。",
    points: ["INPUT：評価データ、期待される振る舞い、Grader、閾値。", "OUTPUT：合否、スコア、失敗分類、回帰差分。", "RELATED：LOOPのVERIFYと、リリース判断・改善優先順位へ判定結果を返す。", "RISK：実運用を代表しないデータや曖昧なGraderは、誤った安心を生む。"],
    source: { label: "OpenAI API · Evals", url: "https://developers.openai.com/api/reference/java/resources/evals/methods/create" },
  },
  "SECURITY / GOVERNANCE": {
    kicker: "ENGINEERING / CONTROL & ACCOUNTABILITY",
    title: "SECURITY / GOVERNANCE — 権限と責任の境界を決める",
    summary: "最小権限、データ分類、承認、監査、インシデント対応などの技術・運用ルールを組み合わせ、AI利用の許容範囲と責任者を明確にします。",
    points: ["INPUT：業務リスク、扱うデータ、外部作用、法令・社内規程。", "OUTPUT：権限、承認点、監査証跡、停止・復旧手順、責任分担。", "RELATED：HARNESSへ実行制約を与え、LOOPの高影響分岐をHUMANへ接続する。", "RISK：ポリシー文書だけで終わらせず、アクセス制御・ログ・演習で実装を確認する。"],
    source: { label: "NIST · Generative AI Profile", url: "https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence" },
  },
};

const conceptRoleDetails: Record<"LLM" | "RAG" | "MCP" | "AGENT", InsightContent> = {
  LLM: {
    kicker: "MODEL / CAPABILITY CORE",
    title: "LLM — 理解・推論・生成を担うモデル",
    summary: "入力されたPromptとContextを処理し、文章、判断候補、構造化出力などを生成する能力の中心です。LLM単体には、外部システムを安全に操作し続ける実行環境は含まれません。",
    points: ["ROLE：情報を解釈し、次の出力や行動候補を生成する。", "USED BY：Agentが計画、判断、結果確認に利用する。", "CONNECTED TO：RAGから根拠を受け、Tool Useを通じて外部機能を選ぶ。", "BOUNDARY：出力の正確性、権限、実行結果は別の仕組みで検証・制御する。"],
    source: { label: "OpenAI · GPT-4 research", url: "https://openai.com/index/gpt-4-research/" },
  },
  RAG: {
    kicker: "PATTERN / EXTERNAL KNOWLEDGE",
    title: "RAG — 外部知識をContextへ加える実装パターン",
    summary: "質問に関連する文書を検索し、その一部をモデル入力へ加えて回答の根拠を補う方法です。独立したモデルや実行主体ではなく、AIアプリやAgentが利用する能力です。",
    points: ["FLOW：質問 → 検索 → 関連資料 → LLM → 回答。", "USED BY：Agentが社内規程や最新情報を確認するときに利用する。", "CONNECTED TO：検索結果はContextになり、LLMの生成・判断をGroundする。", "BOUNDARY：検索漏れ、古い情報、権限逸脱、取得文書内の攻撃入力を管理する。"],
    source: { label: "Lewis et al. · Retrieval-Augmented Generation", url: "https://arxiv.org/abs/2005.11401" },
  },
  MCP: {
    kicker: "PROTOCOL / CONNECTION",
    title: "MCP — ツール・データ接続を共通化するプロトコル",
    summary: "AgentやAIアプリが、MCP ClientとMCP Serverを介してTools、Resources、Promptsを利用するための共通接続方式です。MCP自身は考えず、計画も実行主体の判断も担いません。",
    points: ["FLOW：Agent / Host → MCP Client → MCP Server → Tools・Data・Services。", "USED BY：Agentが申請システム、GitHub、DB、Filesなどへ接続するときに利用する。", "CONNECTED TO：ResourcesはContextへ、ToolsはAgentのActionへ結果を返す。", "BOUNDARY：接続規格であり、認証、最小権限、承認、安全性を自動保証しない。"],
    source: { label: "Anthropic · Introducing the Model Context Protocol", url: "https://www.anthropic.com/news/model-context-protocol" },
  },
  AGENT: {
    kicker: "SYSTEM / GOAL-DIRECTED ARCHITECTURE",
    title: "AGENT — モデルと能力を束ね、目標へ向けて動くシステム",
    summary: "LLM、Context、RAG、Memory、Skills、Tools、MCP、Loop、Permissionsなどを組み合わせ、観察結果に応じて次の行動を選びながら目標達成を目指す上位のシステム構成です。",
    points: ["FLOW：Observe → Think / Plan → Act → Observeを、完了または停止まで繰り返す。", "CONTAINS / USES：LLM、RAG、Memory、Skills、Tools、MCP、Agent Loop。", "RUNS IN：Harness / Runtimeが権限、Sandbox、State、Logs、Evals、停止条件を提供する。", "BOUNDARY：Agentは最後の工程ではなく、最初から最後まで流程を制御する主体。"],
    source: { label: "Anthropic · Building effective agents", url: "https://www.anthropic.com/engineering/building-effective-agents" },
  },
};

const slideCatalog = [
  { id: "intro", label: "自己紹介" },
  { id: "cover", label: "表紙" },
  { id: "manifesto", label: "論点" },
  { id: "overview", label: "全体像" },
  { id: "timeline", label: "年表" },
  { id: "agent", label: "Agent" },
  { id: "mcp", label: "MCP" },
  { id: "concepts", label: "用語整理" },
  { id: "vibe", label: "Vibe Coding" },
  { id: "commodity", label: "Product価値" },
  { id: "engineering", label: "Engineering Stack" },
  { id: "harness", label: "Harness / Loop" },
  { id: "reasoning", label: "Reasoning" },
  { id: "media", label: "画像・音声・動画" },
  { id: "open-local", label: "Open / Local" },
  { id: "trust", label: "Evals / Security", defaultHidden: true },
  { id: "adoption", label: "社内導入", defaultHidden: true },
  { id: "synthesis", label: "3層モデル" },
  { id: "takeaway", label: "まとめ" },
  { id: "sources", label: "出典" },
] as const;

type SlideId = (typeof slideCatalog)[number]["id"];

type SlideTheme = { accent: string; secondary: string; surface: string };

const slideThemes: Record<SlideId, SlideTheme> = {
  intro: { accent: "#52d7f2", secondary: "#9aa7ff", surface: "#081725" },
  cover: { accent: "#7687ff", secondary: "#d0a7ff", surface: "#0c1029" },
  manifesto: { accent: "#38d7c5", secondary: "#77b9ff", surface: "#071d24" },
  overview: { accent: "#4ca7ff", secondary: "#83d9ff", surface: "#09182b" },
  timeline: { accent: "#727df8", secondary: "#aab4ff", surface: "#10142d" },
  reasoning: { accent: "#9d74ff", secondary: "#69c9ff", surface: "#17112b" },
  media: { accent: "#ff6aa9", secondary: "#ffb45f", surface: "#29101f" },
  "open-local": { accent: "#43d89f", secondary: "#b9e76d", surface: "#0a211b" },
  agent: { accent: "#4f8cff", secondary: "#59d8ff", surface: "#09172d" },
  mcp: { accent: "#35ceda", secondary: "#61a8ff", surface: "#071e26" },
  concepts: { accent: "#7887ff", secondary: "#bd9cff", surface: "#11152c" },
  vibe: { accent: "#ff8068", secondary: "#ffcd6b", surface: "#29140f" },
  commodity: { accent: "#efb84e", secondary: "#ff7f72", surface: "#271b09" },
  engineering: { accent: "#a36dff", secondary: "#5fd6e8", surface: "#18112b" },
  harness: { accent: "#6878ff", secondary: "#70e0cd", surface: "#10152c" },
  trust: { accent: "#ff687b", secondary: "#ffb35c", surface: "#2a0d17" },
  adoption: { accent: "#3fd0b5", secondary: "#70a8ff", surface: "#08231f" },
  synthesis: { accent: "#5b8dff", secondary: "#a67aff", surface: "#0d1730" },
  takeaway: { accent: "#45d5e8", secondary: "#9b76ff", surface: "#091b29" },
  sources: { accent: "#8ca0b8", secondary: "#d3b978", surface: "#111820" },
};

const slideInsights: Record<SlideId, InsightContent> = {
  intro: {
    kicker: "PAGE 01 · CONTEXT",
    title: "発表者とテーマの接点",
    summary: "この発表は、生成AIの歴史を製品名の列ではなく、仕事の単位がどう変わったかという視点で読み解きます。",
    points: ["自己紹介は所属と担当領域に限定し、発表内容との関係を明確にする。", "個人情報はブラウザ内にのみ保存され、外部へ送信しない。", "以降はモデル、接続、実行環境、運用の順に議論する。"],
  },
  cover: {
    kicker: "PAGE 02 · THESIS",
    title: "生成から、成果を出すシステムへ",
    summary: "2017年以降の変化を、モデル能力、利用体験、外部接続、継続運用という連続した進化として整理します。",
    points: ["モデルの能力向上だけでは、安定した業務成果は保証されない。", "ツール接続によって、回答から外部状態を変える行動へ進んだ。", "運用品質は権限、テスト、観測、停止条件を含む設計で決まる。"],
  },
  manifesto: {
    kicker: "PAGE 03 · FOUR SHIFTS",
    title: "四つの変化は置換ではなく累積",
    summary: "生成・対話・行動・運用は、前段階を捨てるのではなく、その上に新しい責任範囲を積み重ねます。",
    points: ["生成：内容を作る。", "行動：ツールを使い、状態を変える。", "運用：失敗を検知し、修正し、適切に止める。"],
    source: { label: "Anthropic · Building effective agents", url: "https://www.anthropic.com/engineering/building-effective-agents" },
  },
  overview: {
    kicker: "PAGE 04 · MAP",
    title: "主要技術の発展と、設計上の関心の変化",
    summary: "ModelからAgent Systemへの技術発展を俯瞰する図です。年代は発表や実用化・注目の時期を示し、すべての概念の誕生年や置換関係を表すものではありません。",
    points: ["発展の視点：モデル能力、対話・ツール利用、Agentシステム、実行基盤と循環の改善へ関心が広がる。", "構成の視点：Agent SystemはModel、Loop、Harness、Toolsなどを組み合わせる。HarnessとLoopはAgentの次世代ではない。", "Loopは観察・判断・行動の循環。Harnessは文脈・ツール・権限・状態・ログなどを扱う実行基盤。境界は実装や文献によって重なる。"],
  },
  timeline: {
    kicker: "PAGE 05 · EVIDENCE",
    title: "年表は代表的な転換点を選定",
    summary: "すべての研究・製品を網羅する年表ではありません。後続の設計判断につながる出来事を、一次情報を優先して配置しています。",
    points: ["年は論文公開または製品発表の時点を基準にする。", "製品名と研究概念を混同せず、役割を短く説明する。", "2026年の用語は成熟度に差があるため、確立済み標準とは断定しない。"],
    source: { label: "Vaswani et al. · Attention Is All You Need", url: "https://arxiv.org/abs/1706.03762" },
  },
  reasoning: {
    kicker: "PAGE 06 · REASONING",
    title: "推論モデルは検証ループで強くなる",
    summary: "推論時の計算を増やし、候補生成と評価を反復する方向が進展しました。ただし内部過程は、人間の思考そのものの証明ではありません。",
    points: ["難しい問題を分解し、候補を比較する時間を取る。", "数式、コード、検索など外部フィードバックで誤りを減らす。", "推論能力とAgentの実行権限は別の設計問題である。"],
    source: { label: "OpenAI · Learning to reason with LLMs", url: "https://openai.com/index/learning-to-reason-with-llms/" },
  },
  media: {
    kicker: "PAGE 07 · MULTIMODAL",
    title: "生成対象が文章からメディアへ拡張",
    summary: "拡散モデルを軸に画像生成が普及し、音声・動画へ広がりました。能力の進展と、権利・真正性・出所管理は分けて考える必要があります。",
    points: ["2020年の拡散モデル研究が画像生成の重要な基盤になった。", "2021〜22年にテキストから画像を作る製品が一般化した。", "動画生成では時間的一貫性と制御可能性が重要な評価軸になる。"],
    source: { label: "Ho et al. · Denoising Diffusion Probabilistic Models", url: "https://arxiv.org/abs/2006.11239" },
  },
  "open-local": {
    kicker: "PAGE 08 · DEPLOYMENT",
    title: "Open-weight とローカル実行は別軸",
    summary: "重みが公開されていることと、OSI的なオープンソースであることは同義ではありません。ローカル実行にも性能、保守、総コストの判断が必要です。",
    points: ["公開条件、学習情報、再配布条件を個別に確認する。", "ローカル処理はデータ境界を制御しやすいが、運用責任が増える。", "クラウド対ローカルは機密性、遅延、性能、TCOで選ぶ。"],
    source: { label: "Meta AI · Introducing LLaMA", url: "https://ai.meta.com/blog/large-language-model-llama-meta-ai/" },
  },
  agent: {
    kicker: "PAGE 09 · CONTROL LOOP",
    title: "Agentはモデルではなく実行システム",
    summary: "目標を受け、計画し、ツールを使い、結果を観察して修正する制御ループです。固定手順には、より予測可能なWorkflowが適します。",
    points: ["モデルは判断を担い、コードは権限・状態・停止を担う。", "ツールの副作用に応じて承認点を置く。", "完了条件を先に定義し、自己申告だけで終了しない。"],
    source: { label: "Anthropic · Building effective agents", url: "https://www.anthropic.com/engineering/building-effective-agents" },
  },
  mcp: {
    kicker: "PAGE 10 · PROTOCOL",
    title: "MCPは接続方式を共通化する",
    summary: "Host、Client、Serverの役割を分け、Tools、Resources、Promptsなどを共通の方法で提供するプロトコルです。接続の標準化は、安全性の自動保証ではありません。",
    points: ["Hostが会話、権限、ユーザー体験を管理する。", "Serverが能力を公開し、Clientが接続を仲介する。", "認証、最小権限、入力の信頼境界は実装側で設計する。"],
    source: { label: "Model Context Protocol · Introduction", url: "https://modelcontextprotocol.io/introduction" },
  },
  concepts: {
    kicker: "PAGE 11 · TERMINOLOGY",
    title: "似た言葉は抽象度が違う",
    summary: "LLMはモデル、RAGは情報取得パターン、MCPは接続プロトコル、Agentは目標達成システムです。比較の軸を合わせると混乱が減ります。",
    points: ["LLM：入力から出力を生成するモデル。", "RAG / MCP：情報を補う方式と、能力を接続する規約。", "Agent：モデル、ツール、状態、制御ループを含むシステム。"],
  },
  vibe: {
    kicker: "PAGE 12 · DEVELOPMENT",
    title: "Vibe Codingは試作速度を上げる",
    summary: "自然言語で意図を伝え、動作を見ながら反復する開発スタイルです。試作を速めても、品質・安全・保守の責任は消えません。",
    points: ["低コストで仮説を動く形にしやすい。", "生成コードを理解せず採用すると、欠陥と負債が残る。", "本番化ではレビュー、テスト、依存関係管理を戻す。"],
    source: { label: "Andrej Karpathy · Software Is Changing (Again)", url: "https://www.youtube.com/watch?v=LCEmiRjPEtQ" },
  },
  commodity: {
    kicker: "PAGE 13 · PRODUCT VALUE",
    title: "圧縮されたのは最初の一歩",
    summary: "生成AIでUIや試作品を作る費用は下がりましたが、顧客理解、独自データ、流通、信頼、継続改善までは自動で生まれません。",
    points: ["作れることと、使われ続けることを分ける。", "差別化は問題選定と運用データの学習ループに移る。", "プロトタイプ速度を、検証回数の増加へ変換する。"],
  },
  engineering: {
    kicker: "PAGE 14 · STACK",
    title: "対象は指示から実行環境へ広がった",
    summary: "Prompt、Context、Harness、Loopは置換関係ではなく、AIを確実に働かせるために積み上がる設計対象です。用語の成熟度は同一ではありません。",
    points: ["Prompt：何をしてほしいか。", "Context：判断に必要な何を見せるか。", "Harness / Loop：どう安全に実行し、検証し、続け、止めるか。"],
    source: { label: "OpenAI · Harness engineering", url: "https://openai.com/index/harness-engineering/" },
  },
  harness: {
    kicker: "PAGE 15 · RELIABILITY",
    title: "能力を再現可能な仕事へ変える",
    summary: "Agent Systemの中で、Model / Policyは判断、Agent Loopは制御フロー、Harness / Runtimeは循環を支える実行基盤を担います。境界は実装や文献によって重なります。",
    points: ["Model / Policy：文脈と観測結果から計画や行動を選ぶ。", "Agent Loop：実行結果に応じて継続・再計画・停止・人への移譲を制御する。", "Harness / Runtime：情報、ツール実行、状態、権限、隔離、評価、ログ、エラー処理を提供する。"],
    source: { label: "OpenAI · Harness engineering", url: "https://openai.com/index/harness-engineering/" },
  },
  trust: {
    kicker: "PAGE 20 · EVALS & SECURITY",
    title: "評価と安全は実行前から設計する",
    summary: "Agentの品質評価には、テスト基準とデータ源を明示したEvalが必要です。外部操作では、最小権限、承認、監査、停止が追加で必要になります。",
    points: ["成功条件を観測可能な判定へ変換する。", "正常系だけでなく、攻撃入力と失敗回復を評価する。", "高影響な副作用には人の承認と全体停止を置く。"],
    source: { label: "OpenAI API · Evals", url: "https://developers.openai.com/api/reference/java/resources/evals/methods/create" },
  },
  adoption: {
    kicker: "PAGE 21 · ADOPTION",
    title: "自律性は業務価値とリスクに合わせる",
    summary: "固定手順ならWorkflow、曖昧な判断が必要ならAgentを検討します。外部書き込みの有無で、承認と権限設計の強度を変えます。",
    points: ["価値を測るKPIと限定データで小さく始める。", "読み取り、提案、実行を段階的に解放する。", "評価を満たした範囲だけ展開し、継続監視する。"],
    source: { label: "経済産業省・総務省 · AI事業者ガイドライン", url: "https://www.meti.go.jp/shingikai/mono_info_service/ai_shakai_jisso/20260331_report.html" },
  },
  synthesis: {
    kicker: "PAGE 22 · THREE LAYERS",
    title: "モデル・システム・運用を分けて考える",
    summary: "この三層は標準規格ではなく、問題の所在を切り分ける分析モデルです。同じモデルでも、接続と運用設計で成果は変わります。",
    points: ["MODEL：認識、生成、推論の能力。", "SYSTEM：コンテキスト、ツール、状態、権限。", "OPERATION：評価、監視、再実行、停止、改善。"],
  },
  takeaway: {
    kicker: "PAGE 23 · TAKEAWAY",
    title: "AIの価値は掛け合わせで決まる",
    summary: "式は数値計算ではなく、どれか一つが弱いと成果全体が制約されることを示す概念モデルです。",
    points: ["強いモデルだけでなく、正しい文脈と適切なツールが要る。", "Engineeringが再現性を、Governanceが許容可能性を支える。", "次に問うべきは、どの仕事をどう安全に完了させるか。"],
  },
  sources: {
    kicker: "PAGE 24 · SOURCES",
    title: "事実・解釈・提案を分離する",
    summary: "日付と仕様は一次情報を優先し、2026年時点の新興用語は成熟度を明記しています。フレームワーク部分は発表上の編集・提案です。",
    points: ["論文、公式発表、標準仕様、政府ガイドラインを優先する。", "アクセス日を残し、変わりうる製品情報を固定事実として扱わない。", "出典一覧から原文へ移動し、発表後も検証できるようにする。"],
  },
};

const topicCatalog = [
  { id: "opening", label: "導入", slides: ["intro", "cover"] },
  { id: "big-picture", label: "全体像", slides: ["manifesto", "overview", "timeline"] },
  { id: "agent-system", label: "Agent / MCP", slides: ["agent", "mcp", "concepts", "vibe", "commodity"] },
  { id: "engineering", label: "Harness / Loop", slides: ["engineering", "harness"] },
  { id: "capability", label: "能力拡張", slides: ["reasoning", "media", "open-local"] },
  { id: "adoption", label: "社内活用", slides: ["trust", "adoption"] },
  { id: "conclusion", label: "まとめ", slides: ["synthesis", "takeaway", "sources"] },
] as const satisfies ReadonlyArray<{ id: string; label: string; slides: readonly SlideId[] }>;

type TopicId = (typeof topicCatalog)[number]["id"];
type TopicLabels = Record<TopicId, string>;
type SlideTopics = Record<SlideId, TopicId>;

const defaultTopicLabels = Object.fromEntries(topicCatalog.map((topic) => [topic.id, topic.label])) as TopicLabels;
const defaultSlideTopics = Object.fromEntries(topicCatalog.flatMap((topic) => topic.slides.map((slideId) => [slideId, topic.id] as const))) as SlideTopics;

const defaultSlideOrder: SlideId[] = [
  "intro", "cover", "manifesto", "overview", "timeline",
  "reasoning", "media", "open-local",
  "agent", "mcp", "concepts", "vibe", "commodity",
  "engineering", "harness",
  "trust", "adoption", "synthesis",
  "sources", "takeaway",
];
const defaultHiddenSlides = slideCatalog.filter((slide) => "defaultHidden" in slide && slide.defaultHidden).map((slide) => slide.id);
const optionalSourceNumbers = new Set([17, 18, 36, 37, 40, 41, 42, 43, 44, 45, 46, 47, 48]);
const optionalSourcesBySlide: Partial<Record<SlideId, number[]>> = {
  trust: [36, 37, 40, 41],
  adoption: [17, 18, 41],
};

const isSlideId = (value: unknown): value is SlideId => slideCatalog.some((slide) => slide.id === value);
const isTopicId = (value: unknown): value is TopicId => topicCatalog.some((topic) => topic.id === value);
const subscribeToHydration = () => () => {};
const clientReady = () => true;
const serverReady = () => false;

export default function Home() {
  const hydrated = useSyncExternalStore(subscribeToHydration, clientReady, serverReady);
  const [mcpSelected, setMcpSelected] = useState(0);
  const [slideIndex, setSlideIndex] = useState(0);
  const [profile, setProfile] = useState<ProfileData>(defaultProfile);
  const [profileDraft, setProfileDraft] = useState<ProfileData>(defaultProfile);
  const [profileEditing, setProfileEditing] = useState(false);
  const [deckEditing, setDeckEditing] = useState(false);
  const [slideOrder, setSlideOrder] = useState<SlideId[]>(defaultSlideOrder);
  const [hiddenSlides, setHiddenSlides] = useState<SlideId[]>(defaultHiddenSlides);
  // Archive deep links temporarily expose a hidden topic without changing saved preferences.
  const [archiveTopic, setArchiveTopic] = useState<string | null>(null);
  useEffect(() => { setArchiveTopic(new URLSearchParams(window.location.search).get("slide")); }, []);
  const [topicLabels, setTopicLabels] = useState<TopicLabels>(defaultTopicLabels);
  const [slideTopics, setSlideTopics] = useState<SlideTopics>(defaultSlideTopics);
  const [draggedSlide, setDraggedSlide] = useState<SlideId | null>(null);
  const [harnessSelected, setHarnessSelected] = useState<HarnessModuleId>("context");
  const [insight, setInsight] = useState<InsightContent | null>(null);
  const [laserEnabled, setLaserEnabled] = useState(false);
  const [careerSelected, setCareerSelected] = useState(2);
  const deckRef = useRef<HTMLElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const ambientRef = useRef<HTMLDivElement>(null);
  const transitionRef = useRef<ViewTransition | null>(null);
  const navigationIndexRef = useRef(0);
  const hiddenSlideSet = useMemo(() => new Set(hiddenSlides.filter(id => id !== archiveTopic)), [hiddenSlides, archiveTopic]);
  const visibleSlides = useMemo(() => slideOrder
    .filter((id) => !hiddenSlideSet.has(id))
    .map((id) => slideCatalog.find((slide) => slide.id === id)!), [hiddenSlideSet, slideOrder]);
  const currentSlide = visibleSlides[slideIndex] ?? visibleSlides[0];
  usePresentationMotion(deckRef, currentSlide?.id);
  const visibleTopics = useMemo(() => topicCatalog.map((topic) => {
    const firstIndex = visibleSlides.findIndex((slide) => slideTopics[slide.id] === topic.id);
    return { ...topic, firstIndex, displayLabel: topicLabels[topic.id].trim() || topic.label };
  }).filter((topic) => topic.firstIndex >= 0).sort((a, b) => a.firstIndex - b.firstIndex), [slideTopics, topicLabels, visibleSlides]);
  const currentTopicId = currentSlide ? slideTopics[currentSlide.id] : undefined;
  const activeTheme = currentSlide ? slideThemes[currentSlide.id] : slideThemes.intro;
  const slidePosition = useMemo(() => new Map(slideOrder.map((id, index) => [id, index])), [slideOrder]);
  const visibleSources = useMemo(() => {
    const enabledOptionalSources = new Set<number>();
    visibleSlides.forEach((slide) => optionalSourcesBySlide[slide.id]?.forEach((source) => enabledOptionalSources.add(source)));
    return sources.filter((source) => !optionalSourceNumbers.has(source.n) || enabledOptionalSources.has(source.n));
  }, [visibleSlides]);
  const selectedHarnessModule = harnessModules.find((module) => module.id === harnessSelected) ?? harnessModules[0];

  const slideProps = (id: SlideId) => ({
    "data-slide-id": id,
    "data-slide-theme": id,
    hidden: hiddenSlideSet.has(id),
    inert: currentSlide?.id !== id,
    style: {
      order: 100 + (slidePosition.get(id) ?? slideCatalog.length),
      "--slide-accent": slideThemes[id].accent,
      "--slide-secondary": slideThemes[id].secondary,
      "--slide-surface": slideThemes[id].surface,
    } as CSSProperties,
  });

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("gen-ai-profile-v1");
      if (!saved) return;
      const restored = { ...defaultProfile, ...JSON.parse(saved) } as ProfileData;
      setProfile(restored);
      setProfileDraft(restored);
    } catch {
      window.localStorage.removeItem("gen-ai-profile-v1");
    }
  }, []);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("gen-ai-topic-labels-v1");
      if (!saved) return;
      setTopicLabels({ ...defaultTopicLabels, ...JSON.parse(saved) });
    } catch {
      window.localStorage.removeItem("gen-ai-topic-labels-v1");
    }
  }, []);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("gen-ai-slide-topics-v1");
      if (!saved) return;
      const parsed = JSON.parse(saved) as Partial<Record<SlideId, unknown>>;
      const restored = { ...defaultSlideTopics };
      slideCatalog.forEach((slide) => {
        const topicId = parsed[slide.id];
        if (isTopicId(topicId)) restored[slide.id] = topicId;
      });
      setSlideTopics(restored);
    } catch {
      window.localStorage.removeItem("gen-ai-slide-topics-v1");
    }
  }, []);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("gen-ai-slide-settings-v2");
      if (!saved) return;
      const parsed = JSON.parse(saved) as { order?: unknown[]; hidden?: unknown[] };
      const savedOrder = Array.isArray(parsed.order) ? parsed.order.filter(isSlideId) : [];
      const completeOrder = [...new Set([...savedOrder, ...defaultSlideOrder])];
      const narrativeOrder = completeOrder.filter((id) => id !== "sources" && id !== "takeaway");
      const savedHidden = Array.isArray(parsed.hidden) ? parsed.hidden.filter(isSlideId) : defaultHiddenSlides;
      setSlideOrder([...narrativeOrder, "sources", "takeaway"]);
      setHiddenSlides([...new Set(savedHidden)]);
    } catch {
      window.localStorage.removeItem("gen-ai-slide-settings-v2");
    }
  }, []);

  const persistSlideSettings = useCallback((order: SlideId[], hidden: SlideId[]) => {
    window.localStorage.setItem("gen-ai-slide-settings-v2", JSON.stringify({ order, hidden }));
  }, []);

  const updateTopicLabel = useCallback((id: TopicId, value: string) => {
    setTopicLabels((current) => {
      const next = { ...current, [id]: value };
      window.localStorage.setItem("gen-ai-topic-labels-v1", JSON.stringify(next));
      return next;
    });
  }, []);

  const updateSlideTopic = useCallback((slideId: SlideId, topicId: TopicId) => {
    setSlideTopics((current) => {
      const next = { ...current, [slideId]: topicId };
      window.localStorage.setItem("gen-ai-slide-topics-v1", JSON.stringify(next));
      return next;
    });
  }, []);

  const moveSlide = useCallback((id: SlideId, direction: -1 | 1) => {
    setSlideOrder((current) => {
      const from = current.indexOf(id);
      const to = from + direction;
      if (from < 0 || to < 0 || to >= current.length) return current;
      const next = [...current];
      [next[from], next[to]] = [next[to], next[from]];
      persistSlideSettings(next, hiddenSlides);
      return next;
    });
  }, [hiddenSlides, persistSlideSettings]);

  const reorderSlide = useCallback((source: SlideId, target: SlideId) => {
    if (source === target) return;
    setSlideOrder((current) => {
      const next = current.filter((id) => id !== source);
      const targetIndex = next.indexOf(target);
      next.splice(targetIndex < 0 ? next.length : targetIndex, 0, source);
      persistSlideSettings(next, hiddenSlides);
      return next;
    });
  }, [hiddenSlides, persistSlideSettings]);

  const toggleSlideHidden = useCallback((id: SlideId) => {
    setHiddenSlides((current) => {
      const isHidden = current.includes(id);
      if (!isHidden && visibleSlides.length <= 1) return current;
      const next = isHidden ? current.filter((slideId) => slideId !== id) : [...current, id];
      persistSlideSettings(slideOrder, next);
      return next;
    });
  }, [persistSlideSettings, slideOrder, visibleSlides.length]);

  const resetSlideSettings = useCallback(() => {
    setSlideOrder(defaultSlideOrder);
    setHiddenSlides(defaultHiddenSlides);
    setTopicLabels(defaultTopicLabels);
    setSlideTopics(defaultSlideTopics);
    setSlideIndex(0);
    persistSlideSettings(defaultSlideOrder, defaultHiddenSlides);
    window.localStorage.setItem("gen-ai-topic-labels-v1", JSON.stringify(defaultTopicLabels));
    window.localStorage.setItem("gen-ai-slide-topics-v1", JSON.stringify(defaultSlideTopics));
    requestAnimationFrame(() => {
      if (deckRef.current) deckRef.current.scrollTop = 0;
    });
  }, [persistSlideSettings]);

  const updateProfileDraft = useCallback((key: keyof ProfileData, value: string) => {
    setProfileDraft((current) => ({ ...current, [key]: value }));
  }, []);

  const beginProfileEdit = useCallback(() => {
    setProfileDraft(profile);
    setProfileEditing(true);
  }, [profile]);

  const cancelProfileEdit = useCallback(() => {
    setProfileDraft(profile);
    setProfileEditing(false);
  }, [profile]);

  const saveProfile = useCallback(() => {
    setProfile(profileDraft);
    window.localStorage.setItem("gen-ai-profile-v1", JSON.stringify(profileDraft));
    setProfileEditing(false);
  }, [profileDraft]);

  const goToSlide = useCallback((nextIndex: number) => {
    const index = Math.max(0, Math.min(visibleSlides.length - 1, nextIndex));
    const targetId = visibleSlides[index]?.id;
    const deck = deckRef.current;
    const section = targetId ? deck?.querySelector<HTMLElement>(`:scope > section[data-slide-id="${targetId}"]`) : null;
    if (deck && section) {
      if (index === navigationIndexRef.current && Math.abs(deck.scrollTop - section.offsetTop) < 2) return;
      document.documentElement.dataset.slideDirection = index < navigationIndexRef.current ? "back" : "forward";
      navigationIndexRef.current = index;
      transitionRef.current?.skipTransition();
      const update = () => {
        deck.style.scrollBehavior = "auto";
        deck.scrollTop = section.offsetTop;
        flushSync(() => setSlideIndex(index));
      };
      if (document.startViewTransition && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        const transition = document.startViewTransition(update);
        transitionRef.current = transition;
        void transition.ready.catch(() => {});
        void transition.finished.catch(() => {}).finally(() => {
          if (transitionRef.current !== transition) return;
          transitionRef.current = null;
          // A wheel/touch scroll can change the visible page during a transition.
          // Reconcile after the snapshot is removed, even if no new observer entry fires.
          let nearestIndex = index;
          let nearestDistance = Infinity;
          visibleSlides.forEach((slide, candidate) => {
            const element = deck.querySelector<HTMLElement>(`:scope > section[data-slide-id="${slide.id}"]`);
            if (!element) return;
            const distance = Math.abs(element.offsetTop - deck.scrollTop);
            if (distance < nearestDistance) { nearestDistance = distance; nearestIndex = candidate; }
          });
          navigationIndexRef.current = nearestIndex;
          setSlideIndex(nearestIndex);
        });
      } else update();
    }
  }, [visibleSlides]);

  const goToSlideId = (id: string) => {
    const index = visibleSlides.findIndex(slide => slide.id === id);
    if (index >= 0) goToSlide(index);
    else setDeckEditing(true);
  };

  useEffect(() => {
    if (!hydrated) return;
    const id = new URLSearchParams(window.location.search).get("slide");
    if (!id || !isSlideId(id)) return;
    const timer = window.setTimeout(() => {
      const index = visibleSlides.findIndex(slide => slide.id === id);
      if (index >= 0) goToSlide(index);
      else setDeckEditing(true);
      const url = new URL(window.location.href);
      url.searchParams.delete("slide");
      window.history.replaceState(null, "", url);
    }, 120);
    return () => window.clearTimeout(timer);
  }, [hydrated, visibleSlides, goToSlide]);

  const toggleFullscreen = useCallback(async () => {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await deckRef.current?.requestFullscreen();
  }, []);

  useEffect(() => {
    const deck = deckRef.current;
    if (!deck) return;
    const sections = visibleSlides
      .map((slide) => deck.querySelector<HTMLElement>(`:scope > section[data-slide-id="${slide.id}"]`))
      .filter((section): section is HTMLElement => Boolean(section));
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => entry.target.classList.toggle("is-active", entry.isIntersecting && entry.intersectionRatio > 0.35));
      const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible && !transitionRef.current) {
        const index = sections.indexOf(visible.target as HTMLElement);
        navigationIndexRef.current = index;
        setSlideIndex(index);
      }
    }, { root: deck, threshold: [0.45, 0.65, 0.85] });
    sections.forEach(section => observer.observe(section));
    return () => observer.disconnect();
  }, [visibleSlides]);

  useEffect(() => {
    const deck = deckRef.current;
    const cursor = ambientRef.current;
    if (!deck || !cursor || !laserEnabled || window.matchMedia("(pointer: coarse)").matches) return;
    let frame = 0;
    let nextX = 0;
    let nextY = 0;
    const paint = () => {
      cursor.style.transform = `translate3d(${nextX}px, ${nextY}px, 0)`;
      frame = 0;
    };
    const onPointerMove = (event: PointerEvent) => {
      nextX = event.clientX;
      nextY = event.clientY;
      cursor.classList.add("is-visible");
      cursor.classList.toggle("is-interactive", Boolean((event.target as HTMLElement | null)?.closest("button, a, input, select, summary, [role='button']")));
      if (!frame) frame = requestAnimationFrame(paint);
    };
    const onPointerLeave = () => cursor.classList.remove("is-visible", "is-interactive");
    deck.addEventListener("pointermove", onPointerMove, { passive: true });
    deck.addEventListener("pointerleave", onPointerLeave, { passive: true });
    return () => {
      deck.removeEventListener("pointermove", onPointerMove);
      deck.removeEventListener("pointerleave", onPointerLeave);
      if (frame) cancelAnimationFrame(frame);
      cursor.classList.remove("is-visible", "is-interactive");
    };
  }, [laserEnabled]);

  useEffect(() => {
    if (slideIndex > visibleSlides.length - 1) setSlideIndex(Math.max(0, visibleSlides.length - 1));
  }, [slideIndex, visibleSlides.length]);

  useEffect(() => {
    if (!currentSlide) return;
    const nav = navRef.current;
    const activeItem = currentTopicId ? nav?.querySelector<HTMLElement>(`[data-nav-topic="${currentTopicId}"]`) : null;
    if (nav && activeItem) nav.scrollTo({ left: activeItem.offsetLeft - (nav.clientWidth - activeItem.clientWidth) / 2, behavior: "smooth" });
  }, [currentSlide, currentTopicId]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (event.defaultPrevented || document.querySelector("dialog[open]")) return;
      if (target?.closest("input, textarea, select, [contenteditable='true']")) return;
      if (target?.closest("[data-scene-controls]")) return;
      if (deckEditing) {
        if (event.key === "Escape") setDeckEditing(false);
        return;
      }
      const isInteractive = Boolean(target?.closest("button, a, summary, [role='button']"));
      if (["ArrowRight", "ArrowDown", "PageDown"].includes(event.key) || (event.key === " " && !isInteractive)) {
        event.preventDefault();
        goToSlide(navigationIndexRef.current + 1);
      } else if (["ArrowLeft", "ArrowUp", "PageUp"].includes(event.key)) {
        event.preventDefault();
        goToSlide(navigationIndexRef.current - 1);
      } else if (event.key === "Home") {
        event.preventDefault();
        goToSlide(0);
      } else if (event.key === "End") {
        event.preventDefault();
        goToSlide(visibleSlides.length - 1);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [deckEditing, goToSlide, slideIndex, visibleSlides.length]);

  return (
    <main
      id="presentation"
      data-ready={hydrated}
      inert={!hydrated}
      className={`deck ${deckEditing ? "is-deck-editing" : ""}`}
      data-topic={currentTopicId}
      data-current-slide={currentSlide?.id}
      data-laser={laserEnabled}
      ref={deckRef}
      style={{
        "--active-accent": activeTheme.accent,
        "--active-secondary": activeTheme.secondary,
        "--active-surface": activeTheme.surface,
      } as CSSProperties}
    >
      <div className="deck-atmosphere" aria-hidden="true">
        <i className="deck-orb deck-orb-a" /><i className="deck-orb deck-orb-b" /><i className="deck-orb deck-orb-c" />
        <span className="deck-grid" /><span className="deck-noise" />
      </div>
      <div className="ambient-cursor" ref={ambientRef} aria-hidden="true" />
      <InsightDialog insight={insight} onClose={() => setInsight(null)} />
      <header className="topbar">
        <a className="brand" href="#intro" onClick={(event) => { event.preventDefault(); goToSlide(0); }}>GEN AI / 2017—2026</a>
        <nav ref={navRef} aria-label="大テーマのナビゲーション">
          {visibleTopics.map((topic, index) => <button
            type="button"
            key={topic.id}
            data-nav-topic={topic.id}
            className={currentTopicId === topic.id ? "active" : ""}
            aria-current={currentTopicId === topic.id ? "page" : undefined}
            onClick={() => goToSlide(topic.firstIndex)}
            title={`${index + 1}. ${topic.displayLabel}`}
          ><span>{String(index + 1).padStart(2, "0")}</span>{topic.displayLabel}</button>)}
        </nav>
        <button className="deck-editor-toggle" type="button" onClick={() => setDeckEditing((current) => !current)} aria-pressed={deckEditing}>ページ編集</button>
      </header>

      {deckEditing && <aside className="deck-editor" aria-label="ページの順序と表示設定">
        <header><div><span>EDIT MODE</span><h2>ページを編集</h2><p>表示 {visibleSlides.length} / 全 {slideCatalog.length} ページ</p></div><button type="button" onClick={() => setDeckEditing(false)} aria-label="編集モードを閉じる">×</button></header>
        <p className="deck-editor-help">行をドラッグして並べ替え、大テーマの変更、表示・非表示の切り替えができます。</p>
        <details className="deck-editor-topics">
          <summary><span>大テーマ名を編集</span><small>トップナビゲーション</small></summary>
          <div>{topicCatalog.map((topic, index) => <label key={topic.id}><span>{String(index + 1).padStart(2, "0")}</span><input value={topicLabels[topic.id]} onChange={(event) => updateTopicLabel(topic.id, event.target.value)} aria-label={`${topic.label}のテーマ名`} /></label>)}</div>
        </details>
        <ol>
          {slideOrder.map((id, index) => {
            const slide = slideCatalog.find((item) => item.id === id)!;
            const isHidden = hiddenSlideSet.has(id);
            return <li
              key={id}
              className={`${isHidden ? "is-hidden" : ""} ${draggedSlide === id ? "is-dragging" : ""}`}
              draggable
              onDragStart={() => setDraggedSlide(id)}
              onDragEnd={() => setDraggedSlide(null)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => { if (draggedSlide) reorderSlide(draggedSlide, id); setDraggedSlide(null); }}
            >
              <span className="deck-editor-grip" aria-hidden="true">⋮⋮</span>
              <b>{String(index + 1).padStart(2, "0")}</b>
              <div>
                <strong>{slide.label}</strong>
                <label className="deck-editor-topic-picker">
                  <span>大テーマ</span>
                  <select value={slideTopics[id]} onChange={(event) => updateSlideTopic(id, event.target.value as TopicId)} aria-label={`${slide.label}の大テーマ`}>
                    {topicCatalog.map((topic) => <option key={topic.id} value={topic.id}>{topicLabels[topic.id].trim() || topic.label}</option>)}
                  </select>
                </label>
                <small>{isHidden ? "非表示" : "表示中"}</small>
              </div>
              <button type="button" onClick={() => moveSlide(id, -1)} disabled={index === 0} aria-label={`${slide.label}を上へ移動`}>↑</button>
              <button type="button" onClick={() => moveSlide(id, 1)} disabled={index === slideOrder.length - 1} aria-label={`${slide.label}を下へ移動`}>↓</button>
              <button type="button" className="visibility-button" onClick={() => toggleSlideHidden(id)} disabled={!isHidden && visibleSlides.length <= 1} aria-label={`${slide.label}を${isHidden ? "表示" : "非表示"}にする`} title={isHidden ? "表示する" : "非表示にする"}>{isHidden ? "○" : "●"}</button>
            </li>;
          })}
        </ol>
        <footer><button type="button" onClick={resetSlideSettings}>初期状態に戻す</button><span>設定はこのブラウザに自動保存されます。</span></footer>
      </aside>}

      <div className="slide-context" aria-live="polite"><span>{String(slideIndex + 1).padStart(2, "0")}</span><b>{currentSlide?.label}</b></div>
      <div className="deck-progress" aria-hidden="true"><i style={{ transform: `scaleX(${(slideIndex + 1) / visibleSlides.length})` }} /></div>

      <div className="presenter-controls" aria-label="プレゼンテーション操作">
        <button type="button" onClick={() => goToSlide(slideIndex - 1)} disabled={slideIndex === 0} aria-label="前のページ">←</button>
        <div><b>{String(slideIndex + 1).padStart(2, "0")}</b><span>/ {String(visibleSlides.length).padStart(2, "0")}</span><small>{currentSlide?.label}</small></div>
        <button type="button" onClick={() => goToSlide(slideIndex + 1)} disabled={slideIndex === visibleSlides.length - 1} aria-label="次のページ">→</button>
        <button type="button" onClick={toggleFullscreen} aria-label="全画面表示">⛶</button>
        <button type="button" onClick={() => setLaserEnabled(value => !value)} aria-pressed={laserEnabled} aria-label="レーザーポインター" title="レーザーポインター">◎</button>
      </div>

      <aside className="slide-rail" aria-label="スライド一覧">
        {visibleSlides.map((slide, index) => (
          <button key={slide.id} className={slideIndex === index ? "active" : ""} onClick={() => goToSlide(index)} aria-label={`${index + 1}ページ：${slide.label}`} title={slide.label}>
            <span>{String(index + 1).padStart(2, "0")}</span>
          </button>
        ))}
      </aside>

      <section {...slideProps("intro")} className="profile-section section-pad" id="intro">
        <div className="profile-head">
          <div className="section-no">00 / SELF INTRODUCTION</div>
          <div className="profile-head-tools">
            <span>社内発表 / PRESENTER PROFILE</span>
            <div className="profile-edit-actions">
              {profileEditing ? (
                <><button type="button" onClick={cancelProfileEdit}>キャンセル</button><button type="button" className="primary" onClick={saveProfile}>保存</button></>
              ) : <button type="button" className="primary" onClick={beginProfileEdit}>編集</button>}
            </div>
          </div>
        </div>
        <div className="profile-layout">
          <div className="profile-identity" data-career-focus={careerSelected}>
            <span>PRESENTER</span>
            {profileEditing ? <input className="profile-edit-input profile-name-input" aria-label="氏名" value={profileDraft.name} onChange={(event) => updateProfileDraft("name", event.target.value)} /> : <h1>{profile.name}</h1>}
            {profileEditing ? <input className="profile-edit-input profile-roman-input" aria-label="ローマ字氏名" value={profileDraft.romanName} onChange={(event) => updateProfileDraft("romanName", event.target.value)} /> : <p>{profile.romanName}</p>}
            <div className="profile-current">
              <small>CURRENT / 2025—</small>
              {profileEditing ? <input className="profile-edit-input profile-current-title-input" aria-label="現在の所属" value={profileDraft.currentTeam} onChange={(event) => updateProfileDraft("currentTeam", event.target.value)} /> : <b>{profile.currentTeam}</b>}
              {profileEditing ? <input className="profile-edit-input profile-detail-input" aria-label="現在の所属補足" value={profileDraft.currentNote} onChange={(event) => updateProfileDraft("currentNote", event.target.value)} /> : <span>{profile.currentNote}</span>}
            </div>
          </div>
          <div className="profile-career" aria-label="経歴" data-selected={careerSelected} data-scene-controls>
            <div className="profile-career-title"><span>CAREER TIMELINE</span><b>これまでと、現在。</b></div>
            <article>
              {profileEditing ? <input className="profile-edit-input profile-year-input" aria-label="最初の期間" value={profileDraft.beforeYear} onChange={(event) => updateProfileDraft("beforeYear", event.target.value)} /> : <button type="button" className="career-year" aria-pressed={careerSelected === 0} onClick={() => setCareerSelected(0)}><time>{profile.beforeYear}</time><small>選択 ↗</small></button>}
              <div><span>BEFORE</span>{profileEditing ? <input className="profile-edit-input profile-title-input" aria-label="最初の経歴" value={profileDraft.beforeTitle} onChange={(event) => updateProfileDraft("beforeTitle", event.target.value)} /> : <h2>{profile.beforeTitle}</h2>}</div>
            </article>
            <article>
              {profileEditing ? <input className="profile-edit-input profile-year-input" aria-label="入社時期" value={profileDraft.joinYear} onChange={(event) => updateProfileDraft("joinYear", event.target.value)} /> : <button type="button" className="career-year" aria-pressed={careerSelected === 1} onClick={() => setCareerSelected(1)}><time>{profile.joinYear}</time><small>選択 ↗</small></button>}
              <div><span>JOIN</span>{profileEditing ? <><input className="profile-edit-input profile-title-input" aria-label="入社経歴" value={profileDraft.joinTitle} onChange={(event) => updateProfileDraft("joinTitle", event.target.value)} /><input className="profile-edit-input profile-detail-input" aria-label="配属先" value={profileDraft.joinDetail} onChange={(event) => updateProfileDraft("joinDetail", event.target.value)} /></> : <><h2>{profile.joinTitle}</h2><p>{profile.joinDetail}</p></>}</div>
            </article>
            <article className="is-current">
              {profileEditing ? <input className="profile-edit-input profile-year-input" aria-label="兼務開始時期" value={profileDraft.currentYear} onChange={(event) => updateProfileDraft("currentYear", event.target.value)} /> : <button type="button" className="career-year" aria-pressed={careerSelected === 2} onClick={() => setCareerSelected(2)}><time>{profile.currentYear}</time><small>選択 ↗</small></button>}
              <div><span>CURRENT</span>{profileEditing ? <><input className="profile-edit-input profile-title-input" aria-label="兼務先" value={profileDraft.currentTitle} onChange={(event) => updateProfileDraft("currentTitle", event.target.value)} /><input className="profile-edit-input profile-detail-input" aria-label="兼務内容" value={profileDraft.currentDetail} onChange={(event) => updateProfileDraft("currentDetail", event.target.value)} /></> : <><h2>{profile.currentTitle}</h2><p>{profile.currentDetail}</p></>}</div>
            </article>
          </div>
        </div>
        {!profileEditing && <div className="career-focus" aria-live="polite"><span>{[profile.beforeYear, profile.joinYear, profile.currentYear][careerSelected]}</span><b>{[profile.beforeTitle, profile.joinTitle, profile.currentTitle][careerSelected]}</b><p>{[profile.beforeTitle, profile.joinDetail, profile.currentDetail][careerSelected]}</p><small>{careerSelected === 2 ? profile.currentTeam : careerSelected === 1 ? profile.joinDetail : "BEFORE"}</small></div>}
        <div className="profile-footer">
          <div><span>TODAY&apos;S TOPIC</span>{profileEditing ? <><input className="profile-edit-input profile-topic-input" aria-label="発表テーマ" value={profileDraft.topic} onChange={(event) => updateProfileDraft("topic", event.target.value)} /><input className="profile-edit-input profile-topic-detail-input" aria-label="発表テーマ詳細" value={profileDraft.topicDetail} onChange={(event) => updateProfileDraft("topicDetail", event.target.value)} /></> : <><b>{profile.topic}</b><small>{profile.topicDetail}</small></>}</div>
        </div>
      </section>

      <section {...slideProps("cover")} className="hero" id="top">
        <CapabilityMap />
        <div className="eyebrow"><span>社内発表資料</span><span>UPDATED 2026.09.03</span></div>
        <p className="kicker">THE EVOLUTION OF GENERATIVE AI</p>
        <h1>生成AIの発展<br /><em>言語モデルからAgentシステムまで</em></h1>
        <p className="lead">Transformerが「生成する能力」を拡張し、Tool UseとMCPが外部世界へ接続し、Agentが目標達成のループを担う。<br />9年間の変化を、モデル・システム・運用という3つの設計層で読み解く。</p>
        <div className="hero-metrics" aria-label="資料の概要">
          <div><b>09</b><span>YEARS</span></div><div><b>16</b><span>TURNING POINTS</span></div><div><b>11</b><span>VISUAL MAPS</span></div><div><b>{visibleSources.length}</b><span>REFERENCES</span></div>
        </div>
        <div className="hero-path" aria-label="生成AIの能力拡張">
          <span><b>01</b>MODEL<small>生成・推論</small></span><i>→</i>
          <span><b>02</b>GROUND<small>外部知識を使う</small></span><i>→</i>
          <span><b>03</b>CONNECT<small>ツールへ接続</small></span><i>→</i>
          <span><b>04</b>ACT<small>状態を変える</small></span><i>→</i>
          <span><b>05</b>OPERATE<small>検証し完了する</small></span>
        </div>
        <div className="hero-foot">
          <div className="thesis"><b>本日の結論</b><span>LLMは能力の中核。価値を生むのは、文脈・ツール・制御・評価を組み合わせ、<br />人の責任の下で仕事を完了できるシステムである。</span></div>
        </div>
      </section>

      <section {...slideProps("manifesto")} className="manifesto section-pad">
        <div className="section-no">00 / ONE SENTENCE</div>
        <p className="giant-copy">生成AIの機能は、<span>文章生成</span>、<span>対話</span>、<span>情報検索</span>、<span>外部ツールの操作</span>、<span>タスクの実行</span>へと拡張してきた。</p>
        <CapabilityLab />

        <div className="evolution-strip" aria-label="生成AIの能力進化">
          {["PREDICT\n予測", "FOLLOW\n指示", "CONVERSE\n対話", "PERCEIVE\n認識", "ACT\n行動", "CONNECT\n接続", "CREATE\n開発"].map((x, i) => <div key={x}><small>0{i + 1}</small>{x.split("\n").map(t => <span key={t}>{t}</span>)}</div>)}
        </div>
        <div className="manifesto-insights">
          {[
            { kicker: "SHIFT 01 / OUTPUT → INTERACTION", title: "生成物から、対話体験へ", summary: "自然言語がUIになり、利用者の追加情報と修正を次の推論へ戻せるようになった。", points: ["一回の生成から、反復的な共同作業へ変わった", "会話履歴そのものがContextになる", "モデル性能と同じくらい、体験設計が利用価値を左右する"] },
            { kicker: "SHIFT 02 / MODEL → SYSTEM", title: "回答から、外部作用へ", summary: "RAGは根拠を補い、Tool UseはAPIを実行する。モデルの出力が現実の状態変化へ接続された。", points: ["RAGは知識取得のパターンであり、行動主体ではない", "Tool Useは構造化された実行要求をつくる", "副作用には最小権限・承認・監査ログが要る"] },
            { kicker: "SHIFT 03 / DEMO → OPERATION", title: "試作から、再現可能な運用へ", summary: "HarnessとLoopが、文脈・権限・状態・検証・停止をモデルの外側で制御する。", points: ["成功条件をTestとEvalで機械的に観測する", "失敗を保存し、再計画・再開・停止を分岐する", "高影響な判断と最終責任は人が持つ"] },
          ].map((card, index) => <article className="reveal-card" key={card.kicker}>
            <span>SHIFT {String(index + 1).padStart(2, "0")}</span><b>{card.kicker.split(" / ")[1]}</b><h3>{card.title}</h3><p>{card.summary}</p>
            <button type="button" className="card-reveal-trigger" onClick={() => setInsight(card)}>DETAIL <i>＋</i></button>
          </article>)}
        </div>
      </section>

      <section {...slideProps("overview")} className="overview-section section-pad atlas-overview-section" id="overview">
        <AgentAtlas embedded active={currentSlide?.id === "overview"} onNavigate={goToSlideId} />
      </section>

      <section {...slideProps("timeline")} className="timeline-section section-pad" id="timeline">
        <div className="section-head">
          <div><div className="section-no">02 / TIMELINE</div><h2>2017年から2026年までの<br />主な発展。</h2></div>
          <p>Token予測から、会話、外部操作、完了条件を持つタスクへ。<br />16の転換点を、能力・接続・運用の因果で整理する。</p>
        </div>
        <ChronologyScene items={timeline} details={timelineDetails} sources={sources} />
      </section>

      <section {...slideProps("agent")} className="agent-section dark section-pad" id="agent">
        <div className="section-head light-head agent-head">
          <div><div className="section-no">03 / AGENT</div><h2>Chatbot、Workflow、<br />Agentの違い。</h2></div>
          <p><b>Chatbot・Workflow・Agentの差は、制御主体で見分ける。</b><br />ユーザー、事前定義コード、モデルのどれが次の一手を決めるか。</p>
        </div>
        <AgentScene active={currentSlide?.id === "agent"} />
        <details className="scene-notes"><summary aria-label="関連資料と詳細">＋</summary><div className="scene-notes-content">
<div className="agent-contrast agent-control-compare" aria-label="Chatbot、Workflow、Agentの制御主体の比較">
          <article className="chatbot-shot">
            <span>CHATBOT / USER-DRIVEN</span>
            <div className="one-shot-flow"><b>USER<small>次の入力</small></b><i>↓</i><b className="answer-node">ANSWER<small>応答</small></b><i>↓</i><strong>WAIT</strong></div>
            <h3>ユーザーが次のターンを決める</h3>
            <p>会話は複数ターン続くこともあるが、次の要求を与えるのは基本的にユーザーである。</p>
          </article>
          <article className="workflow-shot">
            <span>WORKFLOW / CODE-DRIVEN</span>
            <div className="workflow-flow"><b>TRIGGER</b><i>→</i><b>STEP A</b><i>→</i><b>STEP B</b><i>→</i><strong>DONE</strong></div>
            <h3>コードが次の経路を決める</h3>
            <p>事前定義した分岐と手順を確実に実行する。固定的な業務では、Agentより安定しやすい。</p>
          </article>
          <article className="agent-cycle">
            <div className="agent-cycle-copy"><span>AGENT / MODEL-DRIVEN</span><h3>モデルが次の行動を選ぶ</h3><p>目標と制約からツールと経路を選び、観測した結果で計画を更新する。</p><small className="agent-exits">DONE · STOP · TIMEOUT · BUDGET · HUMAN · ESCALATE</small></div>
            <div className="cycle-orbit" aria-label="Plan、Act、Observe、Reviseの循環" onClick={(event) => {
              const button = (event.target as HTMLElement).closest<HTMLButtonElement>("button");
              if (!button) return;
              const title = button.querySelector("b")?.textContent || "AGENT LOOP";
              const detail = agentLoopDetails[title];
              if (detail) setInsight(detail);
            }}>
              <button type="button"><span>01</span><b>PLAN</b><small>計画</small></button>
              <button type="button"><span>02</span><b>ACT</b><small>実行</small></button>
              <button type="button"><span>03</span><b>OBSERVE</b><small>観察</small></button>
              <button type="button"><span>04</span><b>REVISE</b><small>修正</small></button>
              <i>↻</i>
            </div>
          </article>
        </div>

        <div className="agent-process-label"><span>REAL AGENT FLOW</span><b>目標設定から検証までを、一連の流れで見る。</b></div>
        <div className="agent-process" aria-label="実務Agentの基本フロー">
          <div className="process-title"><span>GOAL</span><b>達成したい状態</b><i>→</i></div>
          {[
            ["01", "PLAN", "手順を決める"],
            ["02", "SELECT", "ツールを選ぶ"],
            ["03", "EXECUTE", "外部へ働きかける"],
            ["04", "OBSERVE", "結果を読む"],
            ["05", "VERIFY", "完了を判断する"],
          ].map(([number, title, note], index) => <div className="process-step" key={title}><span>{number}</span><b>{title}</b><small>{note}</small>{index < 4 && <i>→</i>}</div>)}
          <div className="approval-branch"><span>RISKY?</span><b>HUMAN APPROVAL</b><small>影響の大きい操作は、人の承認を通す</small><i>↓ EXECUTE</i></div>
        </div>

        <p className="definition agent-definition"><b>Agentは常に正しいわけではない。</b> 柔軟性にはコスト・遅延・不確実性が伴う。手順が明確な仕事はWorkflowに任せ、状況に応じた判断が必要な部分だけをAgent化する。<a href={sources[14].url} target="_blank" rel="noreferrer">[15] ↗</a></p>
        </div></details>
      </section>

      <section {...slideProps("mcp")} className="mcp-section section-pad" id="mcp">
        <div className="section-head mcp-head">
          <div><div className="section-no">04 / MCP</div><h2>MCPの役割と<br />基本構造。</h2></div>
          <p><b>Tools・Resources・Promptsの公開と呼び出し方を共通化する。</b><br />接続を再利用可能にするが、推論・計画・安全性そのものは提供しない。</p>
        </div>
        <ProtocolScene active={currentSlide?.id === "mcp"} />
        <details className="scene-notes"><summary aria-label="関連資料と詳細">＋</summary><div className="scene-notes-content">
<div className="mcp-interface" aria-label="AIとツールやデータをつなぐMCPの概念図">
          <div className="mcp-side mcp-ai"><span>HOST SIDE</span><b>AI APP / LLM APP</b><small>会話・権限・Clientを管理する</small><div><strong>CODING AGENT</strong><strong>IDE</strong><strong>INTERNAL APP</strong></div></div>
          <div className="mcp-core"><span>STANDARD INTERFACE</span><b>MCP</b><small>Tools · Resources · Prompts</small><i aria-hidden="true">↔</i></div>
          <div className="mcp-world"><span>SERVER SIDE</span><div>{["FILES", "DATABASE", "BROWSER", "API", "INTERNAL TOOLS", "WORKFLOW"].map((item, index) => <button type="button" key={item} aria-pressed={mcpSelected === index} onClick={() => setMcpSelected(index)}><span>{String(index + 1).padStart(2, "0")}</span><b>{item}</b></button>)}</div></div>
        </div>

        <div className="mcp-technical" aria-label="MCPの技術構造">
          <span>TECHNICAL DETAIL</span>
          <div><b>HOST</b><small>AIアプリ。複数Clientを管理</small></div><i>→</i>
          <div><b>CLIENT</b><small>1つのServerとのセッションを担当</small></div><i><em>JSON-RPC 2.0</em><small>over stdio / Streamable HTTP</small></i>
          <div><b>SERVER</b><small>Tools / Resources / Prompts</small></div>
        </div>

        <div className="mcp-insights">
          <article><span>01 / STANDARD</span><h3>N×Mの個別実装を、<br />再利用できる接続面へ。</h3><a href={sources[38].url} target="_blank" rel="noreferrer">AAIFへ移管 [39] ↗</a></article>
          <article><span>02 / LOCAL → REMOTE</span><h3>LocalからRemoteまで、<br />共通の接続モデルへ。</h3><a href={sources[37].url} target="_blank" rel="noreferrer">stdio / Streamable HTTP [38] ↗</a></article>
          <article><span>03 / CONTROL</span><h3>接続の標準化 ≠<br />安全性の保証。</h3><p>同意・最小権限・認証・ログ・停止の仕組みは、Host側で設計する。</p></article>
        </div>

        <div className="protocol-compare" aria-label="MCPとA2Aの主な役割と補完関係"><span>PRIMARY ROLE / 主な役割</span><article><b>MCP</b><small>TOOLS / CONTEXT</small><p>AI App ↔ Tools / Data</p></article><i>＋</i><article><b>A2A</b><small>COLLABORATION</small><p>Agent ↔ Agent</p></article></div>
        </div></details>
      </section>

      <section {...slideProps("concepts")} className="concept-section section-pad">
        <div className="section-head compact-head concept-head">
          <div><div className="section-no">04B / ABSTRACTION MAP</div><h2>LLM、RAG、MCP、<br />Agentの関係。</h2></div>
          <p><b>Model、Pattern、Protocol、System Architecture。</b><br />役割と責任範囲を分けると、設計判断が明確になる。</p>
        </div>
        <ConceptScene active={currentSlide?.id === "concepts"} />
        <details className="scene-notes"><summary aria-label="関連資料と詳細">＋</summary><div className="scene-notes-content">
<div className="concept-roles" aria-label="LLM、RAG、MCP、Agentの役割比較。番号順や進化順ではない">
          <button type="button" className="concept-role role-model" onClick={() => setInsight(conceptRoleDetails.LLM)}><span>MODEL</span><b>LLM</b><h3>考えるためのモデル</h3><p>入力を理解し、推論・生成する。</p><small>DETAIL ↗</small></button>
          <button type="button" className="concept-role role-pattern" onClick={() => setInsight(conceptRoleDetails.RAG)}><span>PATTERN</span><b>RAG</b><h3>外部知識を与える方法</h3><p>検索した情報をContextへ加える。</p><small>DETAIL ↗</small></button>
          <button type="button" className="concept-role role-protocol" onClick={() => setInsight(conceptRoleDetails.MCP)}><span>PROTOCOL</span><b>MCP</b><h3>ツール・データへの接続規格</h3><p>ClientとServer間の共通接続を定義する。</p><small>DETAIL ↗</small></button>
          <button type="button" className="concept-role role-system" onClick={() => setInsight(conceptRoleDetails.AGENT)}><span>SYSTEM ARCHITECTURE</span><b>AGENT</b><h3>目標へ向けて行動するシステム</h3><p>モデル、情報、ツール、Loopを束ねる。</p><small>CONTAINS &amp; ORCHESTRATES ↘</small></button>
        </div>

        <div className="concept-architecture" aria-label="Harnessの中でAgentがLLM、RAG、MCPを使い、出張申請を完了する構造">
          <header><span>HARNESS / RUNTIME</span><b>権限・Sandbox・State・Logs・Evalsを提供する実行環境</b></header>
          <div className="concept-agent-frame">
            <div className="concept-agent-head"><span>AGENT / SYSTEM ARCHITECTURE</span><b>GOAL — 出張申請を完了する</b><small>Agentが全工程を制御する</small></div>
            <div className="concept-agent-flow">
              <button type="button" className="concept-stage stage-plan" onClick={() => setInsight(conceptRoleDetails.LLM)}><small>PLAN</small><b>LLM</b><span>手順と不足情報を判断</span></button>
              <i>→</i>
              <button type="button" className="concept-stage stage-ground" onClick={() => setInsight(conceptRoleDetails.RAG)}><small>GROUND</small><b>RAG</b><span>社内規程を検索</span></button>
              <i>→</i>
              <button type="button" className="concept-stage stage-act" onClick={() => setInsight(conceptRoleDetails.MCP)}><small>CONNECT / ACT</small><b>MCP</b><span>申請Toolへ接続</span></button>
              <i>→</i>
              <button type="button" className="concept-stage stage-verify" onClick={() => setInsight(conceptRoleDetails.AGENT)}><small>VERIFY</small><b>LLM + TOOL RESULT</b><span>結果を確認・必要なら再計画</span></button>
            </div>
            <div className="concept-loop-return"><span>OBSERVE RESULT</span><b>未完了 → REPLAN ↺</b><b>完了 → DELIVER</b><b>高影響 → HUMAN APPROVAL</b></div>
          </div>
          <div className="concept-external"><span>MCP SERVER / EXTERNAL</span><b>出張申請システム</b><small>Tools · Data · Services</small><em>権限と承認を通して操作</em></div>
        </div>
        </div></details>
      </section>

      <section {...slideProps("vibe")} className="vibe-section acid section-pad">
        <div className="section-no">05 / VIBE CODING</div>
        <div className="vibe-editorial-head">
          <h2>自然言語を使った<br /><span>ソフトウェア開発。</span></h2>
          <p><b>自然言語は仕様の入口になったが、完成条件の代わりではない。</b><br />人は目的と制約を示し、Agentが実装し、実際の動作・差分・テストで方向を修正する。</p>
        </div>
        <VibeLab />


        <div className="intent-shift" aria-label="従来の開発とAI時代の開発の比較">
          <article><span>BEFORE / CODE-FIRST</span><div><b>HUMAN</b><i>↓</i><strong>CODE</strong><i>↓</i><b>SOFTWARE</b></div><p>人が実装詳細を記述する。</p></article>
          <i className="shift-arrow">→</i>
          <article className="intent-now"><span>NOW / INTENT-FIRST</span><div><b>HUMAN</b><i>↓</i><strong>INTENT</strong><i>↓</i><b>AGENT</b><i>↓</i><b>SOFTWARE</b></div><p>人が目的を示し、AIの実装を検証する。</p></article>
        </div>

        <div className="responsibility-track" aria-label="試作から本番品質までの責任の移行">
          <header><span>FAST / DISCOVERY</span><b>RESPONSIBILITY</b><span>RELIABLE / OPERATION</span></header>
          <div>{[["01", "DESCRIBE", "目的を言葉にする"], ["02", "GENERATE", "AIが形にする"], ["03", "EXPERIENCE", "触って判断する"], ["04", "ENGINEER", "品質を保証する"]].map(([number, title, note]) => <article key={title}><span>{number}</span><b>{title}</b><small>{note}</small></article>)}</div>
        </div>

        <div className="production-split">
          <article><span>VIBE CODING</span><b>Speed of discovery</b></article>
          <strong>≠</strong>
          <article><span>PRODUCTION ENGINEERING</span><b>Quality of operation</b></article>
          <p>Discoveryでは学習速度を最大化し、Productionでは正確性・安全性・可観測性・保守性を保証する。</p>
        </div>
      </section>

      <section {...slideProps("commodity")} className="commodity-section section-pad">
        <div className="section-no">05B / COMMODITIZATION</div>
        <div className="commodity-statement">
          <h2>AIによる<br />プロトタイプ開発<br /><span>コストの低下。</span></h2>
          <div className="commodity-causal" aria-label="AIによって制作コスト、試行回数、失敗コスト、競争上のボトルネックが変化する因果関係">
            <div className="causal-flow">
              <article><span>BUILD COST</span><b>↓</b><small>つくるコストが下がる</small></article><i>→</i>
              <article><span>ITERATION</span><b>↑</b><small>試せる回数が増える</small></article><i>→</i>
              <article><span>FAILURE COST</span><b>↓</b><small>失敗して学べる</small></article>
            </div>
            <blockquote><b>制作工程は短縮できる</b><span>顧客理解・信頼・流通は<br />別途設計する必要がある</span></blockquote>
          </div>
        </div>
        <CostScene />
        <details className="scene-notes"><summary aria-label="関連資料と詳細">＋</summary><div className="scene-notes-content">
<p className="commodity-thesis"><b>作る前に絞り込む</b><i>→</i><b>小さく作り、証拠で選ぶ</b><span>BUILD COST ↓ → ITERATION ↑ → LEARNING SPEED ↑</span></p>

        <div className="product-paradigm" aria-label="従来型開発とAIネイティブ開発の比較">
          <div className="paradigm-flows">
            <article className="paradigm-before"><header><span>BEFORE / SPECIALIST TEAM</span><b>高い制作費 → 失敗も高い</b></header><div>{["IDEA", "PLAN", "DESIGN", "FE", "BE", "INFRA", "RELEASE"].map((item, index, list) => <span key={item}>{item}{index < list.length - 1 && <i>→</i>}</span>)}</div></article>
            <article className="paradigm-now"><header><span>AI-NATIVE / INDIVIDUAL + AGENT</span><b>低い試行費 → 何度も失敗できる</b></header><div><span>INTENT<i>→</i></span><span>AGENT<i>→</i></span><span>PROTOTYPE<i>↺</i></span><span>HUMAN REVIEW<i>→</i></span><span>VALIDATE</span></div></article>
          </div>
          <div className="paradigm-metrics" role="table" aria-label="人員、時間、試行、失敗コストの比較">
            <div className="metrics-head" role="row"><b role="columnheader">SHIFT</b><span role="columnheader">BEFORE</span><span role="columnheader">AI-NATIVE</span></div>
            {[
              ["PEOPLE", "PM · Design · FE · BE · Infra", "Individual + Agent"],
              ["TIME", "Weeks → Months", "Hours → Days"],
              ["ITERATION", "少数の試作", "多数の高速検証"],
              ["FAILURE COST", "失敗が高く、着手前に絞る", "小さく作り、失敗から学ぶ"],
            ].map(([metric, before, now]) => <div role="row" key={metric}><b role="rowheader">{metric}</b><span role="cell">{before}</span><span role="cell">{now}</span></div>)}
          </div>
        </div>

        <div className="value-migration" aria-label="商品化する制作能力と、差別化される価値の比較">
          <article><span>COMMODITIZED</span><h3>つくる能力</h3><div>{["Code", "UI", "CRUD", "API Integration", "Prototype", "Deployment"].map(item => <b key={item}>{item}</b>)}</div></article>
          <div className="value-migration-core"><span>AI</span><i>↓</i><b>COMMODITIZES<br />BUILD</b><strong>≠ VALUE</strong></div>
          <article className="value-differentiated"><span>DIFFERENTIATED</span><h3>選ばれる理由</h3><div>{["Problem Selection", "Customer Insight", "Distribution", "Proprietary Data", "Trust", "Workflow Integration", "Brand / Community"].map(item => <b key={item}>{item}</b>)}</div></article>
        </div>
        <p className="commodity-takeaway">制作能力が一般化するほど、<b>問題設定、顧客理解、流通、信頼</b>の重要性が高まる。</p>
        <div className="commodity-sources"><a href={sources[13].url} target="_blank" rel="noreferrer">KARPATHY / VIBE CODING [14] ↗</a><a href={sources[20].url} target="_blank" rel="noreferrer">OPENAI / 約1/10の開発時間という実験報告 [21] ↗</a></div>
        </div></details>
      </section>

      <section {...slideProps("engineering")} className="engineering-section section-pad" id="engineering">
        <div className="section-head engineering-head">
          <div><div className="section-no">06 / ENGINEERING STACK</div><h2>Agentシステムを支える<br />4つの設計領域。</h2></div>
          <p><b>指示 → 情報状態 → 実行環境 → 継続制御。</b><br />4つは世代交代ではなく、モデルの外側へ広がる責任の積み重ね。</p>
        </div>
        <ArchitectureScene layers={engineeringLayerCards} />
        <details className="scene-notes"><summary aria-label="関連資料と詳細">＋</summary><div className="scene-notes-content">
<div className="engineering-nested-layout">
          <div className="engineering-nest" aria-label="Promptを中心に、Context、Harness、Loopが外側へ広がる構造">
            {engineeringLayerCards.map((layer) => <div className={`engineering-layer-ring ring-${layer.number}`} key={layer.title}>
              <button type="button" onClick={() => setInsight(layer.detail)} aria-label={`${layer.title}の詳細`}>
                <span>{layer.number}</span><b>{layer.title}</b><small>{layer.question}</small>
              </button>
              <em>{layer.number === "01" ? "一回の指示" : layer.number === "02" ? "判断に使う情報" : layer.number === "03" ? "安全な実行条件" : "継続・再試行・停止"}</em>
            </div>)}
          </div>

          <div className="engineering-layer-list" aria-label="4つの設計領域の役割">
            {[...engineeringLayerCards].reverse().map((layer) => <button type="button" key={layer.title} onClick={() => setInsight(layer.detail)}>
              <span>{layer.number}</span>
              <div><b>{layer.title}</b><h3>{layer.question}</h3><p>{layer.text}</p><small>{layer.examples}</small></div>
              <i>＋</i>
            </button>)}
          </div>
        </div>

        <p className="stack-caption"><span>構造の読み方</span> 中心のPromptから外側へ、判断材料、実行環境、継続制御が加わる。上位・下位の優劣ではなく、Agentが担う仕事の範囲が広がる関係を示している。</p>
        </div></details>
      </section>

      <section {...slideProps("harness")} className="harness-section section-pad">
        <div className="section-head harness-practice-head">
          <div><div className="section-no">06B / HARNESS & LOOP IN PRACTICE</div><h2>HarnessとAgent Loopの<br />役割。</h2></div>
          <p><b>Harnessは、Agent Loopの実行を支える、情報・道具・状態・権限・評価を統合した実行環境。</b><br /><b>Agent Loopは、結果を観測し、次の行動・停止・再計画・人への移譲を決める制御フロー。</b></p>
        </div>
        <HarnessLab active={currentSlide?.id === "harness"} />


        <div className="harness-practice-layout">
          <aside className="framework-legend">
            <article><span>HARNESS</span><h3>実行環境</h3><div>{["CONTEXT", "TOOLS", "SANDBOX", "PERMISSIONS", "STATE", "EVALS", "OBSERVABILITY", "RUNTIME"].map(item => <b key={item}>{item}</b>)}</div></article>
            <article><span>AGENT LOOP</span><h3>制御フロー</h3><div>{["PLAN", "ACT", "OBSERVE", "VERIFY", "REPLAN", "STOP", "HUMAN"].map(item => <b key={item}>{item}</b>)}</div></article>
            <p className="framework-note"><span>NOTE</span>HarnessとLoopの境界は、企業や著者によって異なる。Agent LoopをHarnessの一部として説明する場合もある。</p>
          </aside>

          <div className="harness-interactive-map harness-system-architecture" aria-label="Agent System内のModel / Policy、Agent Loop、Harness / Runtimeの関係">
            <div className="agent-system-title"><span>AGENT SYSTEM</span><b>判断・制御・実行基盤を組み合わせるシステム</b></div>

            <div className="model-policy-band">
              <div><b>MODEL / POLICY</b><span>Reason · Decide</span></div>
              <p>文脈と観測結果から、計画・行動を選ぶ</p>
              <i aria-hidden="true">↓</i>
            </div>

            <div className="agent-loop-track" aria-label="Modelの判断と実行結果を使い、継続・再計画・停止を制御するAgent Loop">
              <header><span>AGENT LOOP</span><b>次の行動と終了を制御</b></header>
              <div className="loop-track-main"><b>PLAN<small>方針</small></b><i>→</i><b>ACT<small>実行</small></b><i>→</i><b>OBSERVE<small>観察</small></b><i>→</i><b>VERIFY<small>判定</small></b></div>
              <div className="loop-outcomes"><span className="pass">PASS <b>DELIVER</b></span><span className="retry">FAIL <b>REPLAN ↺</b></span><span className="human">RISK / LIMIT <b>HUMAN / STOP</b></span></div>
            </div>

            <div className="loop-runtime-exchange" aria-label="LoopからHarnessへ実行要求を渡し、結果・状態・評価をLoopへ戻す">
              <span><i aria-hidden="true">↓</i> 実行要求</span><span><i aria-hidden="true">↑</i> 結果・状態・評価</span>
            </div>

            <div className="harness-map-body">
              <div className="harness-network" aria-label="Agent Loopの実行を支えるHarness / Runtimeの6つの責務">
                <div className="network-caption"><span>HARNESS / RUNTIME</span><b>循環を支える実行基盤</b></div>
                {harnessModules.map((module) => <button
                  type="button"
                  key={module.id}
                  className={`harness-node node-${module.id} ${harnessSelected === module.id ? "is-active" : ""}`}
                  onClick={() => setHarnessSelected(module.id)}
                  aria-pressed={harnessSelected === module.id}
                ><small>{module.kind}</small><b>{module.title}</b><span>{module.short}</span></button>)}
              </div>

              <aside className="harness-module-detail" aria-live="polite">
                <header><span>{selectedHarnessModule.kind} / SELECTED</span><b>{selectedHarnessModule.title}</b></header>
                <p>{selectedHarnessModule.purpose}</p>
                <dl>
                  <div><dt>INPUT / OUTPUT</dt><dd>{selectedHarnessModule.io}</dd></div>
                  <div><dt>DESIGN CHECK</dt><dd>{selectedHarnessModule.check}</dd></div>
                </dl>
              </aside>
            </div>

          </div>
        </div>

        <div className="evidence-timeline" aria-label="HarnessとLoop Engineeringの資料年表">
          <a href={sources[21].url} target="_blank" rel="noreferrer"><time>2025.11.26</time><b>Anthropic</b><span>Effective harnesses for long-running agents</span></a>
          <a href={sources[20].url} target="_blank" rel="noreferrer"><time>2026.02.11</time><b>OpenAI</b><span>Harness Engineering</span></a>
          <a href={sources[24].url} target="_blank" rel="noreferrer"><time>2026.04.27</time><b>OpenAI</b><span>Symphony</span></a>
          <a href={sources[23].url} target="_blank" rel="noreferrer"><time>2026.07.17</time><b>IBM</b><span>Loop Engineering</span></a>
        </div>
      </section>

      <section {...slideProps("reasoning")} className="frontier-section dark section-pad" id="frontier">
        <div className="section-head light-head">
          <div><div className="section-no">07 / CAPABILITY EXPANSION</div><h2>推論モデルの<br />特徴。</h2></div>
          <p>通常のLLMと別の「思考装置」ではない。<br />学習と推論時の計算を工夫し、分解・候補生成・検証を反復して問題解決性能を高める。</p>
        </div>
        <ReasoningLab active={currentSlide?.id === "reasoning"} />

        <div className="frontier-grid">
          <article className="reasoning-copy">
            <span>REASONING MODELS / 2024–</span>
            <h3>即答を最適化せず、<br />探索と検証へ計算を使う。</h3>
            <p>o1以降の推論モデルは、強化学習などで複雑な課題を段階的に処理し、推論時の計算量を増やす方向を示した。DeepSeek-R1は、この方向の学習手法と蒸留モデルを公開した。</p>
            <div className="frontier-tools"><b>OpenAI o-series</b><b>DeepSeek-R1</b><b>Reasoning traces</b><b>Verifier</b></div>
            <p className="precision-note">「人間と同じ思考」を証明したわけではない。確認できるのは、数学・コード・科学などの課題で、反復的な計算と検証により性能が向上することだ。</p>
            <div className="inline-sources"><a href={sources[26].url} target="_blank" rel="noreferrer">OPENAI [27] ↗</a><a href={sources[27].url} target="_blank" rel="noreferrer">DEEPSEEK [28] ↗</a></div>
          </article>
          <MermaidDiagram chart={reasoningChart} label="推論モデルが問題を分解、生成、検証、修正する概念図" caption="図7｜推論モデルとAgentは別物。前者はモデル内部・推論時の問題解決能力、後者は外部ツールを使って目標を完了するシステム。組み合わせることで、より複雑なタスクに対応できる。" />
        </div>
      </section>

      <section {...slideProps("media")} className="media-section section-pad">
        <div className="section-head">
          <div><div className="section-no">07B / MULTIMODAL MEDIA</div><h2>画像・音声・動画を扱う<br />生成AI。</h2></div>
          <p>画像生成を牽引したDiffusionと、複数モダリティを統合するモデルは別の技術系譜。<br />製品では「見る・聞く・話す・作る」が一つの体験へ統合されている。</p>
        </div>
        <MediaScene active={currentSlide?.id === "media"} />
        <details className="scene-notes"><summary aria-label="関連資料と詳細">＋</summary><div className="scene-notes-content">
<div className="media-river">
          <article><time>2020</time><div><b>DIFFUSION</b><h4>ノイズから画像を復元</h4><p>反復的なノイズ除去による高品質画像生成が本格化。</p></div><a href={sources[28].url} target="_blank" rel="noreferrer">[29] ↗</a></article>
          <article><time>2021</time><div><b>TEXT → IMAGE</b><h4>DALL·E</h4><p>自然言語による画像生成を一般に理解しやすい形で提示。</p></div><a href={sources[29].url} target="_blank" rel="noreferrer">[30] ↗</a></article>
          <article><time>2022</time><div><b>OPEN WEIGHTS</b><h4>Stable Diffusion</h4><p>モデル重みの公開で、ローカル生成と創作ツールの生態系が拡大。</p></div><a href={sources[30].url} target="_blank" rel="noreferrer">[31] ↗</a></article>
          <article><time>2023–24</time><div><b>MULTIMODAL</b><h4>画像・音声を理解し生成</h4><p>単一のモデルや統合UIの中で、「見る・聞く・話す・作る」が一体化し始めた。</p></div><span>GPT-4V / Gemini / GPT-4o</span></article>
          <article><time>2024–</time><div><b>TEXT → VIDEO</b><h4>Sora / Runway</h4><p>時空間の一貫性を扱う動画生成へ。物理表現や権利管理は発展途上。</p></div><a href={sources[31].url} target="_blank" rel="noreferrer">[32] ↗</a></article>
        </div>
        <div className="media-takeaways" aria-label="マルチモーダル生成の三つの変化">
          <article><span>01 / INPUT</span><b>見る・聞く</b><p>AIへの入力が文章から画像、音声、動画へ広がった。</p></article>
          <article><span>02 / OUTPUT</span><b>描く・話す・動かす</b><p>単一の生成物から、複数メディアを組み合わせる制作へ。</p></article>
          <article><span>03 / CONTROL</span><b>権利と真正性</b><p>品質だけでなく、出所、同意、著作権、生成物であることを識別できる仕組みが重要になる。</p></article>
        </div>
        </div></details>
      </section>

      <section {...slideProps("open-local")} className="open-section section-pad">
        <div className="section-head">
          <div><div className="section-no">08 / OPEN & LOCAL</div><h2>クラウド型とローカル型の<br />選択。</h2></div>
          <p>小型化・量子化・効率的な調整でローカル実行は現実的になった。<br />ただし、データ境界を自社で制御する代わりに、更新・評価・脆弱性・GPU運用も自社で担う。</p>
        </div>
        <CloudLocalScene active={currentSlide?.id === "open-local"} />
        <details className="scene-notes"><summary aria-label="関連資料と詳細">＋</summary><div className="scene-notes-content">
<div className="local-stack">
          <article><span>MODEL</span><h3>モデルを選ぶ</h3><p>Llama、Mistral、Qwen、DeepSeek、Gemmaなど。サイズ、言語、用途、ライセンスを比較する。</p><div><b>Llama</b><b>Qwen</b><b>DeepSeek</b><b>Gemma</b></div></article>
          <article><span>COMPRESS</span><h3>軽くする</h3><p>量子化でメモリ使用量を抑え、LoRAで全パラメータを更新せず用途へ適応する。</p><div><b>GGUF</b><b>4/8-bit</b><b>LoRA</b><b>QLoRA</b></div></article>
          <article><span>RUNTIME</span><h3>ローカルで動かす</h3><p>端末・ワークステーション・社内サーバーで推論APIや対話UIを提供する。</p><div><b>Ollama</b><b>llama.cpp</b><b>vLLM</b><b>LM Studio</b></div></article>
          <article><span>OPERATE</span><h3>運用を担う</h3><p>データが外に出ない利点と引き換えに、更新、脆弱性、モデル評価、GPU費用を自社で担う。</p><div><b>License</b><b>Security</b><b>Benchmark</b><b>TCO</b></div></article>
        </div>
        <div className="local-decision">
          <div><span>WHEN LOCAL FITS</span><h3>ローカルが有力</h3><ul><li>機密情報を外部へ送れない</li><li>用途が限定され、モデルを固定できる</li><li>オフライン・低遅延が重要</li><li>処理量を予測しやすい大量処理がある</li></ul></div>
          <div><span>WHEN CLOUD FITS</span><h3>クラウドが有力</h3><ul><li>最高性能をすぐ使いたい</li><li>利用量が変動する</li><li>運用人材やGPUを確保できない</li><li>最新モデルへ頻繁に更新したい</li></ul></div>
          <p><b>用語上の注意：</b>公開されているモデルのすべてが、OSI定義のオープンソースとは限らない。本資料では、重みを取得できるモデルを広く<b>Open-weight（公開重み）</b>と表現する。<a href={sources[32].url} target="_blank" rel="noreferrer">LLaMA [33]</a> <a href={sources[33].url} target="_blank" rel="noreferrer">LoRA [34]</a> <a href={sources[34].url} target="_blank" rel="noreferrer">Ollama [35]</a></p>
        </div>
        </div></details>
      </section>

      <section {...slideProps("trust")} className="trust-section acid section-pad">
        <div className="section-head">
          <div><div className="section-no">09 / EVALS & SECURITY</div><h2>Agentの評価方法と<br />安全対策。</h2></div>
          <p>最終状態、行動軌跡、コスト、回復性を証拠として測る。<br />外部作用がある場合は、最小権限・承認・監査・停止を同時に設計する。</p>
        </div>
        <TrustLab />

        <div className="eval-board">
          <article><span>01 / OUTCOME</span><h3>結果</h3><b>成功率</b><p>タスク完了、正確性、根拠、利用者評価。最終成果が目的を満たしたか。</p></article>
          <article><span>02 / TRAJECTORY</span><h3>過程</h3><b>軌跡</b><p>どのツールを、どの順序で、何回使ったか。不要な迂回や危険な行動がないか。</p></article>
          <article><span>03 / EFFICIENCY</span><h3>効率</h3><b>Cost / Latency</b><p>トークン、ツール回数、所要時間、再試行数。成功しても高すぎれば続かない。</p></article>
          <article><span>04 / RESILIENCE</span><h3>回復</h3><b>Failure</b><p>失敗時に安全に止まり、原因を記録し、再実行できるか。境界条件も試験する。</p></article>
        </div>
        <p className="eval-note">評価セットは、代表業務・失敗しやすい境界条件・攻撃入力を含める。実運用で見つかった失敗を回帰テストへ戻し、モデルやPromptを変更するたびに同じ基準で比較する。<a href={sources[35].url} target="_blank" rel="noreferrer">Anthropic Evals [36] ↗</a></p>
        <div className="security-updates" aria-label="2025年から2026年のAIセキュリティ更新">
          <a href={sources[39].url} target="_blank" rel="noreferrer"><span>2025.12 / OWASP</span><h3>Agentic Top 10</h3><p>行動乗っ取り、Tool悪用、Identity・権限乱用など、Agent固有のリスクを独立して整理。</p><b>[40] ↗</b></a>
          <a href={sources[40].url} target="_blank" rel="noreferrer"><span>2026.07 / IPA</span><h3>実務で判断する</h3><p>対策を「技術要件」「運用対策」「人的統制」に分け、企業が根拠を持って選べる形に整理。</p><b>[41] ↗</b></a>
        </div>
        <div className="risk-visual">
          <div><span>RISK EVOLUTION</span><h3>能力が増えるほど、<br />事故の範囲も広がる。</h3><p>幻覚だけを見ていては不十分。検索、ツール、Agent、Multi-Agentへ進むほど、信頼境界・権限・停止設計が重要になる。</p><a href={sources[36].url} target="_blank" rel="noreferrer">OWASP GenAI Security [37] ↗</a></div>
          <MermaidDiagram className="risk-diagram" chart={riskChart} label="生成AIの能力拡張に伴うリスクと対策の進化" caption="図8｜リスクは累積する。RAGで幻覚が減ってもPrompt Injectionが生まれ、Agentで自動化しても過剰権限が問題になる。対策も層ごとに積み上げる。" />
        </div>
      </section>

      <section {...slideProps("adoption")} className="action-section section-pad" id="action">
        <div className="section-head">
          <div><div className="section-no">10 / FOR OUR COMPANY</div><h2>社内導入の<br />段階的な進め方。</h2></div>
          <p>Assist → Connect → Actの順で、データ範囲と権限を段階的に広げる。<br />各段階でKPI・失敗条件・責任者を定義し、通過した範囲だけ展開する。</p>
        </div>
        <AdoptionLab />

        <div className="levels">
          <article><div className="level-no">LEVEL 1</div><h3>ASSIST<br /><span>提案する</span></h3><p>要約・翻訳・下書き・コード補完。外部状態は変えず、人が採否を決める。</p><div className="risk low">READ / DRAFT</div></article>
          <article><div className="level-no">LEVEL 2</div><h3>CONNECT<br /><span>根拠を使う</span></h3><p>RAGやMCPで許可された文書・DB・Toolへ接続。引用、権限、ログを検証する。</p><div className="risk mid">LIMITED ACCESS</div></article>
          <article><div className="level-no">LEVEL 3</div><h3>ACT<br /><span>状態を変える</span></h3><p>更新・送信・申請を実行。高影響操作には承認、冪等性、停止、復旧を組み込む。</p><div className="risk high">WRITE / EXECUTE</div></article>
        </div>
        <div className="decision-visual">
          <div className="decision-intro"><span>DECISION FLOW</span><h3>Agentを使うべきか、<br />どう安全に広げるか。</h3><p>「AIを使う」から始めず、価値・予測可能性・外部作用・評価の順に判断する。</p></div>
          <MermaidDiagram className="adoption-diagram" chart={adoptionChart} label="社内AI導入の判断と段階展開フロー" caption="図4｜固定手順で解ける仕事はWorkflowを優先。Agentは柔軟性が必要な場面に限定し、外部操作には承認と停止条件を置く。" />
        </div>
        <div className="guardrails">
          <h3>導入前の6チェック</h3>
          <ol>
            <li><b>目的</b><span>何のKPIを改善するか</span></li><li><b>データ</b><span>入力してよい情報か</span></li><li><b>権限</b><span>読み取りと書き込みを分けたか</span></li><li><b>検証</b><span>正解率・失敗例を測ったか</span></li><li><b>監督</b><span>承認・停止・復旧ができるか</span></li><li><b>責任</b><span>最終判断者が明確か</span></li>
          </ol>
          <p>日本では、経済産業省・総務省「AI事業者ガイドライン 第1.2版」を基本線とし、IPAの導入・運用ガイドラインと2026年版セキュリティ実務指針を具体策に使える。<a href={sources[16].url} target="_blank" rel="noreferrer">[17]</a> <a href={sources[17].url} target="_blank" rel="noreferrer">[18]</a> <a href={sources[40].url} target="_blank" rel="noreferrer">[41]</a></p>
        </div>
      </section>
      <section {...slideProps("synthesis")} className="synthesis-section section-pad" id="synthesis">
        <div className="section-head">
          <div><div className="section-no">11 / THREE-LAYER MAP</div><h2>生成AIシステムの<br />3つの設計層。</h2></div>
          <p><b>Modelは能力、Systemは接続と制御、Engineeringは再現性と責任。</b><br />同じモデルでも、他の2層の設計で業務成果は大きく変わる。</p>
        </div>
        <SystemLayersScene />
        <details className="scene-notes"><summary aria-label="関連資料と詳細">＋</summary><div className="scene-notes-content">
<div className="three-layer-framework" aria-label="現在の生成AIを構成する三つの設計層" onClick={(event) => {
          const button = (event.target as HTMLElement).closest<HTMLButtonElement>("button");
          if (!button) return;
          const title = button.querySelector("b")?.textContent || "DESIGN ELEMENT";
          const detail = threeLayerDetails[title];
          if (detail) setInsight(detail);
        }}>
          <article className="design-layer model-layer" tabIndex={0}>
            <header><span>01</span><div><b>MODEL</b><h3>何ができるか</h3></div></header>
            <div className="layer-elements">
              <button type="button"><b>GENERATION</b><small>生成</small></button>
              <button type="button"><b>REASONING</b><small>推論</small></button>
              <button type="button"><b>MULTIMODAL</b><small>画像・音声・動画</small></button>
            </div>
            <p><b>AIそのものの能力を決める。</b><small>Transformer · GPT · Diffusion · Reasoning Models</small></p>
          </article>

          <article className="design-layer system-layer" tabIndex={0}>
            <header><span>02</span><div><b>SYSTEM</b><h3>何につながり、どう動くか</h3></div></header>
            <div className="layer-elements system-elements">
              <button type="button"><b>CONTEXT / RAG</b><small>必要な情報を見る</small></button>
              <button type="button"><b>FUNCTION CALLING / TOOL USE</b><small>外部機能を使う</small></button>
              <button type="button"><b>MCP</b><small>Agent ↔ Tools / Context</small><em>A2A：Agent ↔ Agent</em></button>
              <button type="button"><b>WORKFLOW / AGENT</b><small>処理・行動を進める</small></button>
            </div>
            <p><b>モデルを情報と外部世界へ接続する。</b><small>Contextは情報そのもの。Context Engineeringは、その見せ方の設計。</small></p>
          </article>

          <article className="design-layer engineering-layer" tabIndex={0}>
            <header><span>03</span><div><b>ENGINEERING</b><h3>どう信頼して運用するか</h3></div></header>
            <div className="layer-elements engineering-elements">
              <button type="button"><b>PROMPT / CONTEXT ENG.</b><small>指示・情報設計</small></button>
              <button type="button"><b>HARNESS</b><small>実行環境・Tools・権限</small></button>
              <button type="button"><b>LOOP</b><small>観察・検証・再試行・停止</small></button>
              <button type="button"><b>EVALS</b><small>「できた」を検証</small></button>
              <button type="button"><b>SECURITY / GOVERNANCE</b><small>権限・監査・安全性</small></button>
            </div>
            <p><b>実行を、信頼できる運用へ変える。</b><small>Observability · Human Approval · Cost Control</small></p>
          </article>
        </div>

        <div className="framework-outcome" aria-label="三つの設計層が生む業務価値">
          <div><span>OUTCOME</span><b>BUSINESS VALUE</b><small>業務成果</small></div>
          <ul><li>SPEED<small>速度</small></li><li>QUALITY<small>品質</small></li><li>COST<small>コスト</small></li><li>RELIABILITY<small>信頼性</small></li></ul>
        </div>
        <p className="synthesis-reading-note"><span>DIAGNOSIS</span>誤答はModelだけの問題とは限らない。古いContext、誤ったTool、曖昧な完了条件、過剰権限も切り分けて改善する。</p>
        </div></details>
      </section>

      <section {...slideProps("takeaway")} className="takeaway critical-section section-pad">
        <div className="section-no">14 / REALITY CHECK</div>
        <h2>AIによる製品開発の<br /><span>可能性と課題。</span></h2>
        <p>生成AIは試作品の制作時間を短縮できる一方、細部の整合性、例外処理、安全性、長期保守には課題が残る。<br />そのため、プロトタイプの完成と本番利用の可否は分けて判断する必要がある。</p>
        <TakeawayLab onJump={goToSlideId} />

        <div className="takeaway-balance">
          <article><span>できること</span><h3>最初の形を速く作る</h3><ul><li>UI・コード・文章のたたき台</li><li>複数案の生成と比較</li><li>反復作業と修正の高速化</li></ul></article>
          <article className="takeaway-limit"><span>不足しやすいこと</span><h3>細部と境界を守る</h3><ul><li>曖昧な要件と例外処理</li><li>アクセシビリティと操作の一貫性</li><li>権限・機密情報・依存関係の安全性</li><li>長期運用と変更時の影響判断</li></ul></article>
          <article className="takeaway-action"><span>実務での使い方</span><h3>人が確認できる範囲で使う</h3><ul><li>まず限定データと小さな機能で試す</li><li>テスト・レビュー・脆弱性確認を通す</li><li>書き込み権限を絞り、重要操作は承認制にする</li><li>ログ・停止・復旧方法を用意する</li></ul></article>
        </div>
        <div className="takeaway-advice"><b>導入方針</b><span>生成AIはプロトタイプ作成に活用し、品質・安全性・業務上の価値を人が確認した後に本番環境へ展開する。</span></div>
      </section>

      <section {...slideProps("sources")} className="sources-section section-pad" id="sources">
        <div className="section-head"><div><div className="section-no">13 / SOURCES</div><h2>参考資料。</h2></div><p>研究論文、公式発表、標準仕様、政府機関資料を優先。<br />編集基準日は2026年9月3日。製品仕様と新興用語の定義は変わり得る。</p></div>
        <ol className="source-list">{visibleSources.map(source => <li key={source.n}><a href={source.url} target="_blank" rel="noreferrer"><span>{String(source.n).padStart(2,"0")}</span><p>{source.label}</p><b>↗</b></a></li>)}</ol>
        <div className="method-note"><b>編集方針</b><p>本資料は「すべてのモデルを網羅する歴史」ではなく、生成AIの利用形態を変えた転換点を選んだものです。数値は一次資料で確認できるもののみ記載し、非公開情報は推測していません。製品名は代表例であり、推奨順位ではありません。Open-weightとOpen Source、Reasoningと人間の思考、HarnessとLoopなど、業界内で定義が揺れる語は注記しました。Vibe Codingや2026年の意味づけには、資料に基づく編集上の解釈を含みます。</p></div>
      </section>

      <footer style={{ order: 1000 }}><span>GENERATIVE AI: FROM ANSWERS TO ACTIONS</span><a href="#top">BACK TO TOP ↑</a></footer>
    </main>
  );
}
