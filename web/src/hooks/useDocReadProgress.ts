import { useEffect, useState } from "react";

export function useDocReadProgress(sectionIds: string[]) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (sectionIds.length === 0) {
      setProgress(0);
      return undefined;
    }

    const measure = () => {
      const first = document.getElementById(sectionIds[0]);
      const last = document.getElementById(sectionIds[sectionIds.length - 1]);
      if (!first || !last) return;

      const start = first.getBoundingClientRect().top + window.scrollY;
      const end = last.getBoundingClientRect().bottom + window.scrollY;
      const viewportAnchor = window.scrollY + window.innerHeight * 0.35;
      const range = Math.max(end - start, 1);
      const pct = ((viewportAnchor - start) / range) * 100;
      setProgress(Math.min(100, Math.max(0, Math.round(pct))));
    };

    measure();
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [sectionIds.join("|")]);

  return progress;
}
