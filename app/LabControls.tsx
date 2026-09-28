"use client";

import { useEffect, useState, type ReactNode } from "react";

export function Lab({ title, children, className = "" }: { title: string; note?: string; children: ReactNode; className?: string }) {
  return <div className={`slide-lab ${className}`} data-scene-controls aria-label={title}>{children}</div>;
}

export function Choices({ label, items, value, onChange }: { label: string; items: readonly string[]; value: number; onChange: (index: number) => void }) {
  return <div className="lab-choices" role="group" aria-label={label}>{items.map((item, index) => <button type="button" key={item} aria-pressed={value === index} onClick={() => onChange(index)}>{item}</button>)}</div>;
}

export function useRunner(active: boolean, last: number, interval = 1100) {
  const [step, setStep] = useState(0);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    if (!active || document.hidden) return;
    if (!running || step >= last) return;
    const timer = window.setTimeout(() => setStep(value => Math.min(last, value + 1)), interval);
    return () => window.clearTimeout(timer);
  }, [active, running, step, last, interval]);
  useEffect(() => {
    // Leaving a slide pauses the demonstration; returning never starts it by surprise.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!active) setRunning(false);
  }, [active]);
  useEffect(() => {
    const pause = () => { if (document.hidden) setRunning(false); };
    document.addEventListener("visibilitychange", pause);
    return () => document.removeEventListener("visibilitychange", pause);
  }, []);
  return { step, playing: running && step < last && active,
    play: () => { if (step >= last) setStep(0); setRunning(value => !value); },
    next: () => { setRunning(false); setStep(value => Math.min(last, value + 1)); },
    reset: () => { setRunning(false); setStep(0); },
    seek: (value: number) => { setRunning(false); setStep(Math.max(0, Math.min(last, value))); }, last };
}

export type Runner = ReturnType<typeof useRunner>;
export function Transport({ runner }: { runner: Runner }) {
  return <div className="lab-transport">
    <button type="button" onClick={runner.play} aria-pressed={runner.playing}>{runner.playing ? "Ⅱ 一時停止" : runner.step >= runner.last ? "▶ 再生し直す" : "▶ 再生"}</button>
    <button type="button" onClick={runner.next} disabled={runner.step >= runner.last}>1ステップ →</button>
    <button type="button" onClick={runner.reset}>↺ リセット</button>
    <progress max={runner.last || 1} value={runner.step} aria-label="デモの進行" />
    <output>{runner.step} / {runner.last}</output>
  </div>;
}

export function Track({ labels, step }: { labels: readonly string[]; step: number }) {
  return <ol className="lab-track">{labels.map((label, index) => <li key={`${label}-${index}`} data-state={index === step ? "current" : index < step ? "done" : "waiting"} aria-current={index === step ? "step" : undefined}><span>{index < step ? "✓" : String(index + 1).padStart(2, "0")}</span>{label}</li>)}</ol>;
}

export function Result({ title, children, tone = "normal" }: { title: string; children: ReactNode; tone?: "normal" | "good" | "warn" }) {
  return <div className="lab-result" data-tone={tone} role="status"><strong>{title}</strong><div>{children}</div></div>;
}
