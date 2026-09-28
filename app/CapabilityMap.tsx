"use client";
import { useRef, useState } from "react";

/** A semantic, resolution-independent map of the three existing design layers. */
export function CapabilityMap() {
  const [layer, setLayer] = useState(0);
  const figureRef = useRef<HTMLElement>(null);
  const notes = ["MODEL / 生成と推論で、候補を作る。", "SYSTEM / ContextとToolsをつなぎ、仕事を進める。", "ENGINEERING / HarnessとLoopで、検証・再試行・停止を設計する。"];
  const replay = () => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setLayer(0); return; }
    figureRef.current?.querySelectorAll(".map-core,.map-links,.map-node,.map-orbits").forEach((node, index) => {
      node.getAnimations().forEach(animation => animation.cancel());
      node.animate([{ opacity: 0, scale: ".75" }, { opacity: 1, scale: "1" }], { duration: 650, delay: index * 60, easing: "cubic-bezier(.16,1,.3,1)", fill: "backwards" });
    });
  };
  return (
    <figure className="capability-map" data-layer={layer} data-scene-controls ref={figureRef} aria-label="ModelをSystemが囲み、Engineeringが全体を支える三層の関係" onPointerMove={event => {
      if (event.pointerType !== "mouse" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const rect = event.currentTarget.getBoundingClientRect();
      event.currentTarget.style.setProperty("--map-x", `${(event.clientX - rect.left - rect.width / 2) / rect.width * 8}deg`);
      event.currentTarget.style.setProperty("--map-y", `${-(event.clientY - rect.top - rect.height / 2) / rect.height * 8}deg`);
    }} onPointerLeave={event => { event.currentTarget.style.setProperty("--map-x", "0deg"); event.currentTarget.style.setProperty("--map-y", "0deg"); }}>
      <svg viewBox="0 0 540 480" role="img" aria-labelledby="capability-map-title capability-map-description">
        <title id="capability-map-title">MODEL / SYSTEM / ENGINEERING</title>
        <desc id="capability-map-description">中心に生成と推論を担うModel、その外側にContextとToolsを含むSystem、全体を囲むEngineeringとしてHarnessとLoopを配置。</desc>
        <defs>
          <linearGradient id="map-line" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#60e5d2" /><stop offset="1" stopColor="#719bff" /></linearGradient>
          <radialGradient id="map-core"><stop stopColor="#194e72" /><stop offset="1" stopColor="#0d2036" /></radialGradient>
        </defs>
        <g className="map-coordinates" fill="none" stroke="currentColor">
          <path d="M270 26V454M30 240H510" strokeDasharray="2 8" />
          <circle cx="270" cy="240" r="202" /><circle cx="270" cy="240" r="151" />
        </g>
        <g className="map-orbits" fill="none">
          <ellipse cx="270" cy="240" rx="218" ry="145" transform="rotate(-32 270 240)" />
          <ellipse cx="270" cy="240" rx="167" ry="104" transform="rotate(28 270 240)" />
          <ellipse className="map-signal map-signal-outer" cx="270" cy="240" rx="218" ry="145" transform="rotate(-32 270 240)" />
          <ellipse className="map-signal map-signal-inner" cx="270" cy="240" rx="167" ry="104" transform="rotate(28 270 240)" />
        </g>
        <g className="map-links" fill="none" stroke="url(#map-line)">
          <path d="M270 240 127 176M270 240 414 306M270 240 418 108M270 240 118 373" />
        </g>
        <g className="map-core">
          <circle cx="270" cy="240" r="83" fill="url(#map-core)" stroke="url(#map-line)" />
          <circle cx="270" cy="240" r="72" fill="none" stroke="#81d4ed" strokeOpacity=".15" />
          <text x="270" y="214" className="map-micro" textAnchor="middle">01 / FOUNDATION</text>
          <text x="270" y="250" className="map-core-title" textAnchor="middle">MODEL</text>
          <text x="270" y="277" className="map-note" textAnchor="middle">生成・推論</text>
        </g>
        <g className="map-node" transform="translate(127 176)"><circle r="7" /><text x="-10" y="-24" textAnchor="middle">CONTEXT</text><text x="-10" y="-7" className="map-note" textAnchor="middle">判断材料</text></g>
        <g className="map-node" transform="translate(414 306)"><circle r="7" /><text x="12" y="30" textAnchor="middle">TOOLS</text><text x="12" y="49" className="map-note" textAnchor="middle">外部への作用</text></g>
        <g className="map-node" transform="translate(418 108)"><circle r="5" /><text x="-8" y="-23" textAnchor="middle">HARNESS</text></g>
        <g className="map-node" transform="translate(118 373)"><circle r="5" /><text x="8" y="30" textAnchor="middle">LOOP</text></g>
        <text x="255" y="389" className="map-layer" textAnchor="middle">02 / SYSTEM</text>
        <text x="273" y="459" className="map-layer" textAnchor="middle">03 / ENGINEERING</text>
      </svg>
      <div className="map-selection" role="group" aria-label="注目する層">{["MODEL", "SYSTEM", "ENGINEERING"].map((name, index) => <button type="button" key={name} aria-pressed={layer === index} onClick={() => setLayer(index)}>{name}</button>)}<button type="button" onClick={replay} aria-label="三層の組み立てを再生">↺</button></div>
      <figcaption aria-live="polite">{notes[layer]}</figcaption>
    </figure>
  );
}
