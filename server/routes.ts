import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { registerChatRoutes } from "./replit_integrations/chat/routes";
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
  registerChatRoutes(app);

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
        
        If the content is a YouTube URL, analyze the likely content of that video based on the URL/title.
        For manual text, analyze the provided text directly.
        For files, the content may be base64 encoded - try to understand and analyze it.
      `;

      let userPrompt: string;
      if (type === 'youtube') {
        userPrompt = `Analyze this YouTube video URL for language learning: ${content}`;
      } else if (type === 'file') {
        userPrompt = `Analyze this file content (${title || 'file'}) for language learning. Content: ${content.substring(0, 10000)}`;
      } else {
        userPrompt = `Analyze this text for language learning:\n\n${content}`;
      }

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

  app.post(api.stats.addXp.path, protect, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const { amount } = api.stats.addXp.input.parse(req.body);
    const stats = await storage.updateUserXp(userId, amount);
    res.json(stats);
  });

  // === History ===
  app.get(api.history.list.path, protect, async (req: any, res) => {
    const history = await storage.getHistory(req.user.claims.sub);
    res.json(history);
  });

  app.post(api.history.create.path, protect, async (req: any, res) => {
    const input = api.history.create.input.parse(req.body);
    const history = await storage.createHistory({
      ...input,
      userId: req.user.claims.sub
    });
    res.status(201).json(history);
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

  // === Grammar Lesson ===
  app.post('/api/grammar/lesson', protect, async (req: any, res) => {
    try {
      const { language, level } = req.body;
      
      const prompt = `
        Generate a grammar lesson for ${language} learners at level ${level || 1}.
        Output ONLY valid JSON matching this schema:
        {
          "topic": "Grammar concept name",
          "explanation": "Detailed explanation of the grammar rule",
          "examples": [
            {"original": "Sentence in ${language}", "translation": "English translation"}
          ],
          "exercises": [
            {"question": "Multiple choice question", "options": ["Option A", "Option B", "Option C", "Option D"], "answer": "Correct option", "explanation": "Why this is correct"}
          ]
        }
        Include 3-4 examples and 3-4 exercises.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: { responseMimeType: "application/json" }
      });

      const resultText = response.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!resultText) throw new Error("No response from AI");

      res.json(JSON.parse(resultText));
    } catch (err) {
      console.error("Grammar lesson error:", err);
      res.status(500).json({ message: "Failed to generate lesson" });
    }
  });

  // === Vocabulary Cards ===
  app.post('/api/vocabulary/cards', protect, async (req: any, res) => {
    try {
      const { language, topic, count = 10 } = req.body;
      
      const prompt = `
        Generate ${count} vocabulary flashcards for learning ${language}${topic ? ` about ${topic}` : ''}.
        Output ONLY valid JSON matching this schema:
        {
          "cards": [
            {"word": "Word in ${language}", "meaning": "English meaning", "pronunciation": "Phonetic/romanization", "example": "Example sentence"}
          ]
        }
      `;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: { responseMimeType: "application/json" }
      });

      const resultText = response.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!resultText) throw new Error("No response from AI");

      res.json(JSON.parse(resultText));
    } catch (err) {
      console.error("Vocabulary cards error:", err);
      res.status(500).json({ message: "Failed to generate vocabulary" });
    }
  });

  // === AI Chat/Tutor ===
  app.post('/api/tutor/message', protect, async (req: any, res) => {
    try {
      const { message, language, conversationHistory = [] } = req.body;
      
      const systemPrompt = `
        You are a friendly ${language} language tutor. Help the user practice ${language}.
        - Respond in ${language} with an English translation in parentheses
        - Correct any mistakes gently
        - Keep responses conversational and encouraging
        - If the user writes in English, still respond in ${language} and help them translate
      `;

      const contents = [
        { role: "user" as const, parts: [{ text: systemPrompt }] },
        ...conversationHistory.map((msg: any) => ({
          role: msg.role as "user" | "model",
          parts: [{ text: msg.content }]
        })),
        { role: "user" as const, parts: [{ text: message }] }
      ];

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents
      });

      const resultText = response.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!resultText) throw new Error("No response from AI");

      res.json({ response: resultText });
    } catch (err) {
      console.error("Tutor message error:", err);
      res.status(500).json({ message: "Failed to generate response" });
    }
  });

  // === World Tour Hint ===
  app.post('/api/world-tour/hint', protect, async (req: any, res) => {
    try {
      const { destination, mission, language, messages } = req.body;
      
      const prompt = `
        A language learner is practicing ${language} in a roleplay scenario.
        Mission: "${mission.scenario}"
        Character: ${mission.characterName} (${mission.characterRole})
        
        Recent conversation:
        ${messages.slice(-4).map((m: any) => `${m.role.toUpperCase()}: ${m.content}`).join('\n')}
        
        Generate 3 helpful phrases the learner could say next in ${language}.
        Each phrase should be natural, polite, and help complete the mission.
        
        Return ONLY valid JSON:
        {
          "hints": [
            {"text": "phrase in ${language}", "translation": "English translation"},
            {"text": "phrase in ${language}", "translation": "English translation"},
            {"text": "phrase in ${language}", "translation": "English translation"}
          ]
        }
      `;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: { responseMimeType: "application/json" }
      });

      const resultText = response.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!resultText) throw new Error("No response from AI");

      res.json(JSON.parse(resultText));
    } catch (err) {
      console.error("World tour hint error:", err);
      res.status(500).json({ 
        hints: [
          { text: "Could you help me please?", translation: "도와주시겠어요?" },
          { text: "I would like to order...", translation: "주문하고 싶은데요..." },
          { text: "Thank you very much!", translation: "정말 감사합니다!" }
        ]
      });
    }
  });

  // === World Tour Chat ===
  app.post('/api/world-tour/chat', protect, async (req: any, res) => {
    try {
      const { destination, mission, language, messages, currentHearts } = req.body;
      
      const systemPrompt = `
        You are "${mission.characterName}", a real ${mission.characterRole} living in a city where ${language} is spoken.
        
        CRITICAL: You are NOT a language teacher or tutor. You are a LOCAL PERSON with personality.
        
        YOUR PERSONALITY:
        - You're a bit impatient with tourists who don't greet properly
        - You appreciate when people TRY to speak ${language}, even with mistakes
        - You DON'T correct grammar. Instead, if confused, say things like "Pardon?" or "Sorry, what?"
        - If someone is rude (no greeting, demanding tone), you get visibly annoyed
        - You're helpful to polite customers
        
        RESPONSE RULES:
        1. Respond primarily in ${language} with brief English translations in parentheses
        2. Stay in character - you're working, you have other customers
        3. NEVER explain grammar or say "you should say X instead"
        4. React naturally: confused? Ask them to repeat. Rude? Show displeasure.
        5. Keep responses SHORT (1-2 sentences) like real conversations
        
        PENALTY SYSTEM:
        - If the user says something RUDE or INAPPROPRIATE (no greeting, demanding, offensive):
          Add [HEART_PENALTY:-1] at the END of your response
        - Examples of rude: "Give me coffee", "Hey you!", skipping greetings, being dismissive
        - NOT rude: grammar mistakes, wrong words, mixing languages (these are just confusing, not rude)
        
        Current situation: "${mission.scenario}"
        
        Remember: You're a real person, not a robot or teacher. Act naturally!
      `;

      const contents = [
        { role: "user" as const, parts: [{ text: systemPrompt }] },
        ...messages.map((msg: any) => ({
          role: msg.role === 'npc' ? 'model' as const : 'user' as const,
          parts: [{ text: msg.content }]
        }))
      ];

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents
      });

      let resultText = response.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!resultText) throw new Error("No response from AI");

      let heartsChange = 0;
      if (resultText.includes('[HEART_PENALTY:-1]')) {
        heartsChange = -1;
        resultText = resultText.replace('[HEART_PENALTY:-1]', '').trim();
      }

      res.json({ response: resultText, heartsChange });
    } catch (err) {
      console.error("World tour chat error:", err);
      res.status(500).json({ message: "Failed to generate response" });
    }
  });

  // === World Tour Evaluate Mission ===
  app.post('/api/world-tour/evaluate', protect, async (req: any, res) => {
    try {
      const { destination, mission, messages, heartsRemaining } = req.body;
      
      const prompt = `
        Evaluate this language learning roleplay conversation.
        
        MISSION: "${mission.scenario}"
        OBJECTIVES: ${mission.objectives.map((o: string, i: number) => `${i + 1}. ${o}`).join('\n')}
        CHARACTER: ${mission.characterName} (${mission.characterRole})
        
        CONVERSATION:
        ${messages.map((m: any) => `${m.role.toUpperCase()}: ${m.content}`).join('\n')}
        
        HEARTS REMAINING: ${heartsRemaining}/5
        
        Evaluate and return ONLY valid JSON:
        {
          "success": true/false (did they complete the main mission objective?),
          "objectivesCompleted": [true/false for each objective],
          "feedback": "Brief encouraging feedback about their performance"
        }
        
        Be generous in evaluation - if they made a genuine attempt at the mission objectives, count it as success.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: { responseMimeType: "application/json" }
      });

      const resultText = response.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!resultText) throw new Error("No response from AI");

      const result = JSON.parse(resultText);
      
      if (result.success) {
        const userId = req.user.claims.sub;
        await storage.updateUserXp(userId, 100);
      }

      res.json(result);
    } catch (err) {
      console.error("World tour evaluation error:", err);
      res.status(500).json({ 
        success: false, 
        objectivesCompleted: [],
        feedback: "Unable to evaluate. Please try again." 
      });
    }
  });

  return httpServer;
}
