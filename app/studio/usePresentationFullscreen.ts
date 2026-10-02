"use client";
import { useCallback, useEffect, useRef, useState } from "react";

export function usePresentationFullscreen() {
  const root = useRef<HTMLElement>(null);
  const [mode, setMode] = useState<"off" | "native" | "window">("off");
  const current = useRef(mode), pending = useRef(false), exitedAt = useRef(-Infinity);
  const update = useCallback((next: typeof mode) => { current.current = next; setMode(next); }, []);
  const exit = useCallback(async () => {
    if (document.fullscreenElement === root.current) {
      try { await document.exitFullscreen(); } catch { /* Keep the exit control available if the browser refuses. */ }
    } else { exitedAt.current = performance.now(); update("off"); }
  }, [update]);
  const toggle = useCallback(async () => {
    if (pending.current) return;
    if (current.current !== "off") { await exit(); return; }
    pending.current = true;
    try {
      if (!root.current?.requestFullscreen || !document.fullscreenEnabled) update("window");
      else { await root.current.requestFullscreen(); update("native"); }
    } catch { update("window"); }
    finally { pending.current = false; }
  }, [exit, update]);
  useEffect(() => {
    const change = () => {
      if (document.fullscreenElement === root.current) update("native");
      else if (current.current === "native") { exitedAt.current = performance.now(); update("off"); }
    };
    const key = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      // Native Escape may emit fullscreenchange before keydown. Consume that
      // same Escape so leaving fullscreen never also closes the current chapter.
      if (current.current !== "off" || performance.now() - exitedAt.current < 400) {
        e.preventDefault(); e.stopImmediatePropagation();
        if (current.current !== "off") void exit();
      }
    };
    document.addEventListener("fullscreenchange", change);
    window.addEventListener("keydown", key, true);
    return () => { document.removeEventListener("fullscreenchange", change); window.removeEventListener("keydown", key, true); };
  }, [exit, update]);
  const attach = useCallback((node: HTMLElement | null) => { root.current = node; }, []);
  return { attach, mode, active: mode !== "off", toggle };
}
