"use client";

import { useEffect, useRef } from "react";

export type InsightContent = {
  kicker: string;
  title: string;
  summary: string;
  points: readonly string[];
  source?: { label: string; url: string };
};

type InsightDialogProps = {
  insight: InsightContent | null;
  onClose: () => void;
};

export function InsightDialog({ insight, onClose }: InsightDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (insight && !dialog.open) dialog.showModal();
    if (!insight && dialog.open) dialog.close();
  }, [insight]);

  return (
    <dialog
      ref={dialogRef}
      className="insight-dialog"
      aria-labelledby="insight-dialog-title"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      {insight && <article>
        <header>
          <span>{insight.kicker}</span>
          <button type="button" onClick={onClose} aria-label="詳細を閉じる">×</button>
        </header>
        <h2 id="insight-dialog-title">{insight.title}</h2>
        <p>{insight.summary}</p>
        <ol>
          {insight.points.map((point, index) => <li key={point}><span>{String(index + 1).padStart(2, "0")}</span><b>{point}</b></li>)}
        </ol>
        {insight.source && <a href={insight.source.url} target="_blank" rel="noreferrer">{insight.source.label} ↗</a>}
      </article>}
    </dialog>
  );
}
