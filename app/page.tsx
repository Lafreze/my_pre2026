"use client";

import { useState } from "react";

type Phase = "すべて" | "基盤" | "対話" | "行動" | "接続" | "開発";

const phases: Phase[] = ["すべて", "基盤", "対話", "行動", "接続", "開発"];

const timeline = [
  { year: "2017", phase: "基盤", title: "Transformer", tag: "ARCHITECTURE", text: "再帰処理を使わず、注意機構を中心に系列を扱う設計を提案。並列学習しやすい構造が、その後の大規模言語モデルの基盤になった。", point: "モデルの器ができた", source: 1 },
  { year: "2018", phase: "基盤", title: "GPT", tag: "PRE-TRAIN", text: "大量の未ラベル文章で生成的に事前学習し、少量の教師データで個別タスクへ適応する二段階方式を実証。※「GPT-1」は後から定着した呼称。", point: "知識を先に学ぶ", source: 2 },
  { year: "2019", phase: "基盤", title: "GPT-2", tag: "SCALE", text: "15億パラメータ、800万Webページへ拡大。特化学習なしでも翻訳・要約・質問応答の兆しを示し、悪用懸念から段階公開が議論になった。", point: "規模が汎用性を生む", source: 3 },
  { year: "2020", phase: "基盤", title: "GPT-3", tag: "IN-CONTEXT", text: "1750億パラメータへ拡大。追加学習をせず、プロンプト内の指示や例だけで新しいタスクに対応する few-shot 学習を示した。", point: "プロンプトがUIになる", source: 4 },
  { year: "2022", phase: "対話", title: "InstructGPT → ChatGPT", tag: "ALIGNMENT", text: "人間のフィードバックによる強化学習（RLHF）で指示追従を改善。11月30日のChatGPT公開で、技術が会話UIを通じて一般利用へ広がった。", point: "使える会話相手になる", source: 5 },
  { year: "2022–23", phase: "行動", title: "ReAct / Toolformer", tag: "TOOL USE", text: "「推論」と「行動」を交互に進める研究や、APIをいつ・どう呼ぶかを学習する研究が登場。LLMが外部世界と接続する設計が具体化した。", point: "考える＋調べる＋動く", source: 7 },
  { year: "2023", phase: "対話", title: "GPT-4 / マルチモーダル", tag: "MULTIMODAL", text: "テキストに加えて画像入力を扱う大規模マルチモーダルモデルへ。なお、GPT-4のパラメータ数など詳細は非公開であり、単純な規模比較はできない。", point: "世界を複数の形式で理解", source: 6 },
  { year: "2023", phase: "行動", title: "Function Calling", tag: "STRUCTURED ACTION", text: "モデルが関数の引数を構造化して返し、外部APIや業務システムを呼び出す実装が安定化。チャットボットから実行系への橋が架かった。", point: "自然言語をAPIへ変換", source: 9 },
  { year: "2024", phase: "行動", title: "Computer Use / Agent", tag: "ACTION LOOP", text: "画面を見てクリックや入力を行うコンピュータ操作が登場。モデルが計画→実行→観察→修正を繰り返すAgent像が、研究から製品へ移った。", point: "回答ではなく完了を目指す", source: 10 },
  { year: "2024", phase: "接続", title: "MCP", tag: "OPEN STANDARD", text: "Anthropicが11月25日に公開。AIアプリとデータ・ツールを、Host / Client / Server構造でつなぐオープンプロトコル。連携を個別開発から標準化へ進めた。", point: "AIのための共通コネクタ", source: 11 },
  { year: "2025", phase: "開発", title: "Vibe Coding", tag: "NATURAL LANGUAGE DEV", text: "Andrej Karpathyが2月に命名。コードを逐一読むより、自然言語で意図を伝え、動作を見ながら反復する開発スタイル。試作を民主化する一方、品質責任は消えない。", point: "コードより意図を操作", source: 14 },
  { year: "2025–26", phase: "接続", title: "Agent Platform / A2A", tag: "ECOSYSTEM", text: "Responses APIやAgents SDKがエージェント構築を製品化。GoogleのA2AはAgent同士の連携を標準化し、MCP（Agentとツール）を補完する位置づけを示した。", point: "単体AIから協調系へ", source: 12 },
  { year: "2026", phase: "行動", title: "Model × Tool × Reasoning", tag: "CURRENT", text: "現行の最前線モデルは推論とツール利用を一体化。OpenAI公式ではGPT-5.6系が関数・Web検索・ファイル検索・コンピュータ操作を標準対応する。", point: "モデル単体よりシステム設計", source: 13 },
] as const;

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
  { n: 11, label: "Anthropic / MCP, Introduction & Specification (2024–)", url: "https://modelcontextprotocol.io/specification/2025-06-18/architecture" },
  { n: 12, label: "OpenAI, New tools for building agents / Google, A2A (2025)", url: "https://openai.com/index/new-tools-for-building-agents/" },
  { n: 13, label: "OpenAI API, Model catalog (accessed 2026-08-19)", url: "https://developers.openai.com/api/docs/models" },
  { n: 14, label: "Andrej Karpathy, Software Is Changing (Again) (2025)", url: "https://www.youtube.com/watch?v=LCEmiRjPEtQ" },
  { n: 15, label: "Anthropic, Building effective agents (2024)", url: "https://www.anthropic.com/engineering/building-effective-agents" },
  { n: 16, label: "NIST AI 600-1, Generative AI Profile (2024)", url: "https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence" },
  { n: 17, label: "経済産業省・総務省, AI事業者ガイドライン 第1.2版 (2026)", url: "https://www.meti.go.jp/shingikai/mono_info_service/ai_shakai_jisso/20260331_report.html" },
  { n: 18, label: "IPA, テキスト生成AIの導入・運用ガイドライン (2024)", url: "https://www.ipa.go.jp/jinzai/ics/core_human_resource/final_project/2024/generative-ai-guideline.html" },
];

