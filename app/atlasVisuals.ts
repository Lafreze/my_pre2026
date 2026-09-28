import type { AtlasMode } from "./agentAtlasData";

export type StationKind = "chip" | "library" | "robot" | "terminal" | "hub" | "server" | "loop" | "harness" | "check" | "brief";
export const atlasVisuals: Record<string, { kind: StationKind; role: string }> = {
  model: { kind: "chip", role: "言語・判断" },
  goal: { kind: "brief", role: "目的・指示" },
  context: { kind: "library", role: "資料を検索" },
  memory: { kind: "server", role: "状態を保存" },
  tools: { kind: "robot", role: "操作を実行" },
  protocol: { kind: "hub", role: "外部と接続" },
  loop: { kind: "loop", role: "判断と行動" },
  harness: { kind: "harness", role: "実行環境" },
  evaluation: { kind: "check", role: "結果を検証" },
  oversight: { kind: "terminal", role: "人が確認" },
  transformer: { kind: "chip", role: "言語モデルの基盤" },
  retrieval: { kind: "library", role: "検索と生成" },
  "react-loop": { kind: "loop", role: "判断と行動の循環" },
  "function-calling": { kind: "robot", role: "ツールの呼び出し" },
  "computer-use": { kind: "terminal", role: "画面の操作" },
  "mcp-release": { kind: "hub", role: "接続の共通化" },
  "coding-agent": { kind: "terminal", role: "タスク単位の開発" },
  "long-running": { kind: "server", role: "作業状態の引き継ぎ" },
  "harness-practice": { kind: "harness", role: "働く環境の設計" },
};

// Diagram positions are presentation choices, independent of historical/source data.
export function stationPosition(id: string, index: number, mode: AtlasMode, narrow: boolean): [number, number, number] {
  if (narrow) return [index % 2 ? 2.1 : -2.1, 0, Math.floor(index / 2) * 5.2 - 10.4];
  if (mode === "evolution") {
    const row = Math.floor(index / 3), col = row % 2 ? 2 - index % 3 : index % 3;
    return [(col - 1) * 5.8, 0, (row - 1) * 5.1];
  }
  const positions: Record<string, [number, number, number]> = {
    goal: [-6, 0, -4.8], memory: [-1.4, 0, -5.2], oversight: [4.2, 0, -4.8],
    context: [-6.8, 0, .1], model: [-1.5, 0, 0], loop: [3.1, 0, .1], evaluation: [7.3, 0, .1],
    harness: [-5.3, 0, 5], tools: [0, 0, 5], protocol: [5.5, 0, 5],
  };
  return positions[id];
}
