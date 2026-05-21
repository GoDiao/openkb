import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

/** Invalidate Kanban, STATE, and roadmap after UI mutations (move/create/checkout/etc.). */
export function useInvalidateProjectSync(slug: string) {
  const queryClient = useQueryClient();
  return useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["board", slug] });
    void queryClient.invalidateQueries({ queryKey: ["state", slug] });
    void queryClient.invalidateQueries({ queryKey: ["roadmap", slug] });
  }, [queryClient, slug]);
}
