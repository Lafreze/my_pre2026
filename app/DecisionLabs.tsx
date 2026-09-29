"use client";
import { useState } from "react";
import { Choices, Lab, Result, Track } from "./LabControls";

export function TrustLab() {
  const [scenario, setScenario] = useState(0);
  const [checks, setChecks] = useState([false, false, false]);
  const [ran, setRan] = useState(false);
  const protectedCase = checks[scenario];
  const outcomes = ["出典と金額の照合で不一致を検出 → 下書きを修正", "送信権限を確認し拒否 → 人に確認して停止", "タイムアウト後に保存状態を照会 → 冪等キーで再試行"];
  return <Lab title="チェックを組み合わせ、失敗への応答を変える" note="固定した3ケースの説明用デモ · 実システムの安全性保証ではありません"><Choices label="失敗シナリオ" items={["誤った金額", "許可のない送信", "ツール応答がない"]} value={scenario} onChange={value => { setScenario(value); setRan(false); }} /><div className="lab-option-grid">{["根拠・合計の照合", "最小権限・承認点", "状態確認・再試行上限"].map((check, index) => <label className="lab-check" key={check}><input type="checkbox" checked={checks[index]} onChange={event => { setChecks(values => values.map((value, i) => i === index ? event.target.checked : value)); setRan(false); }} />{check}</label>)}</div><button type="button" className="lab-primary" onClick={() => setRan(true)}>この構成で検証</button><Track labels={["失敗を注入", "対応するチェック", "検出・停止・回復"]} step={ran ? protectedCase ? 2 : 1 : 0} /><Result title={ran ? protectedCase ? "このケースでは対応できた" : "このケースへのチェックが不足" : "チェックを選んで試す"} tone={ran ? protectedCase ? "good" : "warn" : "normal"}>{ran ? protectedCase ? outcomes[scenario] : ["誤った金額が下書きに残る。根拠と合計の照合を追加して再検証。", "許可外の実行要求を通す構成。権限と承認点を追加して再検証。", "処理が止まり、保存済みか不明。状態確認と再試行制御を追加して再検証。"][scenario] : "必要な対策は、失敗の種類で異なる。"}</Result></Lab>;
}

export function AdoptionLab() {
  const [answers, setAnswers] = useState<number[]>([]);
  const [step, setStep] = useState(0);
  const questions = ["業務の手順は決まっている？", "試行用データは準備できる？", "外部へ書き込む？", "完了を評価する基準はある？"];
  const options = [["固定手順で解ける", "状況に応じた判断が必要"], ["限定・承認済みデータがある", "データ境界が未整理"], ["読み取り・下書きまで", "送信や更新を伴う"], ["合否と失敗例を定義済み", "まだ定義していない"]];
  const complete = answers.length === 4 && step === 4;
  return <Lab title="四つの条件から、小さな導入範囲を決める" note="導入方針を整理するガイド · 組織の判断を置き換えません"><Track labels={["業務", "データ", "外部作用", "評価"]} step={Math.min(step, 3)} />{!complete && <div className="adoption-question"><b>{questions[step]}</b><Choices label={questions[step]} items={options[step]} value={answers[step] ?? -1} onChange={value => { setAnswers(current => [...current.slice(0, step), value]); setStep(step + 1); }} /></div>}{complete && <Result title={answers[1] === 1 || answers[3] === 1 ? "試行前の条件を整える" : "限定した範囲で試行する"} tone={answers[1] === 1 || answers[3] === 1 ? "warn" : "good"}><p>構成候補：{answers[0] === 0 ? "固定Workflow。分岐と監査を明確にする。" : "Agent。任せる判断範囲と停止条件を限定する。"}</p><p>試行範囲：{answers[1] === 0 ? "承認済みデータの一業務。" : "まず合成データで境界を整理。実データへの接続は保留。"}{answers[2] === 0 ? "読み取りと下書きまで。" : "送信直前に人の承認を置く。"}</p><p>検証項目：{answers[3] === 0 ? "正確性・再現性・失敗時の停止を、既存の基準で評価。" : "先に合否基準と失敗例を作り、評価できる状態にする。"}</p></Result>}<div className="lab-transport"><button type="button" disabled={step === 0} onClick={() => setStep(value => value - 1)}>← 一つ戻る</button><button type="button" onClick={() => { setAnswers([]); setStep(0); }}>↺ 最初から</button></div></Lab>;
}

export function TakeawayLab({ onJump }: { onJump: (id: string) => void }) {
  const [choice, setChoice] = useState(0);
  const cards = [
    { title: "AIの能力を、仕事の形に組み立てる", body: "生成・推論に、文脈、ツール、制御、評価を組み合わせる。", action: "一つの仕事を、計画→実行→観察→検証に分解する。", target: "agent", label: "Agentの例へ" },
    { title: "任せても、採否と責任は人が持つ", body: "価値、優先順位、高影響な操作、最終判断を明確にする。", action: "次のタスクに、完了条件と人が確認する地点を書く。", target: "harness", label: "Harnessの例へ" },
    { title: "小さく作り、実際に触って確かめる", body: "一つの操作と一つの結果から、検証できる成果物を作る。", action: "短い試作→確認→修正の一周を、限定範囲で試す。", target: "vibe", label: "試作の考え方へ" },
  ];
  const card = cards[choice];
  return <Lab title="今日持ち帰る、一つの行動を選ぶ" note="選んだ観点から、関連する実例へ戻れます"><Choices label="持ち帰る観点" items={["AIにできること", "人が担うこと", "小さく始める"]} value={choice} onChange={setChoice} /><div className="takeaway-action" aria-live="polite"><span>MY NEXT STEP / 0{choice + 1}</span><h4>{card.title}</h4><p>{card.body}</p><strong>{card.action}</strong><button type="button" onClick={() => onJump(card.target)}>{card.label} ↗</button></div></Lab>;
}
