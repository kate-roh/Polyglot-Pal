import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type MediaAnalyzeRequest, type AnalysisResult } from "@shared/routes";

export function useAnalyzeMedia() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: MediaAnalyzeRequest) => {
      const res = await fetch(api.media.analyze.path, {
        method: api.media.analyze.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 401) throw new Error("Unauthorized");
        const error = await res.json();
        throw new Error(error.message || "Analysis failed");
      }

      return api.media.analyze.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.history.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.stats.get.path] });
    },
  });
}
