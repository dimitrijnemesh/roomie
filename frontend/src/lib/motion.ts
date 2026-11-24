const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Shake an element horizontally — used for invalid fields. */
export function shake(el: Element | null | undefined) {
  if (!el || reduced() || !("animate" in el)) return;
  el.animate(
    [
      { transform: "translateX(0)" },
      { transform: "translateX(-8px)" },
      { transform: "translateX(7px)" },
      { transform: "translateX(-5px)" },
      { transform: "translateX(3px)" },
      { transform: "translateX(0)" },
    ],
    { duration: 380, easing: "ease-out" },
  );
}

export const wait = (ms: number) => new Promise((r) => setTimeout(r, reduced() ? Math.min(ms, 300) : ms));
