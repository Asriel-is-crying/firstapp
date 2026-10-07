import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { catalog, rows } from "./api";
import { useAuth } from "./auth";
export const useCatalog = () =>
  useQuery({ queryKey: ["catalog"], queryFn: catalog });
export function useRows<T>(
  table: string,
  filters: Record<string, unknown> = {},
  enabled = true,
) {
  const { session } = useAuth();
  return useQuery({
    queryKey: [table, session?.user.id, filters],
    queryFn: () => rows<T>(table, filters),
    enabled: enabled && !!session,
  });
}
export function useAction<T>(fn: (args: T) => Promise<unknown>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => qc.invalidateQueries(),
  });
}
