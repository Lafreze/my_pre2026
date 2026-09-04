"use client";

import { memo, useCallback, useEffect, useId, useRef, useState } from "react";

let renderQueue: Promise<void> = Promise.resolve();
let mermaidPromise: Promise<typeof import("mermaid")["default"]> | null = null;

function getMermaid() {
  if (!mermaidPromise) {
    mermaidPromise = import("mermaid").then(({ default: mermaid }) => {
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: "strict",
        theme: "base",
        fontFamily: '"Space Grotesk", "Yu Gothic UI", "Noto Sans JP", sans-serif',
        flowchart: { htmlLabels: true, curve: "basis", nodeSpacing: 38, rankSpacing: 54, padding: 14 },
        themeVariables: {
          primaryColor: "#eef3ff",
          primaryTextColor: "#101426",
          primaryBorderColor: "#3048ff",
          lineColor: "#5368ff",
          secondaryColor: "#e5e9ff",
          tertiaryColor: "#fbf9ec",
          clusterBkg: "#fbf9ec",
          clusterBorder: "#9ca8ff",
          fontSize: "14px",
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
  className?: string;
  initialScale?: number;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const RenderedMermaid = memo(function RenderedMermaid({ svg }: { svg: string }) {
  return <div className="diagram-svg" dangerouslySetInnerHTML={{ __html: svg }} />;
});

export function MermaidDiagram({ chart, label, caption, showCode = false, className = "", initialScale = 1 }: MermaidDiagramProps) {
  const reactId = useId();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState("");
  const [error, setError] = useState("");
  const [scale, setScale] = useState(initialScale);
  const [nodes, setNodes] = useState<Array<{ id: string; label: string }>>([]);
  const [pinnedNode, setPinnedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const activeNode = hoveredNode ?? pinnedNode;

  useEffect(() => {
    let active = true;
    const render = async () => {
      try {
        const mermaid = await getMermaid();
        const id = `mermaid-${reactId.replace(/[^a-zA-Z0-9]/g, "")}`;
        const result = await mermaid.render(id, chart);
        if (active) {
          setSvg(result.svg);
          setError("");
          setScale(initialScale);
          setPinnedNode(null);
          setHoveredNode(null);
        }
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : "図を表示できませんでした");
      }
    };
    renderQueue = renderQueue.then(render, render);
    return () => { active = false; };
  }, [chart, initialScale, reactId]);

  useEffect(() => {
    if (!svg || !canvasRef.current) return;
    canvasRef.current.querySelectorAll<SVGElement>("g.cluster rect").forEach((shape) => {
      shape.style.setProperty("fill", "#f5f7fa", "important");
      shape.style.setProperty("stroke", "#cbd5e1", "important");
      shape.style.setProperty("stroke-width", "1.2px", "important");
      shape.setAttribute("rx", "14");
      shape.setAttribute("ry", "14");
    });
    canvasRef.current.querySelectorAll<HTMLElement>("g.node .nodeLabel, g.node .nodeLabel *").forEach((text) => {
      text.style.removeProperty("fill");
      text.style.removeProperty("color");
    });
    const nodeElements = Array.from(canvasRef.current.querySelectorAll<SVGGElement>("g.node"));
    setNodes(nodeElements.map((node, index) => {
      const nodeLabel = (node.textContent || `STEP ${index + 1}`).replace(/\s+/g, " ").trim();
      const nodeId = node.id || `diagram-node-${index}`;
      node.dataset.interactiveId = nodeId;
      node.setAttribute("role", "button");
      node.setAttribute("tabindex", "0");
      node.setAttribute("aria-label", `${nodeLabel}を強調表示`);
      return { id: nodeId, label: nodeLabel };
    }));
  }, [svg]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const nodeElements = Array.from(canvas.querySelectorAll<SVGGElement>("g.node"));
    const nodeKeys = new Map<string, string>();
    nodeElements.forEach((node, index) => {
      const nodeId = node.id || `diagram-node-${index}`;
      nodeKeys.set(nodeId, nodeId.replace(/^flowchart-/, "").replace(/-\d+$/, ""));
    });
    const relatedNodes = new Set<string>();
    const activeKey = activeNode ? nodeKeys.get(activeNode) : null;
    if (activeNode) relatedNodes.add(activeNode);
    const edgeElements = Array.from(canvas.querySelectorAll<SVGElement>("g.edgePath, path.flowchart-link"));
    edgeElements.forEach((edge) => {
      const signature = [edge.id, edge.getAttribute("class"), edge.querySelector("path")?.id].filter(Boolean).join("_");
      const touching = Array.from(nodeKeys.entries()).filter(([, key]) => new RegExp(`(^|[-_])${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([-_]|$)`).test(signature));
      const isRelated = Boolean(activeKey) && touching.some(([, key]) => key === activeKey);
      edge.classList.toggle("is-active-edge", isRelated);
      edge.classList.toggle("is-muted-edge", Boolean(activeNode) && !isRelated);
      if (isRelated) touching.forEach(([id]) => relatedNodes.add(id));
    });
    nodeElements.forEach((node, index) => {
      const nodeId = node.id || `diagram-node-${index}`;
      const nodeLabel = (node.textContent || `STEP ${index + 1}`).replace(/\s+/g, " ").trim();
      node.dataset.interactiveId = nodeId;
      node.setAttribute("role", "button");
      node.setAttribute("tabindex", "0");
      node.setAttribute("aria-label", `${nodeLabel}を強調表示`);
      const isActive = nodeId === activeNode;
      node.querySelectorAll<SVGElement>("rect, polygon, circle, path").forEach((shape) => {
        shape.style.setProperty("fill", isActive ? "#eef2ff" : "#ffffff", "important");
        shape.style.setProperty("stroke", isActive ? "#3048ff" : "#8794a8", "important");
        shape.style.setProperty("stroke-width", isActive ? "3px" : "1.6px", "important");
        if (shape.tagName.toLowerCase() === "rect") {
          shape.setAttribute("rx", "10");
          shape.setAttribute("ry", "10");
        }
      });
      node.querySelectorAll<HTMLElement>(".nodeLabel, .nodeLabel *").forEach((text) => {
        text.style.setProperty("color", "#111827", "important");
      });
      node.classList.toggle("is-active-node", isActive);
      node.classList.toggle("is-related-node", Boolean(activeNode) && !isActive && relatedNodes.has(nodeId));
      node.classList.toggle("is-muted-node", Boolean(activeNode) && !relatedNodes.has(nodeId));
    });
  }, [activeNode, svg]);

  const resetView = useCallback(() => {
    setScale(initialScale);
    setPinnedNode(null);
    setHoveredNode(null);
  }, [initialScale]);

  const getNodeId = useCallback((target: EventTarget | null) => {
    const element = target instanceof Element ? target.closest<SVGGElement>("g.node") : null;
    return element?.dataset.interactiveId || null;
  }, []);

  const selectNode = useCallback((target: EventTarget | null) => {
    const nodeId = getNodeId(target);
    if (!nodeId) return;
    setPinnedNode((current) => current === nodeId ? null : nodeId);
  }, [getNodeId]);

  const activeIndex = nodes.findIndex((node) => node.id === activeNode);
  const activeLabel = activeIndex >= 0 ? nodes[activeIndex].label : "カーソルを重ねて、つながりを追う";

  return (
    <figure className={`mermaid-figure interactive-diagram ${activeNode ? "has-focus" : ""} ${className}`.trim()} aria-label={label}>
      <div className="diagram-toolbar">
        <div className="diagram-status" aria-live="polite">
          <span>{activeNode ? `NODE ${String(activeIndex + 1).padStart(2, "0")} / ${String(nodes.length).padStart(2, "0")}` : "INTERACTIVE MAP"}</span>
          <b>{activeLabel}</b>
        </div>
        <div className="diagram-actions" role="group" aria-label="図の操作">
          <button type="button" onClick={() => setScale((value) => clamp(value - 0.1, 0.75, 1.8))} aria-label="図を縮小">−</button>
          <button type="button" onClick={() => setScale((value) => clamp(value + 0.1, 0.75, 1.8))} aria-label="図を拡大">＋</button>
          <button type="button" onClick={resetView} aria-label="表示を初期状態に戻す">↺<span>リセット</span></button>
        </div>
      </div>
      <div
        className="mermaid-canvas"
        ref={canvasRef}
        onClick={(event) => selectNode(event.target)}
        onPointerOver={(event) => setHoveredNode(getNodeId(event.target))}
        onPointerOut={(event) => {
          const current = getNodeId(event.target);
          const next = getNodeId(event.relatedTarget);
          if (current !== next) setHoveredNode(next);
        }}
        onFocusCapture={(event) => setHoveredNode(getNodeId(event.target))}
        onBlurCapture={() => setHoveredNode(null)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            selectNode(event.target);
          }
        }}
      >
        {svg ? <div className="diagram-stage" style={{ transform: `scale(${scale})` }}><RenderedMermaid svg={svg} /></div> : <div className="diagram-loading">{error || "DIAGRAM LOADING…"}</div>}
      </div>
      {caption && <figcaption><span>READING NOTE</span>{caption}</figcaption>}
      {showCode && (
        <details className="mermaid-code">
          <summary>MERMAID CODE を見る</summary>
          <pre><code>{chart}</code></pre>
        </details>
      )}
    </figure>
  );
}
