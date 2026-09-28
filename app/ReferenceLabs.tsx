"use client";
import { Lab } from "./LabControls";

export function OverviewWindow({ year, onChange, nodes }: { year: number; onChange: (value: number) => void; nodes: readonly { year: string; title: string; keyword: string }[] }) {
  const nearby = nodes.filter(node => { const dates = node.year.match(/\d{4}/g)?.map(Number) ?? []; return dates[0] <= year + 1 && (dates[1] ?? dates[0]) >= year - 1; });
  return <Lab title="時間の窓を動かし、その頃の変化を見る" note="選択年の前後1年を強調 · 近接は因果関係を意味しません"><label className="lab-range">注目する年 <output>{year}</output><input type="range" min="2017" max="2026" value={year} onChange={event => onChange(Number(event.target.value))} /></label><div className="year-ruler" aria-hidden="true">{[2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026].map(value => <span key={value} data-near={Math.abs(value - year) <= 1}>{value}</span>)}</div><div className="year-focus" aria-live="polite">{nearby.map(node => <span key={node.title}><b>{node.title}</b><small>{node.keyword}</small></span>)}</div></Lab>;
}
