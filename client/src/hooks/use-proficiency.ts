import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface LanguageProficiency {
  id: number;
  userId: string;
  languageCode: string;
  cefrLevel: string;
  score: number;
  vocabularyScore: number | null;
  grammarScore: number | null;
  listeningScore: number | null;
  speakingScore: number | null;
  readingScore: number | null;
  testsTaken: number;
  lastTestDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProficiencyLog {
  id: number;
  userId: string;
  languageCode: string;
  activityType: string;
  previousLevel: string;
  newLevel: string;
  scoreChange: number;
  reason: string | null;
  createdAt: string;
}

export function useAllProficiencies() {
  return useQuery<LanguageProficiency[]>({
    queryKey: ['/api/proficiency'],
  });
}

export function useLanguageProficiency(languageCode: string | null) {
  return useQuery<LanguageProficiency>({
    queryKey: ['/api/proficiency', languageCode],
    enabled: !!languageCode,
  });
}

export function useProficiencyHistory(languageCode: string | null) {
  return useQuery<ProficiencyLog[]>({
    queryKey: ['/api/proficiency', languageCode, 'history'],
    enabled: !!languageCode,
  });
}

export function useUpdateProficiency() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      languageCode: string;
      activityType: string;
      performance: number;
      details: string;
    }) => {
      const res = await apiRequest('POST', '/api/proficiency/update', data);
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/proficiency'] });
      queryClient.invalidateQueries({ queryKey: ['/api/proficiency', variables.languageCode] });
      queryClient.invalidateQueries({ queryKey: ['/api/proficiency', variables.languageCode, 'history'] });
    },
  });
}

export const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;

export const CEFR_COLORS: Record<string, string> = {
  'A1': 'from-green-400 to-green-600',
  'A2': 'from-emerald-400 to-emerald-600',
  'B1': 'from-blue-400 to-blue-600',
  'B2': 'from-indigo-400 to-indigo-600',
  'C1': 'from-purple-400 to-purple-600',
  'C2': 'from-amber-400 to-amber-600',
};

export const CEFR_LABELS: Record<string, string> = {
  'A1': 'Beginner',
  'A2': 'Elementary',
  'B1': 'Intermediate',
  'B2': 'Upper Intermediate',
  'C1': 'Advanced',
  'C2': 'Mastery',
};

export const LANGUAGE_CODES: Record<string, string> = {
  'en': 'English',
  'fr': 'French',
  'es': 'Spanish',
  'de': 'German',
  'it': 'Italian',
  'pt': 'Portuguese',
  'ja': 'Japanese',
  'ko': 'Korean',
  'zh': 'Mandarin',
};
