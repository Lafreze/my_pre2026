"use client";

import { useState } from "react";
import { Choices, Lab, Result, Transport, useRunner } from "./LabControls";

export function CardPrototype({ stage }: { stage: number }) {
  const [revealed, setRevealed] = useState(false);
  const [question, setQuestion] = useState("");
  return <div className="card-prototype" data-stage={stage}>
    <div><small>DAY CARD / ローカル試作品</small><h4>今日、問いを一枚のカードへ。</h4>{stage > 0 && <label>今日の問い<input value={question} onChange={event => setQuestion(event.target.value)} placeholder="何から始めよう？" maxLength={80} /></label>}{stage > 2 && <span className="prototype-checks">✓ キーボード ✓ 再操作 ✓ モバイル</span>}</div>
    {stage === 0 ? <div className="prototype-rule"><span>QUESTION</span><i>↓</i><span>DRAW</span><i>↓</i><span>REFLECT</span></div> : <button type="button" className="prototype-card" aria-pressed={revealed} onClick={() => setRevealed(value => !value)} aria-label={revealed ? "試作カードを伏せる" : "試作カードをめくる"}><span className="prototype-card-inner" data-revealed={revealed}><span className="prototype-face prototype-back"><i>✦</i><small>DAY CARD</small></span><span className="prototype-face prototype-front"><small>{question || "THE NEXT STEP"}</small><b>急がず、<br />一つだけ選ぶ。</b><span>↺</span></span></span></button>}
  </div>;
}

export function GameProcessLab() {
  const [stage, setStage] = useState(0);
  return <Lab title="同じカード体験を、小さく育てる" note="4段階のローカル試作品 · カードは実際にめくれます"><Choices label="制作段階" items={["ルール", "グレーボックス", "Vertical Slice", "仕上げ"]} value={stage} onChange={setStage} /><CardPrototype key={stage} stage={stage} /><Result title={["完成条件を言葉にする", "一つの操作を成立させる", "最小の体験をつなぐ", "操作と演出を整える"][stage]}>{["何を入力し、何が変わり、いつ終わるかを定義。", "装飾を抑え、入力とカードの状態変化だけを確かめる。", "入力から結果までを、実際に遊べる一続きの体験にする。", "同じ遊びを保ち、余白・動き・フォーカスを整える。"][stage]}</Result></Lab>;
}

const studioRoles = [
  { name: "DESIGN", input: "対象プレイヤー・一文の遊び", output: "GAME BRIEF / 完了条件", contract: "カードを1回めくり、再操作できる。ルールを先に固定。", duration: 15 },
  { name: "ENGINEERING", input: "GAME BRIEF / 共有API", output: "CODE / TEST / BUILD", contract: "drawCard() → { id, title, message }。ロジックの担当を固定。", duration: 40 },
  { name: "ART", input: "GAME BRIEF / STYLE BIBLE", output: "ASSET MANIFEST", contract: "カード比率2:3、色3色、SVG、ファイル名とサイズを固定。", duration: 30 },
  { name: "CONTENT", input: "GAME BRIEF / データ形式", output: "CARD DATA", contract: "idは一意、title 20文字以内、message 80文字以内。", duration: 25 },
  { name: "QA / PLAYTEST", input: "統合済みBuild / 完了条件", output: "BUG / 再現手順 / 証拠", contract: "入力→カード→再操作、キーボード、表示幅を検証。", duration: 15 },
];
export function GameAgentsLab({ active }: { active: boolean }) {
  const [role, setRole] = useState(0);
  const [parallel, setParallel] = useState(1);
  const total = parallel ? 90 : 145;
  const runner = useRunner(active, 29, 300);
  const time = runner.step / 29 * total;
  const starts = parallel ? [0, 15, 15, 15, 75] : [0, 15, 55, 85, 130];
  const integrationStart = parallel ? 55 : 110;
  const selected = studioRoles[role];
  return <Lab title="並列化できる仕事と、待つべき仕事を分ける" note="時間は説明用の仮定 · 同じ作業量、統合20分を含む"><Choices label="進め方" items={["直列", "独立作業を並列"]} value={parallel} onChange={value => { setParallel(value); runner.reset(); }} /><div className="studio-gantt" aria-label="依存関係付き制作タイムライン">{studioRoles.map((item, index) => <button type="button" key={item.name} aria-pressed={role === index} onClick={() => setRole(index)}><b>{item.name}</b><span className="gantt-lane"><i style={{ left: `${starts[index] / total * 100}%`, width: `${item.duration / total * 100}%` }} data-complete={time >= starts[index] + item.duration} data-current={time >= starts[index] && time < starts[index] + item.duration}>{item.duration}m</i></span></button>)}<div className="gantt-integration"><b>INTEGRATE</b><span className="gantt-lane"><i style={{ left: `${integrationStart / total * 100}%`, width: `${20 / total * 100}%` }} data-current={time >= integrationStart && time < integrationStart + 20}>20m</i></span></div><div className="gantt-time"><span>0 min</span><output>{Math.round(time)} / {total} min</output></div></div><p className="lab-footnote">DESIGN → {parallel ? "ENGINEERING・ART・CONTENTを並列" : "各担当を順に実行"} → 全成果物の統合 → QA → 人が採否を判断。</p><div className="role-contract"><b>{selected.name}</b><p><small>INPUT</small>{selected.input}</p><p><small>OUTPUT</small>{selected.output}</p><p><small>CONTRACT</small>{selected.contract}</p></div><Transport runner={runner} /></Lab>;
}

