import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { api } from "@shared/routes";
import { z } from "zod";
import { GoogleGenAI } from "@google/genai";

// Initialize Gemini
const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // 1. Setup Auth
  await setupAuth(app);
  registerAuthRoutes(app);

  // 2. Protected Routes Middleware
  const protect = isAuthenticated;

  // === Media Analysis Endpoint ===
  app.post(api.media.analyze.path, protect, async (req: any, res) => {
    try {
      const { type, content, title } = api.media.analyze.input.parse(req.body);
      
      // Construct prompt for Gemini
      const systemPrompt = `
        You are an expert language tutor. Analyze the provided content and extract learning materials.
        Output ONLY valid JSON matching this schema:
        {
          "summary": "Brief summary of the content",
          "vocabulary": [{"word": "...", "meaning": "...", "example": "..."}],
          "grammar": [{"point": "...", "explanation": "...", "example": "..."}],
          "keySentences": [{"sentence": "...", "translation": "...", "nuance": "..."}],
          "culturalNotes": ["..."]
        }
        
        If the content is a YouTube URL, analyze the likely content of that video (or if you can't access it, give a generic language lesson based on the title).
        If the content is Base64, assume it's an audio/video file transcript or just analyze the text if it's text.
      `;

      const userPrompt = `Analyze this ${type}: ${type === 'youtube' ? content : (title || 'Content')}`;

      // Call Gemini
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          { role: "user", parts: [{ text: systemPrompt }, { text: userPrompt }] }
        ],
        config: {
          responseMimeType: "application/json"
        }
      });

      const resultText = response.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!resultText) throw new Error("No response from AI");

      const analysisResult = JSON.parse(resultText);

      // Auto-save to history
      const userId = req.user.claims.sub;
      await storage.createHistory({
        userId,
        type,
        title: title || "Untitled Analysis",
        originalContent: type === 'youtube' ? content : undefined,
        result: analysisResult
      });

      // Award XP
      await storage.updateUserXp(userId, 50);

      res.json(analysisResult);

    } catch (err) {
      console.error("Analysis Error:", err);
      res.status(500).json({ message: "Analysis failed", error: String(err) });
    }
  });

  // === Stats ===
  app.get(api.stats.get.path, protect, async (req: any, res) => {
    const userId = req.user.claims.sub;
    let stats = await storage.getUserStats(userId);
    if (!stats) {
      stats = await storage.createUserStats({ userId, xp: 0, level: 1, dailyStreak: 0 });
    }
    res.json(stats);
  });

  // === History ===
  app.get(api.history.list.path, protect, async (req: any, res) => {
    const history = await storage.getHistory(req.user.claims.sub);
    res.json(history);
  });

  app.delete(api.history.delete.path, protect, async (req: any, res) => {
    await storage.deleteHistory(Number(req.params.id), req.user.claims.sub);
    res.status(204).send();
  });

  // === Bookmarks ===
  app.get(api.bookmarks.list.path, protect, async (req: any, res) => {
    const bookmarks = await storage.getBookmarks(req.user.claims.sub);
    res.json(bookmarks);
  });

  app.post(api.bookmarks.create.path, protect, async (req: any, res) => {
    const input = req.body; // Validated by Zod in real app, simplistic here
    const bookmark = await storage.createBookmark({
      ...input,
      userId: req.user.claims.sub
    });
    res.status(201).json(bookmark);
  });

  app.delete(api.bookmarks.delete.path, protect, async (req: any, res) => {
    await storage.deleteBookmark(Number(req.params.id), req.user.claims.sub);
    res.status(204).send();
  });

  return httpServer;
}
