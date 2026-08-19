"use client";

import { useEffect, useId, useState } from "react";

let renderQueue: Promise<void> = Promise.resolve();
let mermaidPromise: Promise<typeof import("mermaid")["default"]> | null = null;

function getMermaid() {
  if (!mermaidPromise) {
    mermaidPromise = import("mermaid").then(({ default: mermaid }) => {
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: "strict",
        theme: "base",
        fontFamily: 'Arial, "Noto Sans JP", sans-serif',
        flowchart: { htmlLabels: true, curve: "basis", nodeSpacing: 38, rankSpacing: 54 },
        themeVariables: {
          primaryColor: "#d9ff43",
          primaryTextColor: "#11130f",
          primaryBorderColor: "#11130f",
          lineColor: "#5f625a",
          secondaryColor: "#f1f0e8",
          tertiaryColor: "#ffffff",
          clusterBkg: "#f7f6ef",
          clusterBorder: "#9c9e95",
          fontSize: "15px",
        },
      });
      return mermaid;
    });
  }
  return mermaidPromise;
}

type MermaidDiagramProps = {
  chart: string;
  label: string;
  caption?: string;
  showCode?: boolean;
};

export function MermaidDiagram({ chart, label, caption, showCode = true }: MermaidDiagramProps) {
  const reactId = useId();
  const [svg, setSvg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const render = async () => {
      try {
        const mermaid = await getMermaid();
        const id = `mermaid-${reactId.replace(/[^a-zA-Z0-9]/g, "")}`;
        const result = await mermaid.render(id, chart);
        if (active) setSvg(result.svg);
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : "図を表示できませんでした");
      }
    };
    renderQueue = renderQueue.then(render, render);
    return () => { active = false; };
  }, [chart, reactId]);

  return (
    <figure className="mermaid-figure" aria-label={label}>
      <div className="mermaid-canvas">
        {svg ? <div dangerouslySetInnerHTML={{ __html: svg }} /> : <div className="diagram-loading">{error || "DIAGRAM LOADING…"}</div>}
      </div>
      {caption && <figcaption>{caption}</figcaption>}
      {showCode && (
        <details className="mermaid-code">
          <summary>MERMAID CODE を見る</summary>
          <pre><code>{chart}</code></pre>
        </details>
      )}
    </figure>
  );
}
