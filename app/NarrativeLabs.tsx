"use client";
import { useState } from "react";
import { Choices, Lab, Result, Track, Transport, useRunner } from "./LabControls";

export function CapabilityLab() {
  const [level, setLevel] = useState(0);
  const capabilities = ["文章生成", "＋対話", "＋検索", "＋ツール", "＋タスク実行"];
  const outputs = [
    ["申請文の下書き", "「大阪への出張を申請します。」日付や費用はまだ未確定。"],
    ["不足する条件を確認", "AI：日程と予算は？　利用者：10月5日、上限3万円です。"],
    ["規程を参照して候補を作る", "模擬規程 §3：上限3万円。候補費用2.4万円、条件に適合。"],
    ["構造化した実行要求を作る", 'create_draft({ destination: "大阪", date: "10/05", cost: 24000 }) → DRAFT-042'],
    ["完了条件を確かめて止まる", "下書きID・金額・必須項目を検証。上長へ送信する前に、人の確認で停止。"],
  ];
  return <Lab title="同じ出張申請に、能力を足す"><p className="lab-prompt">依頼：大阪への出張申請を準備して。</p><Choices label="追加する能力" items={capabilities} value={level} onChange={setLevel} /><Track labels={["生成", "対話", "根拠", "操作", "検証"]} step={level} /><Result title={outputs[level][0]}>{outputs[level][1]}</Result></Lab>;
}

export function ReasoningLab({ active }: { active: boolean }) {
  const [condition, setCondition] = useState(0);
  const runner = useRunner(active, 5);
  const budget = condition === 0 ? 30000 : 20000;
  const messages = ["条件を固定：大阪へ出張。金額の合計と上限を検証する。", "候補A：交通費18,000円＋宿泊費14,000円＝32,000円。", `外部チェック：32,000円 > ${budget.toLocaleString()}円。FAIL。`, "候補Aを棄却。交通・宿泊の組合せを変更する。", condition === 0 ? "候補B：14,000円＋10,000円＝24,000円。" : "候補B：10,000円＋8,000円＝18,000円。", `合計一致・上限${budget.toLocaleString()}円以内を確認。PASS。`];
  return <Lab title="答えの候補を、観測できる証拠で検証する" note="固定した候補と検算の模擬デモ · 内部思考の表示ではありません"><Choices label="検証条件" items={["上限3万円", "上限2万円"]} value={condition} onChange={value => { setCondition(value); runner.reset(); }} /><Track labels={["条件", "候補A", "検証 / FAIL", "修正", "候補B", "検証 / PASS"]} step={runner.step} /><Result title={runner.step === 2 ? "CHECK FAILED" : runner.step === 5 ? "CHECK PASSED" : "OBSERVABLE EVIDENCE"} tone={runner.step === 2 ? "warn" : runner.step === 5 ? "good" : "normal"}>{messages[runner.step]}</Result><Transport runner={runner} /></Lab>;
}

export function VibeLab() {
  const [explicit, setExplicit] = useState(0);
  const [keyboard, setKeyboard] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  return <Lab title="指示と受入条件で、試作品はどう変わるか"><Choices label="指示の具体性" items={["雰囲気だけを伝える", "受入条件を明記"]} value={explicit} onChange={value => { setExplicit(value); setSubmitted(false); }} /><div className="lab-compare"><article><b>PROMPT</b><p>{explicit ? "出張の下書きを作る。宛先を表示し、処理状態・重複送信防止・キーボード操作を確かめる。" : "出張申請を、いい感じの青い画面にして。"}</p><label className="lab-check"><input type="checkbox" checked={keyboard} onChange={event => setKeyboard(event.target.checked)} />キーボード条件を表示</label><label className="lab-check"><input type="checkbox" checked={loading} onChange={event => setLoading(event.target.checked)} />処理中の状態を試す</label></article><article className="vibe-preview"><small>DEMO</small><b>{explicit ? "大阪 / 出張申請の下書き" : "Make it beautiful ✦"}</b><button type="button" disabled={Boolean(explicit && (loading || submitted))} onClick={() => setSubmitted(true)}>{explicit && loading ? "下書きを準備中…" : submitted ? "下書きを作成しました" : explicit ? "下書きを作成" : "Let’s go →"}</button><p>{keyboard ? explicit ? "Tab → Enter → 完了通知" : "フォーカス・完了通知：未定義" : ""}</p><output aria-live="polite">{submitted ? "DRAFT-042 / ローカル表示のみ" : explicit && loading ? "連続操作を無効化" : "まだ外部へ送信していません"}</output></article></div></Lab>;
}
