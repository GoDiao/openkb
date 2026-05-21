import { useEffect, useRef, useState, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
  rootMargin?: string;
  className?: string;
  testId?: string;
};

/** Mount children only after the placeholder enters the viewport (once). */
export function LazyWhenVisible({
  children,
  fallback = null,
  rootMargin = "180px 0px",
  className = "",
  testId,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [visible, rootMargin]);

  return (
    <div ref={ref} className={className} data-testid={testId}>
      {visible ? children : fallback}
    </div>
  );
}
