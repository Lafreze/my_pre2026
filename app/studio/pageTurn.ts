/** A bound sheet, split into a continuous curved ribbon. Its spine stays fixed.
 * Positive depth lifts the right edge toward the reader before it travels left. */
export function createPageTurn(page: HTMLElement) {
  const width = page.offsetWidth, height = page.offsetHeight, count = 20;
  const layer = document.createElement("div");
  layer.className = "book-turn-sheet";
  layer.inert = true;
  layer.setAttribute("aria-hidden", "true");
  layer.style.cssText = `width:${width}px;height:${height}px`;
  const strips = Array.from({ length: count }, (_, i) => {
    const strip = document.createElement("div");
    strip.className = "book-turn-strip";
    strip.style.width = `${width / count + .6}px`;
    const front = document.createElement("div");
    front.className = "book-turn-front";
    const copy = page.cloneNode(true) as HTMLElement;
    copy.querySelectorAll("[id]").forEach(el => el.removeAttribute("id"));
    copy.style.cssText = `width:${width}px;height:${height}px;position:absolute;left:${-i * width / count}px;top:0;transform:none;opacity:1;filter:none;box-shadow:none;`;
    front.append(copy);
    const back = document.createElement("div");
    back.className = "book-turn-back";
    strip.append(front, back);
    layer.append(strip);
    return strip;
  });
  page.parentElement!.append(layer);
  return {
    update(progress: number) {
      const q = Math.max(0, Math.min(1, progress));
      const angle = Math.PI * q, curl = Math.sin(Math.PI * q) * .55;
      let x = 0, z = 0;
      strips.forEach((strip, i) => {
        const theta = angle + curl * (2 * (i + .5) / count - 1);
        strip.style.transform = `translate3d(${x}px,0,${z}px) rotateY(${-theta}rad)`;
        strip.style.filter = `brightness(${1 - Math.sin(theta) * .13})`;
        x += Math.cos(theta) * width / count;
        z += Math.sin(theta) * width / count;
      });
      layer.dataset.tipX = x.toFixed(2);
      layer.dataset.tipDepth = z.toFixed(2);
      layer.style.opacity = String(q > .92 ? (1 - q) / .08 : 1);
    },
    dispose() { layer.remove(); },
  };
}
