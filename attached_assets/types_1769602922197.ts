

export type AppMode = 'HOME' | 'WORLD_TOUR' | 'MEDIA_STUDIO' | 'EXPLORER' | 'TUTOR' | 'VAULT' | 'HISTORY' | 'LEVEL_TEST' | 'GRAMMAR_LAB';

export interface Language {
  code: string;
  name: string;
  flag: string;
  level?: string;
  progress?: number;
}

export interface GrammarLesson {
  topic: string;
  explanation: string;
  examples: { original: string; translation: string }[];
  exercises: { question: string; options: string[]; answer: string; explanation: string }[];
}

export interface UserStats {
  level: number;
  xp: number;
  xpToday: number;
  streak: number;
  totalJourneys: number;
  totalShadowings: number;
  totalWords: number;
  proficiency?: string;
  lastActivityDate?: number;
  lastLoginDate?: string;
  dailyHistory: { date: string, xp: number }[];
}

export interface Bookmark {
  id: string;
  text: string;
  translation: string;
  type: 'word' | 'expression' | 'sentence';
  context?: string;
  timestamp?: number;
  sourceType: 'MEDIA' | 'WORLD' | 'EXPLORER';
  sourceTitle?: string;
  city?: string;
}

export interface LevelTestQuestion {
  id: number;
  type: 'VOCAB' | 'GRAMMAR' | 'SITUATION' | 'PRONUNCIATION';
  question: string;
  options?: string[];
  correctAnswer?: string;
  audioText?: string;
}

export interface LevelTestResult {
  score: number;
  proficiency: string;
  strengths: string[];
  weaknesses: string[];
  summary: string;
  recommendedLevel: number;
}

export interface Destination {
  id: string;
  country: string;
  city: string;
  lat: number;
  lng: number;
  language: Language;
  flag: string;
  image: string;
}

export interface Character {
  name: string;
  gender: 'Male' | 'Female';
  personality: string;
  kindness: number;
  mood: string;
  avatarUrl?: string;
}

export interface Message {
  role: 'user' | 'model';
  content: string;
  tip?: string;
  timestamp: number;
}

export interface AnalysisResult {
  id: string;
  title: string;
  date: string;
  type: 'youtube' | 'file' | 'manual';
  source: string;
  summary: string;
  cefrLevel: string;
  script: DialogueLine[];
  keySentences: DialogueLine[];
  vocabulary: VocabularyItem[];
  idioms: IdiomItem[];
  notes: DeepNote[];
  quiz: QuizItem[];
}

export interface DialogueLine {
  speaker: string;
  text: string;
  translation: string;
  timestamp: string;
  seconds: number;
  tip?: string;
  vocabulary?: { word: string; meaning: string }[]; // Words in this specific line
  idioms?: { phrase: string; meaning: string }[];   // Idioms in this specific line
}

export interface VocabularyItem {
  word: string;
  meaning: string;
  example?: string;
  timestamp?: string;
}

export interface IdiomItem {
  phrase: string;
  meaning: string;
  origin?: string;
  timestamp?: string;
}

export interface DeepNote {
  title: string;
  content: string;
}

export interface QuizItem {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
}

// Missing types added below to resolve compilation errors

export interface JourneyReport {
  id: string;
  city: string;
  destination: string;
  summary: string;
  date: string;
}

export interface SavedExpression {
  id: string;
  text: string;
  translation: string;
  type: 'word' | 'sentence';
  city: string;
}

export interface TranscriptionItem {
  speaker: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  examples: string[];
}

export interface Scenario {
  id: string;
  name: string;
  icon: string;
  image: string;
}

export interface Weather {
  temp: number;
  condition: string;
  localDesc: string;
  tip: string;
}
