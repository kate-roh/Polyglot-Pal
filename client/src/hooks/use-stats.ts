import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useStats() {
  return useQuery({
    queryKey: [api.stats.get.path],
    queryFn: async () => {
      const res = await fetch(api.stats.get.path, { credentials: "include" });
      if (!res.ok) {
        if (res.status === 401) return null;
        throw new Error("Failed to fetch stats");
      }
      return api.stats.get.responses[200].parse(await res.json());
    },
  });
}

export const useUserStats = useStats;

export function useAddXp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (amount: number) => {
      const res = await fetch(api.stats.addXp.path, {
        method: api.stats.addXp.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to add XP");
      return api.stats.addXp.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.stats.get.path] });
    },
  });
}
