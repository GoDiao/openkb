import { useCallback, useEffect, useState } from "react";

export function useDocScrollSpy(sectionIds: string[]) {
  const [activeId, setActiveId] = useState<string | null>(sectionIds[0] ?? null);

  const scrollTo = useCallback((id: string) => {
    setActiveId(id);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  useEffect(() => {
    if (sectionIds.length === 0) return undefined;

    const ratios = new Map<string, number>();

    const pickActive = () => {
      let bestId: string | null = null;
      let bestRatio = 0;
      for (const id of sectionIds) {
        const ratio = ratios.get(id) ?? 0;
        if (ratio > bestRatio) {
          bestRatio = ratio;
          bestId = id;
        }
      }
      if (bestId) setActiveId(bestId);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          ratios.set(entry.target.id, entry.intersectionRatio);
        }
        pickActive();
      },
      {
        rootMargin: "-12% 0px -55% 0px",
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
      },
    );

    for (const id of sectionIds) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [sectionIds.join("|")]);

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (!hash || !sectionIds.includes(hash)) return;
    scrollTo(hash);
  }, [sectionIds.join("|"), scrollTo]);

  return { activeId, scrollTo };
}
