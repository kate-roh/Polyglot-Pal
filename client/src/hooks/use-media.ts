import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import type { AnalysisResult, VideoAnalysisResult } from "@shared/schema";

interface MediaAnalyzeInput {
  type: 'file' | 'manual';
  content: string;
  title?: string;
  mimeType?: string;
}

export function useAnalyzeMedia() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: MediaAnalyzeInput): Promise<AnalysisResult> => {
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

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.history.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.stats.get.path] });
    },
  });
}

interface VideoAnalyzeInput {
  url: string;
  languageCode?: string;
}

export function useAnalyzeVideo() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: VideoAnalyzeInput): Promise<VideoAnalysisResult> => {
      const res = await fetch('/api/video/analyze', {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: data.url, languageCode: data.languageCode || 'en' }),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 401) throw new Error("Unauthorized");
        const error = await res.json();
        throw new Error(error.message || "Video analysis failed");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.history.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.stats.get.path] });
      queryClient.invalidateQueries({ queryKey: ['/api/proficiency'] });
    },
  });
}
