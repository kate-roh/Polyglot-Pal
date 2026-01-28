import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useUserStats() {
  return useQuery({
    queryKey: [api.stats.get.path],
    queryFn: async () => {
      const res = await fetch(api.stats.get.path, { credentials: "include" });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Failed to fetch stats");
      return api.stats.get.responses[200].parse(await res.json());
    },
  });
}

export function useAddXp() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (amount: number) => {
      const res = await fetch(api.stats.addXp.path, {
        method: api.stats.addXp.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update XP");
      return api.stats.addXp.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      queryClient.setQueryData([api.stats.get.path], data);
      toast({
        title: "Level Up!",
        description: `You gained XP! Keep up the streak.`,
        className: "bg-primary text-primary-foreground border-none",
      });
    },
  });
}
