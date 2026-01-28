import { useMutation } from "@tanstack/react-query";
import { api, type MediaAnalyzeRequest, type AnalysisResult } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useAnalyzeMedia() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: MediaAnalyzeRequest) => {
      // Validate input before sending using the shared schema
      // Note: In a real app we might do more robust client-side validation here
      const validated = api.media.analyze.input.parse(data);

      const res = await fetch(api.media.analyze.path, {
        method: api.media.analyze.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 401) throw new Error("Unauthorized");
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to analyze media");
      }

      const result = await res.json();
      // Validate response structure
      return api.media.analyze.responses[200].parse(result);
    },
    onError: (error) => {
      toast({
        title: "Analysis Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
