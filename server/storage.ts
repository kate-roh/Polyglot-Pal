import { db } from "./db";
import { 
  userStats, analysisHistory, bookmarks,
  languageProficiency, levelTestHistory, proficiencyLog,
  type UserStats, type InsertUserStats,
  type AnalysisHistoryItem, type InsertAnalysisHistory,
  type Bookmark, type InsertBookmark,
  type LanguageProficiency, type InsertLanguageProficiency,
  type LevelTestHistory, type InsertLevelTestHistory,
  type ProficiencyLog, type InsertProficiencyLog
} from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // Stats
  getUserStats(userId: string): Promise<UserStats | undefined>;
  createUserStats(stats: InsertUserStats): Promise<UserStats>;
  updateUserXp(userId: string, amount: number): Promise<UserStats>;
  
  // History
  getHistory(userId: string): Promise<AnalysisHistoryItem[]>;
  createHistory(item: InsertAnalysisHistory): Promise<AnalysisHistoryItem>;
  deleteHistory(id: number, userId: string): Promise<void>;

  // Bookmarks
  getBookmarks(userId: string): Promise<Bookmark[]>;
  createBookmark(item: InsertBookmark): Promise<Bookmark>;
  deleteBookmark(id: number, userId: string): Promise<void>;

  // Language Proficiency
  getLanguageProficiency(userId: string): Promise<LanguageProficiency[]>;
  getLanguageProficiencyByCode(userId: string, languageCode: string): Promise<LanguageProficiency | undefined>;
  upsertLanguageProficiency(userId: string, data: Partial<InsertLanguageProficiency>): Promise<LanguageProficiency>;
  
  // Level Test History
  createLevelTestHistory(userId: string, data: Omit<InsertLevelTestHistory, 'userId'>): Promise<LevelTestHistory>;
  
  // Proficiency Log
  createProficiencyLog(userId: string, data: Omit<InsertProficiencyLog, 'userId'>): Promise<ProficiencyLog>;
  getProficiencyLog(userId: string, languageCode: string): Promise<ProficiencyLog[]>;
  
  // Activity-based proficiency update
  updateProficiencyFromActivity(
    userId: string, 
    languageCode: string, 
    activityType: string, 
    performance: number, // 0-100
    details: string
  ): Promise<{ proficiency: LanguageProficiency; log: ProficiencyLog }>;
}

export class DatabaseStorage implements IStorage {
  // === Stats ===
  async getUserStats(userId: string): Promise<UserStats | undefined> {
    const [stats] = await db.select().from(userStats).where(eq(userStats.userId, userId));
    return stats;
  }

  async createUserStats(stats: InsertUserStats): Promise<UserStats> {
    const [newStats] = await db.insert(userStats).values(stats).returning();
    return newStats;
  }

  async updateUserXp(userId: string, amount: number): Promise<UserStats> {
    let stats = await this.getUserStats(userId);
    if (!stats) {
      stats = await this.createUserStats({ userId, xp: 0, level: 1, dailyStreak: 0 });
    }

    const newXp = stats.xp + amount;
    // Simple level up logic: Level = 1 + floor(XP / 1000)
    const newLevel = 1 + Math.floor(newXp / 1000);

    const [updated] = await db.update(userStats)
      .set({ xp: newXp, level: newLevel, lastActiveDate: new Date() })
      .where(eq(userStats.id, stats.id))
      .returning();
    
    return updated;
  }

  // === History ===
  async getHistory(userId: string): Promise<AnalysisHistoryItem[]> {
    return db.select()
      .from(analysisHistory)
      .where(eq(analysisHistory.userId, userId))
      .orderBy(desc(analysisHistory.createdAt));
  }

  async createHistory(item: InsertAnalysisHistory): Promise<AnalysisHistoryItem> {
    const [newItem] = await db.insert(analysisHistory).values(item).returning();
    return newItem;
  }

  async deleteHistory(id: number, userId: string): Promise<void> {
    await db.delete(analysisHistory)
      .where(
        and(
          eq(analysisHistory.id, id),
          eq(analysisHistory.userId, userId)
        )
      );
  }

  // === Bookmarks ===
  async getBookmarks(userId: string): Promise<Bookmark[]> {
    return db.select()
      .from(bookmarks)
      .where(eq(bookmarks.userId, userId))
      .orderBy(desc(bookmarks.createdAt));
  }

  async createBookmark(item: InsertBookmark): Promise<Bookmark> {
    const [newItem] = await db.insert(bookmarks).values(item).returning();
    return newItem;
  }

  async deleteBookmark(id: number, userId: string): Promise<void> {
    await db.delete(bookmarks).where(
      and(
        eq(bookmarks.id, id),
        eq(bookmarks.userId, userId)
      )
    );
  }

  // === Language Proficiency ===
  async getLanguageProficiency(userId: string): Promise<LanguageProficiency[]> {
    return db.select()
      .from(languageProficiency)
      .where(eq(languageProficiency.userId, userId));
  }

  async getLanguageProficiencyByCode(userId: string, languageCode: string): Promise<LanguageProficiency | undefined> {
    const [result] = await db.select()
      .from(languageProficiency)
      .where(and(
        eq(languageProficiency.userId, userId),
        eq(languageProficiency.languageCode, languageCode)
      ));
    return result;
  }

