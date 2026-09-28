"use client";
import type { ReactNode } from "react";
import type { Runner } from "./LabControls";

export function Scene({ name, className = "", children }: { name: string; className?: string; children: ReactNode }) {
  return <div className={`direct-scene ${className}`} data-scene-controls aria-label={name}>{children}</div>;
}
export function Playback({ runner, scrub = true }: { runner: Runner; scrub?: boolean }) {
  return <div className="scene-playback"><button type="button" onClick={runner.play} aria-label={runner.playing ? "一時停止" : "再生"} aria-pressed={runner.playing}>{runner.playing ? "Ⅱ" : "▶"}</button><button type="button" onClick={runner.next} disabled={runner.step === runner.last} aria-label="次のステップ">↠</button><button type="button" onClick={runner.reset} aria-label="リセット">↺</button>{scrub && <input type="range" min="0" max={runner.last} value={runner.step} onChange={event => runner.seek(Number(event.target.value))} aria-label="再生位置" />}<output>{String(runner.step).padStart(2,"0")}<span> / {runner.last}</span></output></div>;
}
export function Signal({ points, progress, color = "#51d9cb" }: { points: [number, number][]; progress: number; color?: string }) {
  const value = Math.max(0, Math.min(.9999, progress)) * (points.length - 1);
  const index = Math.floor(value), part = value - index;
  const x = points[index][0] + (points[index + 1][0] - points[index][0]) * part;
  const y = points[index][1] + (points[index + 1][1] - points[index][1]) * part;
  return <g className="scene-signal" transform={`translate(${x} ${y})`} stroke={color} fill="none" strokeLinecap="round"><path d="M0 0h.01" vectorEffect="non-scaling-stroke" strokeWidth="28" opacity=".1"/><path d="M0 0h.01" vectorEffect="non-scaling-stroke" strokeWidth="16" opacity=".3"/><path d="M0 0h.01" vectorEffect="non-scaling-stroke" strokeWidth="8"/></g>;
}
