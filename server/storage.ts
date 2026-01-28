import { db } from "./db";
import { 
  userStats, analysisHistory, bookmarks,
  type UserStats, type InsertUserStats,
  type AnalysisHistoryItem, type InsertAnalysisHistory,
  type Bookmark, type InsertBookmark
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

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
    // Ensure user owns the item
    await db.delete(analysisHistory)
      .where(
        eq(analysisHistory.id, id)
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
    await db.delete(bookmarks).where(eq(bookmarks.id, id));
  }
}

export const storage = new DatabaseStorage();