  async upsertLanguageProficiency(userId: string, data: Partial<InsertLanguageProficiency>): Promise<LanguageProficiency> {
    const existing = await this.getLanguageProficiencyByCode(userId, data.languageCode!);
    
    if (existing) {
      const [updated] = await db.update(languageProficiency)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(languageProficiency.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(languageProficiency)
        .values({ userId, ...data } as InsertLanguageProficiency)
        .returning();
      return created;
    }
  }

  // === Level Test History ===
  async createLevelTestHistory(userId: string, data: Omit<InsertLevelTestHistory, 'userId'>): Promise<LevelTestHistory> {
    const [created] = await db.insert(levelTestHistory)
      .values({ userId, ...data } as InsertLevelTestHistory)
      .returning();
    return created;
  }

  // === Proficiency Log ===
  async createProficiencyLog(userId: string, data: Omit<InsertProficiencyLog, 'userId'>): Promise<ProficiencyLog> {
    const [created] = await db.insert(proficiencyLog)
      .values({ userId, ...data } as InsertProficiencyLog)
      .returning();
    return created;
  }

  async getProficiencyLog(userId: string, languageCode: string): Promise<ProficiencyLog[]> {
    return db.select()
      .from(proficiencyLog)
      .where(and(
        eq(proficiencyLog.userId, userId),
        eq(proficiencyLog.languageCode, languageCode)
      ))
      .orderBy(desc(proficiencyLog.createdAt));
  }

  // === Activity-based Proficiency Update ===
  async updateProficiencyFromActivity(
    userId: string,
    languageCode: string,
    activityType: string,
    performance: number,
    details: string
  ): Promise<{ proficiency: LanguageProficiency; log: ProficiencyLog }> {
    // Get or create proficiency
    let proficiency = await this.getLanguageProficiencyByCode(userId, languageCode);
    
    if (!proficiency) {
      proficiency = await this.upsertLanguageProficiency(userId, {
        languageCode,
        cefrLevel: 'A1',
        score: 50,
        vocabularyScore: 50,
        grammarScore: 50,
        listeningScore: 50,
        speakingScore: 50,
        readingScore: 50
      });
    }

    const oldLevel = proficiency.cefrLevel;
    const oldScore = proficiency.score;

    // Calculate score change based on performance
    // Performance 0-100: <30% = -3~-5, 30-50% = -1~0, 50-70% = +1~+2, 70-90% = +2~+4, >90% = +4~+6
    let scoreChange = 0;
    if (performance < 30) {
      scoreChange = -Math.floor(3 + Math.random() * 3);
    } else if (performance < 50) {
      scoreChange = -Math.floor(Math.random() * 2);
    } else if (performance < 70) {
      scoreChange = Math.floor(1 + Math.random() * 2);
    } else if (performance < 90) {
      scoreChange = Math.floor(2 + Math.random() * 3);
    } else {
      scoreChange = Math.floor(4 + Math.random() * 3);
    }

    // Apply score change with bounds
    let newScore = Math.max(0, Math.min(100, oldScore + scoreChange));
    
    // Calculate new CEFR level based on score
    const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    let newLevel = oldLevel;
    
    // Level up at 85+, level down at 15-
    if (newScore >= 85 && levels.indexOf(oldLevel) < 5) {
      newLevel = levels[levels.indexOf(oldLevel) + 1];
      newScore = 50; // Reset to middle of new level
    } else if (newScore <= 15 && levels.indexOf(oldLevel) > 0) {
      newLevel = levels[levels.indexOf(oldLevel) - 1];
      newScore = 50; // Reset to middle of new level
    }

    // Update specific skill scores based on activity type
    const skillUpdates: any = {};
    if (activityType.includes('quiz') || activityType.includes('vocabulary')) {
      skillUpdates.vocabularyScore = Math.max(0, Math.min(100, (proficiency.vocabularyScore || 50) + scoreChange));
    }
    if (activityType.includes('grammar')) {
      skillUpdates.grammarScore = Math.max(0, Math.min(100, (proficiency.grammarScore || 50) + scoreChange));
    }
    if (activityType.includes('conversation') || activityType.includes('roleplay') || activityType.includes('world_tour')) {
      skillUpdates.speakingScore = Math.max(0, Math.min(100, (proficiency.speakingScore || 50) + scoreChange));
      skillUpdates.listeningScore = Math.max(0, Math.min(100, (proficiency.listeningScore || 50) + scoreChange));
    }
    if (activityType.includes('media') || activityType.includes('video')) {
      skillUpdates.readingScore = Math.max(0, Math.min(100, (proficiency.readingScore || 50) + scoreChange));
      skillUpdates.listeningScore = Math.max(0, Math.min(100, (proficiency.listeningScore || 50) + scoreChange));
    }

    // Update proficiency
    const updatedProficiency = await this.upsertLanguageProficiency(userId, {
      languageCode,
      cefrLevel: newLevel,
      score: newScore,
      ...skillUpdates
    });

    // Create log entry
    const log = await this.createProficiencyLog(userId, {
      languageCode,
      activityType,
      previousLevel: oldLevel,
      newLevel,
      scoreChange,
      reason: details
    });

    return { proficiency: updatedProficiency, log };
  }
}

export const storage = new DatabaseStorage();
