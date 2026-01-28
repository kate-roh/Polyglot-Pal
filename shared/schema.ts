import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Export Auth & Chat models from integrations
export * from "./models/auth";
export * from "./models/chat";

// Import users table to reference it
import { users } from "./models/auth";

// === TABLE DEFINITIONS ===

// User Stats (XP, Level, etc.)
export const userStats = pgTable("user_stats", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id), // Link to Replit Auth user
  xp: integer("xp").default(0).notNull(),
  level: integer("level").default(1).notNull(),
  dailyStreak: integer("daily_streak").default(0).notNull(),
  lastActiveDate: timestamp("last_active_date"),
});

export const userStatsRelations = relations(userStats, ({ one }) => ({
  user: one(users, {
    fields: [userStats.userId],
    references: [users.id],
  }),
}));

// Analysis History
export const analysisHistory = pgTable("analysis_history", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // 'youtube' | 'file' | 'manual'
  title: text("title").notNull(),
  originalContent: text("original_content"), // URL or snippet
  result: jsonb("result").notNull(), // The full AI analysis result
  createdAt: timestamp("created_at").defaultNow(),
});

export const analysisHistoryRelations = relations(analysisHistory, ({ one }) => ({
  user: one(users, {
    fields: [analysisHistory.userId],
    references: [users.id],
  }),
}));

// Bookmarks
export const bookmarks = pgTable("bookmarks", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // 'word' | 'sentence' | 'grammar' | 'phrase'
  sourceType: text("source_type").notNull(), // 'youtube' | 'file' | 'manual'
  content: text("content").notNull(), // The word/sentence itself
  meaning: text("meaning").notNull(), // Translation or definition
  context: text("context"), // Example sentence or usage context
  createdAt: timestamp("created_at").defaultNow(),
});

export const bookmarksRelations = relations(bookmarks, ({ one }) => ({
  user: one(users, {
    fields: [bookmarks.userId],
    references: [users.id],
  }),
}));

// Language Proficiency (CEFR Levels per language)
export const languageProficiency = pgTable("language_proficiency", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  languageCode: varchar("language_code", { length: 10 }).notNull(), // 'ko', 'en', 'ja', etc.
  cefrLevel: varchar("cefr_level", { length: 5 }).notNull().default("A1"), // A1, A2, B1, B2, C1, C2
  cefrScore: integer("cefr_score").default(0).notNull(), // 0-100 score within level
  lastTestDate: timestamp("last_test_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const languageProficiencyRelations = relations(languageProficiency, ({ one }) => ({
  user: one(users, {
    fields: [languageProficiency.userId],
    references: [users.id],
  }),
}));

// Level Test History
export const levelTestHistory = pgTable("level_test_history", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  languageCode: varchar("language_code", { length: 10 }).notNull(),
  testType: varchar("test_type", { length: 20 }).notNull(), // 'initial', 'periodic', 'challenge'
  previousLevel: varchar("previous_level", { length: 5 }),
  newLevel: varchar("new_level", { length: 5 }).notNull(),
  score: integer("score").notNull(),
  maxScore: integer("max_score").notNull(),
  strengths: jsonb("strengths").$type<string[]>(),
  weaknesses: jsonb("weaknesses").$type<string[]>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const levelTestHistoryRelations = relations(levelTestHistory, ({ one }) => ({
  user: one(users, {
    fields: [levelTestHistory.userId],
    references: [users.id],
  }),
}));

// Proficiency Change Log (for tracking score changes from activities)
export const proficiencyLog = pgTable("proficiency_log", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  languageCode: varchar("language_code", { length: 10 }).notNull(),
  activityType: varchar("activity_type", { length: 30 }).notNull(), // 'world_tour', 'media_studio', 'level_test', 'quiz'
  activityId: varchar("activity_id"), // Reference to specific activity
  scoreChange: integer("score_change").notNull(), // positive or negative
  previousScore: integer("previous_score").notNull(),
  newScore: integer("new_score").notNull(),
  previousLevel: varchar("previous_level", { length: 5 }).notNull(),
  newLevel: varchar("new_level", { length: 5 }).notNull(),
  reason: text("reason"), // Brief explanation for the change
  createdAt: timestamp("created_at").defaultNow(),
});

export const proficiencyLogRelations = relations(proficiencyLog, ({ one }) => ({
  user: one(users, {
    fields: [proficiencyLog.userId],
    references: [users.id],
  }),
}));

// === BASE SCHEMAS ===
export const insertUserStatsSchema = createInsertSchema(userStats).omit({ id: true });
export const insertAnalysisHistorySchema = createInsertSchema(analysisHistory).omit({ id: true, createdAt: true });
export const insertBookmarkSchema = createInsertSchema(bookmarks).omit({ id: true, createdAt: true });
export const insertLanguageProficiencySchema = createInsertSchema(languageProficiency).omit({ id: true, createdAt: true, updatedAt: true });
export const insertLevelTestHistorySchema = createInsertSchema(levelTestHistory).omit({ id: true, createdAt: true });
export const insertProficiencyLogSchema = createInsertSchema(proficiencyLog).omit({ id: true, createdAt: true });