export default function Home() {
  const [phase, setPhase] = useState<Phase>("すべて");
  const filtered = phase === "すべて" ? timeline : timeline.filter((item) => item.phase === phase);

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top">GEN AI / 2017—2026</a>
        <nav aria-label="ページ内ナビゲーション">
          <a href="#timeline">年表</a><a href="#agent">Agent</a><a href="#mcp">MCP</a><a href="#action">社内活用</a>
        </nav>
      </header>

      <section className="hero" id="top">
        <div className="eyebrow"><span>社内発表資料</span><span>UPDATED 2026.08.19</span></div>
        <p className="kicker">THE EVOLUTION OF GENERATIVE AI</p>
        <h1>生成AIは、<br /><em>「答える」から「動く」へ。</em></h1>
        <p className="lead">GPTの誕生からAgent、MCP、Vibe Codingまで。<br />9年間の変化を「能力の積み上がり」として読み解く。</p>
        <div className="hero-foot">
          <div className="thesis"><b>本日の結論</b><span>競争力の焦点は、モデル単体の性能から<br />「業務・ツール・人をどうつなぐか」へ移った。</span></div>
          <a href="#timeline" className="scroll-cue">SCROLL TO EXPLORE <span>↓</span></a>
        </div>
      </section>

      <section className="manifesto section-pad">
        <div className="section-no">00 / ONE SENTENCE</div>
        <p className="giant-copy">生成AIの歴史は、<span>文章をつくるモデル</span>が、<span>人の意図を理解し</span>、<span>道具を使い</span>、ついには<span>仕事を完了するシステム</span>へ変わった歴史である。</p>
        <div className="evolution-strip" aria-label="生成AIの能力進化">
          {["PREDICT\n予測", "FOLLOW\n指示", "CONVERSE\n対話", "PERCEIVE\n認識", "ACT\n行動", "CONNECT\n接続", "CREATE\n開発"].map((x, i) => <div key={x}><small>0{i + 1}</small>{x.split("\n").map(t => <span key={t}>{t}</span>)}</div>)}
        </div>
      </section>

      <section className="timeline-section section-pad" id="timeline">
        <div className="section-head">
          <div><div className="section-no">01 / TIMELINE</div><h2>9年を、<br />13の転換点で。</h2></div>
          <p>モデル名の羅列ではなく、<br />「何が新しく可能になったか」で整理する。</p>
        </div>
        <div className="filters" role="group" aria-label="年表の絞り込み">
          {phases.map((item) => <button key={item} className={phase === item ? "active" : ""} onClick={() => setPhase(item)}>{item}</button>)}
        </div>
        <div className="timeline-grid" aria-live="polite">
          {filtered.map((item, i) => (
            <article className="timeline-card" key={item.title + item.year}>
              <div className="card-index">{String(i + 1).padStart(2, "0")}</div>
              <div className="card-year">{item.year}</div>
              <div className="card-tag">{item.tag}</div>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
              <div className="card-point"><span>変化</span>{item.point}</div>
              <a className="source-mark" href={sources.find(s => s.n === item.source)?.url} target="_blank" rel="noreferrer">SOURCE {String(item.source).padStart(2, "0")} ↗</a>
            </article>
          ))}
        </div>
      </section>

      <section className="agent-section dark section-pad" id="agent">
        <div className="section-head light-head">
          <div><div className="section-no">02 / AGENT</div><h2>ChatbotとAgentは、<br />何が違うのか。</h2></div>
          <p>Agentは「賢いチャット」ではない。<br />目標に向けて、次の行動を自ら選ぶシステム。</p>
        </div>
        <div className="compare">
          <article>
            <div className="compare-label">CHATBOT</div>
            <div className="loop simple"><span>質問</span><b>→</b><span>回答</span></div>
            <h3>1回の応答が中心</h3>
            <ul><li>入力に対して文章を生成</li><li>外部状態を原則変えない</li><li>成功条件は「良い回答」</li></ul>
          </article>
          <article className="agent-card">
            <div className="compare-label">AGENT</div>
            <div className="agent-loop">
              <span>計画</span><b>→</b><span>実行</span><b>→</b><span>観察</span><b>→</b><span>修正</span>
              <i>↻</i>
            </div>
            <h3>完了までループ</h3>
            <ul><li>モデルがプロセスとツールを選択</li><li>検索・ファイル・API・画面を操作</li><li>成功条件は「タスクの完了」</li></ul>
          </article>
        </div>
        <p className="definition">Anthropicの整理では、<b>Workflow</b>は事前定義された経路、<b>Agent</b>はLLMが動的にプロセスとツール利用を指揮するシステム。複雑さ・コスト・遅延とのトレードオフがあるため、常にAgentが正解ではない。<a href={sources[14].url} target="_blank" rel="noreferrer">[15] ↗</a></p>
      </section>

      <section className="mcp-section section-pad" id="mcp">
        <div className="section-head">
          <div><div className="section-no">03 / MCP</div><h2>MCPは、<br />AIのUSB-C。</h2></div>
          <p>Model Context Protocol。<br />モデルそのものではなく「つなぎ方」の標準。</p>
        </div>
        <div className="mcp-diagram" aria-label="MCPのHost Client Server構造図">
          <div className="host">
            <small>HOST</small><strong>AIアプリ</strong><span>Claude / ChatGPT / IDE など</span>
            <div className="clients"><i>CLIENT</i><i>CLIENT</i><i>CLIENT</i></div>
          </div>
          <div className="protocol"><b>MCP</b><span>JSON-RPC</span><span>権限・能力を交渉</span></div>
          <div className="servers">
            <div><small>SERVER</small><strong>DATA</strong><span>ファイル・DB</span></div>
            <div><small>SERVER</small><strong>TOOLS</strong><span>検索・API</span></div>
            <div><small>SERVER</small><strong>WORKFLOW</strong><span>定型手順</span></div>
          </div>
        </div>
        <div className="mcp-notes">
          <article><span>01</span><h3>標準化</h3><p>N×Mの個別連携を共通プロトコルへ。サーバーはResources / Prompts / Toolsを公開する。</p></article>
          <article><span>02</span><h3>分離</h3><p>Hostが同意・権限・会話を管理し、各Serverは必要最小限の文脈だけを受け取る。</p></article>
          <article><span>03</span><h3>注意</h3><p>MCPは安全性を自動保証しない。ツール実行、データ共有、認証は実装側の責任。</p></article>
        </div>
        <div className="protocol-pair"><div><b>MCP</b><span>Agent ↔ Tools / Data</span></div><i>＋</i><div><b>A2A</b><span>Agent ↔ Agent</span></div><p>補完関係</p></div>
      </section>

      <section className="vibe-section acid section-pad">
        <div className="section-no">04 / VIBE CODING</div>
        <div className="vibe-grid">
          <h2>コードを書く。<br />から、<br /><span>意図を伝える。</span>へ。</h2>
          <div>
            <p className="vibe-lead">自然言語で要望を伝え、AIが実装し、人は結果を見て方向修正する。Vibe Codingは、ソフトウェア開発の入口を大きく広げた。</p>
            <div className="vibe-flow"><span>IDEA</span><b>→</b><span>PROMPT</span><b>→</b><span>BUILD</span><b>→</b><span>SEE</span><b>↺</b></div>
            <div className="not-equal"><strong>VIBE CODING</strong><b>≠</b><strong>PRODUCTION ENGINEERING</strong></div>
            <p>試作では速度が価値になる。本番では、設計レビュー・テスト・セキュリティ・保守・責任分界が再び中心になる。「コードを読まない」は、品質保証が不要という意味ではない。</p>
          </div>
        </div>
      </section>

      <section className="action-section section-pad" id="action">
        <div className="section-head">
          <div><div className="section-no">05 / FOR OUR COMPANY</div><h2>社内導入は、<br />3段階で考える。</h2></div>
          <p>いきなり全自動化しない。<br />価値とリスクを同じ速度で検証する。</p>
        </div>
        <div className="levels">
          <article><div className="level-no">LEVEL 1</div><h3>ASSIST<br /><span>個人を支援</span></h3><p>要約、翻訳、アイデア、メール、コード補完。人が確認して使う。</p><div className="risk low">低リスク / 早く始める</div></article>
          <article><div className="level-no">LEVEL 2</div><h3>CONNECT<br /><span>社内情報へ接続</span></h3><p>RAGやMCPで文書・DB・業務ツールへ接続。権限とログを設計する。</p><div className="risk mid">中リスク / 小さく検証</div></article>
          <article><div className="level-no">LEVEL 3</div><h3>ACT<br /><span>業務を実行</span></h3><p>Agentが更新・送信・申請・操作を実施。承認点、停止条件、監査を組み込む。</p><div className="risk high">高リスク / 人間を制御点に</div></article>
        </div>
        <div className="guardrails">
          <h3>導入前の6チェック</h3>
          <ol>
            <li><b>目的</b><span>何のKPIを改善するか</span></li><li><b>データ</b><span>入力してよい情報か</span></li><li><b>権限</b><span>読み取りと書き込みを分けたか</span></li><li><b>検証</b><span>正解率・失敗例を測ったか</span></li><li><b>監督</b><span>承認・停止・復旧ができるか</span></li><li><b>責任</b><span>最終判断者が明確か</span></li>
          </ol>
          <p>日本では、経済産業省・総務省「AI事業者ガイドライン 第1.2版」およびIPAの導入・運用ガイドラインを社内ルールの基準として参照できる。<a href={sources[16].url} target="_blank" rel="noreferrer">[17]</a> <a href={sources[17].url} target="_blank" rel="noreferrer">[18]</a></p>
        </div>
      </section>

      <section className="takeaway dark section-pad">
        <div className="section-no">06 / TAKEAWAY</div>
        <h2>未来を分けるのは、<br /><span>AIを持っているか</span>ではない。</h2>
        <p>仕事を分解し、必要な文脈を与え、適切なツールへつなぎ、<br />人間の責任のもとで改善できるか。</p>
        <div className="formula"><span>MODEL</span><b>×</b><span>CONTEXT</span><b>×</b><span>TOOLS</span><b>×</b><span>GOVERNANCE</span><strong>= BUSINESS VALUE</strong></div>
      </section>

      <section className="sources-section section-pad" id="sources">
        <div className="section-head"><div><div className="section-no">07 / SOURCES</div><h2>一次資料・<br />公的資料。</h2></div><p>研究論文、公式発表、標準仕様、政府機関資料を優先。<br />製品仕様は2026年8月19日時点。</p></div>
        <div className="source-list">
          {sources.map(source => <a key={source.n} href={source.url} target="_blank" rel="noreferrer"><span>{String(source.n).padStart(2,"0")}</span><p>{source.label}</p><b>↗</b></a>)}
        </div>
        <div className="method-note"><b>編集方針</b><p>本資料は「すべてのモデルを網羅する歴史」ではなく、生成AIの利用形態を変えた転換点を選んだものです。数値は一次資料で確認できるもののみ記載し、非公開情報は推測していません。Vibe Codingの評価や2026年の意味づけには、資料に基づく編集上の解釈を含みます。</p></div>
      </section>

      <footer><span>GENERATIVE AI: FROM ANSWERS TO ACTIONS</span><a href="#top">BACK TO TOP ↑</a></footer>
    </main>
  );
}
