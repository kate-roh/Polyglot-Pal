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
  type: text("type").notNull(), // 'word' | 'sentence' | 'grammar'
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


// === BASE SCHEMAS ===
export const insertUserStatsSchema = createInsertSchema(userStats).omit({ id: true });
export const insertAnalysisHistorySchema = createInsertSchema(analysisHistory).omit({ id: true, createdAt: true });
export const insertBookmarkSchema = createInsertSchema(bookmarks).omit({ id: true, createdAt: true });

// === EXPLICIT API CONTRACT TYPES ===

// Analysis Result Type (matching the structure expected from Gemini)
export const analysisResultSchema = z.object({
  summary: z.string(),
  vocabulary: z.array(z.object({
    word: z.string(),
    meaning: z.string(),
    example: z.string().optional()
  })),
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
