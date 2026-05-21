import { useCallback, useRef } from "react";

export function useDebouncedCallback(fn: (value: string) => void, delay: number) {
  const fnRef = useRef(fn);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  fnRef.current = fn;

  return useCallback(
    (value: string) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => fnRef.current(value), delay);
    },
    [delay],
  );
}
