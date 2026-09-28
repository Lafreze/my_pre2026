"use client";

import { useMemo, useState } from "react";

const buildSteps = [
  {
    number: "01",
    label: "CONCEPT",
    title: "ゲームのコア体験を一文で定義する",
    copy: "『問いを入力し、カードを引いて結果を見る』という遊びを起点に、プレイヤーが何を操作し、どんな反応を得るかを一文にする。",
    output: "GAME CONCEPT",
  },
  {
    number: "02",
    label: "DESIGN",
    title: "ルール・画面・操作を設計する",
    copy: "開始、問いの入力、カードの表示までのルールと画面遷移を決める。ボタンの反応、文字の読みやすさ、色や余白もそろえ、迷わず遊べる操作にする。",
    output: "RULES & CONTROLS",
  },
  {
    number: "03",
    label: "BUILD",
    title: "最小限のゲームループを実装する",
    copy: "入力 → カードを引く → 結果を見る、という最小限の流れを実装する。画面表示だけでなく、操作に応じた状態変化までつなげ、ブラウザで遊べる形にする。",
    output: "PLAYABLE LOOP",
  },
  {
    number: "04",
    label: "ITERATE",
    title: "実際に遊びながら修正する",
    copy: "自分で一通り遊び、説明の分かりやすさ、操作の間、カードの見せ方を確認する。連続クリックやスマートフォン表示も試し、気づいた問題をAgentに伝えて修正する。",
    output: "PLAYTEST FEEDBACK",
  },
  {
    number: "05",
    label: "SHIP",
    title: "URLで遊べるWebゲームとして公開する",
    copy: "ブラウザからアクセスして遊べるURLとして公開する。公開後もプレイの感想や不具合を集め、操作性、安全性、遊びやすさを継続して確認する。",
    output: "PLAYABLE URL",
  },
] as const;

type PreviewMode = "live" | "concept";

export function DaycardShowcase({ active: slideActive = true }: { active?: boolean }) {
  const [mode, setMode] = useState<PreviewMode>("live");
  const [activeStep, setActiveStep] = useState(2);
  const [revealed, setRevealed] = useState(false);
  const active = useMemo(() => buildSteps[activeStep], [activeStep]);

  return (
    <>
      <div className="section-head daycard-case-head">
        <div>
          <div className="section-no">12 / WEB GAME CASE</div>
          <h2>数時間で制作した<br /><span>遊べるWebゲームの例。</span></h2>
        </div>
        <p><b>AIが短縮するのは、アイデアから「実際に遊べる形」までの距離。</b><br />ここでは、一つのゲームアイデアを、企画 → 実装 → 検証 → 公開まで進め、実際にブラウザで遊べるWebゲームにする例を示す。</p>
      </div>

      <div className="daycard-stage" data-scene-controls>
        <article className="daycard-browser" aria-label="数時間で制作した、ブラウザで遊べるWebゲームのライブプレビュー">
          <header className="browser-chrome">
            <div className="browser-lights" aria-hidden="true"><i /><i /><i /></div>
            <div className="browser-address"><span>⌁</span><b>daycard.site</b><em>LIVE</em></div>
            <a href="https://www.daycard.site/" target="_blank" rel="noreferrer" aria-label="Day Cardを新しいタブで開く">↗</a>
          </header>

          <div className={`daycard-viewport mode-${mode}`}>
            <div className="daycard-mode-switch" role="group" aria-label="プレビュー表示">
              <button type="button" className={mode === "live" ? "active" : ""} onClick={() => setMode("live")}>LIVE SITE</button>
              <button type="button" className={mode === "concept" ? "active" : ""} onClick={() => setMode("concept")}>CONCEPT</button>
            </div>

            <div className="daycard-live-shell" aria-hidden={mode !== "live"} inert={mode !== "live"}>
              <div className="daycard-loading"><i /><span>DAY CARD</span><small>connecting to live experience…</small></div>
              {slideActive && mode === "live" && <iframe
                src="https://www.daycard.site/"
                title="Day Card ライブサイト"
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                sandbox="allow-forms allow-popups allow-same-origin allow-scripts"
              />}
            </div>

            <div className="daycard-concept" data-build-stage={activeStep} aria-hidden={mode !== "concept"} inert={mode !== "concept"}>
              <div className="ritual-copy">
                <span>{active.label}</span>
                <h3>今日、問いを<br />一枚のカードへ。</h3>
              </div>
              <button
                type="button"
                className={`ritual-card ${revealed ? "is-revealed" : ""}`}
                onClick={() => setRevealed((value) => !value)}
                aria-pressed={revealed}
                aria-label={revealed ? "カードを伏せる" : "カードをめくる"}
              >
                <span className="ritual-card-inner">
                  <span className="ritual-card-face ritual-card-back"><i>☾</i><small>DAILY CARD</small></span>
                  <span className="ritual-card-face ritual-card-front"><small>THE NEXT STEP</small><b>急がず、<br />一つだけ選ぶ。</b><i>✦</i></span>
                </span>
              </button>
              <div className="ritual-orbit" aria-hidden="true"><i /><i /><i /></div>
            </div>
          </div>
        </article>

        <div className="daycard-build" aria-label="一つのアイデアを数時間で遊べるWebゲームにする制作プロセス">
          <div className="daycard-build-intro">
            <span>IDEA → WEB GAME / FEW HOURS</span>
            <p>一つのアイデアを、<br />数時間で遊べるWebゲームへ。</p>
          </div>
          <div className="daycard-step-list">
            {buildSteps.map((step, index) => (
              <button
                type="button"
                key={step.label}
                className={activeStep === index ? "active" : ""}
                onClick={() => { setActiveStep(index); setMode("concept"); setRevealed(false); }}
                aria-pressed={activeStep === index}
              >
                <span>{step.number}</span>
                <div><small>{step.label}</small><b>{step.title}</b></div>
                <i>↗</i>
              </button>
            ))}
          </div>
          <div className="daycard-step-detail" aria-live="polite">
            <div><span>{active.number}</span><small>{active.label}</small></div>
            <p>{active.copy}</p>
            <b>OUTPUT / {active.output}</b>
          </div>
        </div>
      </div>

      <div className="daycard-learning">
        <span>WEB GAME DEVELOPMENT</span>
        <b>アイデアから、実際に遊べるWebゲームまで。</b>
        <p>Idea → Design → Build → Playtest → Ship</p>
        <a href="https://www.daycard.site/" target="_blank" rel="noreferrer">PLAY WEB GAME <i>↗</i></a>
      </div>
    </>
  );
}
