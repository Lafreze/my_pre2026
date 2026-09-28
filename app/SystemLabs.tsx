"use client";
import { useState } from "react";
import { Choices, Lab, Transport, useRunner } from "./LabControls";

export function HarnessLab({ active }: { active: boolean }) {
  const [failure, setFailure] = useState(0);
  const runner = useRunner(active, 5);
  const modules = ["CONTEXT", "TOOLS", "PERMISSION", "STATE", "VERIFY", "LOOP"];
  const stories = [
    ["旅費規程が入力にない", "不足したContextを検出", "規程の取得を計画", "承認済み文書から取得", "規程の版と予算を確認", "下書きを準備して人の確認へ"],
    ["下書き保存を要求", "ツールがタイムアウト", "保存済みか照会して重複を防ぐ", "未保存を確認し1回再試行", "下書きIDを照合", "結果を保存して停止"],
    ["上長への送信を要求", "送信権限がない", "書き込みを実行せず停止", "下書きと理由を保存", "人へ確認を依頼", "人の判断待ち。自動で迂回しない"],
  ];
  const routes = [[0, 4, 5, 1, 4, 5], [1, 1, 3, 5, 4, 3], [1, 2, 5, 3, 2, 5]];
  return <Lab title="失敗を注入し、Harnessが支える箇所を見る"><Choices label="注入する失敗" items={["文脈が不足", "ツールが失敗", "権限がない"]} value={failure} onChange={value => { setFailure(value); runner.reset(); }} /><div className="module-lights">{modules.map((module, index) => <span key={module} data-active={routes[failure][runner.step] === index}>{module}</span>)}</div><div className="lab-log" role="log" aria-label="Harnessのイベント履歴">{stories[failure].slice(0, runner.step + 1).map((story, index) => <p key={story} data-current={index === runner.step}><time>0{index}</time><b>{modules[routes[failure][index]]}</b><span>{story}</span></p>)}</div><Transport runner={runner} /></Lab>;
}