// Type exports
export type LanguageProficiency = typeof languageProficiency.$inferSelect;
export type InsertLanguageProficiency = z.infer<typeof insertLanguageProficiencySchema>;
export type LevelTestHistory = typeof levelTestHistory.$inferSelect;
export type InsertLevelTestHistory = z.infer<typeof insertLevelTestHistorySchema>;
export type ProficiencyLog = typeof proficiencyLog.$inferSelect;
export type InsertProficiencyLog = z.infer<typeof insertProficiencyLogSchema>;

// === EXPLICIT API CONTRACT TYPES ===

// Analysis Result Type (matching the structure expected from Gemini)
export const analysisResultSchema = z.object({
  summary: z.string(),
  vocabulary: z.array(z.object({
    word: z.string(),
    meaning: z.string(),
    example: z.string().optional()
  })),
  phrases: z.array(z.object({
    phrase: z.string(),
    meaning: z.string(),
    usage: z.string().optional()
  })).optional(),
  grammar: z.array(z.object({
    point: z.string(),
    explanation: z.string(),
    example: z.string().optional()
  })),
  keySentences: z.array(z.object({
    sentence: z.string(),
    translation: z.string(),
    nuance: z.string().optional()
  })),
  culturalNotes: z.array(z.string()).optional()
});

export type AnalysisResult = z.infer<typeof analysisResultSchema>;

// Video Analysis Result - Enhanced with timestamps for YouTube/TikTok/Instagram
export const videoSegmentSchema = z.object({
  timestamp: z.string(), // "00:19", "01:23" etc
  timestampSeconds: z.number(), // seconds for seeking
  sentence: z.string(), // Original sentence in English
  translation: z.string(), // Korean translation
  expressionNote: z.string().optional(), // Explanation of key expressions like "'Seen in years'는..."
  vocabulary: z.array(z.object({
    word: z.string(),
    meaning: z.string()
  })).optional(),
  phrases: z.array(z.object({
    phrase: z.string(),
    meaning: z.string()
  })).optional()
});

export const videoAnalysisResultSchema = z.object({
  platform: z.enum(['youtube', 'tiktok', 'instagram', 'other']).optional(),
  videoId: z.string().optional(),
  videoUrl: z.string().optional(),
  videoTitle: z.string().optional(),
  summary: z.string(), // Learning overview
  cefrLevel: z.string().optional(), // A1, A2, B1, B2, C1, C2
  cefrExplanation: z.string().optional(), // Why this CEFR level
  segments: z.array(videoSegmentSchema),
  grammar: z.array(z.object({
    point: z.string(),
    explanation: z.string(),
    example: z.string().optional()
  })).optional(),
  culturalNotes: z.array(z.string()).optional(),
  // Learning sections
  roleplayMission: z.object({
    scenario: z.string(),
    yourRole: z.string(),
    npcRole: z.string(),
    objective: z.string(),
    starterPrompt: z.string()
  }).optional(),
  quizQuestions: z.array(z.object({
    question: z.string(),
    options: z.array(z.string()),
    correctIndex: z.number(),
    explanation: z.string()
  })).optional(),
  conversationPractice: z.array(z.object({
    speaker: z.string(),
    line: z.string(),
    translation: z.string()
  })).optional()
});

export type VideoSegment = z.infer<typeof videoSegmentSchema>;
export type VideoAnalysisResult = z.infer<typeof videoAnalysisResultSchema>;

// Legacy aliases for compatibility
export const youtubeSegmentSchema = videoSegmentSchema;
export const youtubeAnalysisResultSchema = videoAnalysisResultSchema;
export type YoutubeSegment = VideoSegment;
export type YoutubeAnalysisResult = VideoAnalysisResult;

// Media Analysis Request
export const mediaAnalyzeRequestSchema = z.object({
  type: z.enum(['youtube', 'file', 'manual']),
  content: z.string(), // URL, Text, or Base64 (handled carefully)
  title: z.string().optional(),
  mimeType: z.string().optional() // For files
});
export type MediaAnalyzeRequest = z.infer<typeof mediaAnalyzeRequestSchema>;


// Stats
export type UserStats = typeof userStats.$inferSelect;
export type InsertUserStats = z.infer<typeof insertUserStatsSchema>;

// History
export type AnalysisHistoryItem = typeof analysisHistory.$inferSelect;
export type InsertAnalysisHistory = z.infer<typeof insertAnalysisHistorySchema>;

// Bookmarks
export type Bookmark = typeof bookmarks.$inferSelect;
export type InsertBookmark = z.infer<typeof insertBookmarkSchema>;
