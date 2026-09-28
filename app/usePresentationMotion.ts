"use client";

import { useEffect, type RefObject } from "react";

/** Only animate the current slide. Content stays visible without JS or motion. */
export function usePresentationMotion(deckRef: RefObject<HTMLElement | null>, slideId: string | undefined) {
  useEffect(() => {
    const deck = deckRef.current;
    if (!deck || !slideId) return;
    const slide = deck.querySelector<HTMLElement>(`section[data-slide-id="${slideId}"]`);
    if (!slide) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const animations: Animation[] = [];
    const stop = () => animations.forEach((animation) => animation.cancel());
    if (!preference.matches) {
      // Animate direct composition groups once, without transforming diagram nodes.
      Array.from(slide.children).filter((node): node is HTMLElement =>
        node instanceof HTMLElement && !node.classList.contains("capability-map")
      ).slice(0, 12).forEach((node, index) => {
        // Keep control hit targets still during entry, especially native drag sources.
        const frames = node.hasAttribute("data-scene-controls")
          ? [{ opacity: 0 }, { opacity: 1 }]
          : [{ opacity: 0, translate: "0 18px" }, { opacity: 1, translate: "0 0" }];
        animations.push(node.animate(
          frames,
          { duration: 540, delay: Math.min(index * 55, 330), easing: "cubic-bezier(.16,1,.3,1)", fill: "backwards" },
        ));
      });
    }
    preference.addEventListener("change", stop);
    return () => { stop(); preference.removeEventListener("change", stop); };
  }, [deckRef, slideId]);
}
