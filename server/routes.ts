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

  // === Video Analysis Endpoint (YouTube, TikTok, Instagram) ===
  app.post('/api/video/analyze', protect, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { url, languageCode } = req.body;
      if (!url) {
        return res.status(400).json({ message: "Video URL required" });
      }

      // Get user's CEFR level
      let cefrLevel = 'A1';
      if (userId && languageCode) {
        const proficiency = await storage.getLanguageProficiencyByCode(userId, languageCode);
        if (proficiency) {
          cefrLevel = proficiency.cefrLevel;
        }
      }

      // Detect platform and extract video ID
      let platform: 'youtube' | 'tiktok' | 'instagram' | 'other' = 'other';
      let videoId = '';

      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        platform = 'youtube';
        const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([^&\s?]+)/);
        videoId = match?.[1] || '';
      } else if (url.includes('tiktok.com')) {
        platform = 'tiktok';
        const match = url.match(/\/video\/(\d+)|\/v\/(\d+)/);
        videoId = match?.[1] || match?.[2] || url;
      } else if (url.includes('instagram.com')) {
        platform = 'instagram';
        const match = url.match(/\/(reel|p)\/([A-Za-z0-9_-]+)/);
        videoId = match?.[2] || url;
      }

      // CEFR level guidance for content complexity
      const levelGuidance = {
        'A1': 'Focus on basic vocabulary (100-500 most common words). Use very simple sentences. Provide detailed translations and explanations.',
        'A2': 'Use simple, everyday vocabulary. Sentences can have basic connectors (and, but, because). Include common phrases.',
        'B1': 'Include moderate vocabulary and idioms. Explanations can be more concise. Introduce some grammar patterns.',
        'B2': 'Use varied vocabulary including less common words. Include cultural references and nuanced expressions.',
        'C1': 'Include advanced vocabulary, idioms, and complex structures. Minimal hand-holding in explanations.',
        'C2': 'Native-level complexity. Focus on subtle nuances, rare expressions, and cultural depth.'
      };

      // For TikTok/Instagram, we can't access the actual content
      // So we create learning material about common topics for these platforms
      const platformNote = platform === 'youtube' 
        ? `This is a YouTube video. Try to infer content from the video ID: ${videoId}`
        : `IMPORTANT: You cannot access ${platform} video content directly. Create realistic learning material about a common topic for ${platform} (like daily life, travel, food, trends, fashion, etc). Make it educational and practical for learners. Do NOT pretend to have watched the actual video - instead create ORIGINAL content suitable for language learning.`;

      const videoPrompt = `
        You are an expert English language tutor helping Korean learners. 
        Create a comprehensive language learning experience.
        
        Platform: ${platform}
        ${platformNote}
        
        USER'S CEFR LEVEL: ${cefrLevel}
        CONTENT ADJUSTMENT: ${levelGuidance[cefrLevel as keyof typeof levelGuidance] || levelGuidance['A1']}
        
        Output ONLY valid JSON matching this EXACT schema:
        {
          "platform": "${platform}",
          "videoId": "${videoId || 'generated'}",
          "videoUrl": "${url}",
          "videoTitle": "${platform !== 'youtube' ? 'AI 생성 영어 학습 콘텐츠' : 'Title/description of the video content'}",
          "isAIGenerated": ${platform !== 'youtube'},
          "summary": "2-3 sentence learning overview in Korean explaining what learners will gain from this video",
          "segments": [
            {
              "timestamp": "00:05",
              "timestampSeconds": 5,
              "sentence": "Original English sentence spoken in the video",
              "translation": "Korean translation of the sentence",
              "expressionNote": "Explanation of a key expression in Korean, e.g., \"'Seen in years'는 '수년 동안 본 것 중'이라는 의미로, 오랜만이라는 뉘앙스를 줍니다.\"",
              "vocabulary": [{"word": "example", "meaning": "예시"}],
              "phrases": [{"phrase": "for example", "meaning": "예를 들어"}]
            }
          ],
          "roleplayMission": {
            "scenario": "Scenario description in Korean related to the video topic",
            "yourRole": "Your role description",
            "npcRole": "NPC role description", 
            "objective": "Mission objective",
            "starterPrompt": "Starting prompt for the roleplay"
          },
          "quizQuestions": [
            {
              "question": "Quiz question in Korean about the video content",
              "options": ["Option A", "Option B", "Option C", "Option D"],
              "correctIndex": 0,
              "explanation": "Explanation of the correct answer in Korean"
            }
          ],
          "conversationPractice": [
            {"speaker": "A", "line": "English line", "translation": "Korean translation"},
            {"speaker": "B", "line": "Response line", "translation": "Korean translation"}
          ]
        }
        
        REQUIREMENTS:
        1. For ${platform === 'tiktok' || platform === 'instagram' ? 'short videos (15-60 seconds), create 3-6 segments with timestamps every 5-15 seconds' : 'longer videos, create 5-10 segments with timestamps every 30-60 seconds'}
        2. Each segment should have an interesting English sentence with Korean translation
        3. Include expressionNote for key phrases/idioms with detailed Korean explanation
        4. Extract 1-2 vocabulary words per segment (single words only)
        5. Extract 1-2 phrases per segment (multi-word expressions like idioms, collocations)
        6. Create 1 roleplay mission related to the video topic
        7. Create 3-5 quiz questions testing comprehension
        8. Create a 6-8 line conversation practice dialogue
      `;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          { role: "user", parts: [{ text: videoPrompt }] }
        ],
        config: {
          responseMimeType: "application/json"
        }
      });

      const resultText = response.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!resultText) throw new Error("No response from AI");

      const analysisResult = JSON.parse(resultText);
      
      // Add CEFR level to response
      analysisResult.userCefrLevel = cefrLevel;

      // Auto-save to history with actual platform type
      const historyUserId = req.user.claims.sub;
      await storage.createHistory({
        userId: historyUserId,
        type: platform, // Store actual platform (youtube, tiktok, instagram, other)
        title: analysisResult.videoTitle || `${platform} Session`,
        originalContent: url,
        result: analysisResult
      });

      // Award XP
      await storage.updateUserXp(historyUserId, 75);
      
      // Update CEFR proficiency - video analysis counts as reading/listening practice
      let proficiencyUpdate = null;
      if (historyUserId && languageCode) {
        const updateResult = await storage.updateProficiencyFromActivity(
          historyUserId,
          languageCode,
          'media_video_analysis',
          70, // Default performance for completing video analysis
          `Analyzed ${platform} video: ${analysisResult.videoTitle?.substring(0, 50) || 'Video'}...`
        );
        proficiencyUpdate = {
          newLevel: updateResult.proficiency.cefrLevel,
          newScore: updateResult.proficiency.cefrScore,
          scoreChange: updateResult.log.scoreChange
        };
      }

      res.json({ ...analysisResult, proficiencyUpdate });

    } catch (err) {
      console.error("Video Analysis Error:", err);
      res.status(500).json({ message: "Analysis failed", error: String(err) });
    }
  });

  // === TTS Endpoint (OpenAI) ===
  app.post('/api/tts', protect, async (req: any, res) => {
    try {
      const { text, voice = 'alloy' } = req.body;
      if (!text) {
        return res.status(400).json({ message: "Text required" });
      }

      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.AI_INTEGRATIONS_OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'tts-1',
          input: text.substring(0, 4096),
          voice: voice,
          response_format: 'mp3'
        })
      });

      if (!response.ok) {
        throw new Error(`TTS API error: ${response.status}`);
      }

      const audioBuffer = await response.arrayBuffer();
      res.set('Content-Type', 'audio/mpeg');
      res.send(Buffer.from(audioBuffer));

    } catch (err) {
      console.error("TTS Error:", err);
      res.status(500).json({ message: "TTS failed" });
    }
  });

  // === Media Analysis Endpoint (for file and manual) ===
  app.post(api.media.analyze.path, protect, async (req: any, res) => {
    try {
      const { type, content, title, mimeType } = api.media.analyze.input.parse(req.body);
      
      let textContent = content;
      
      // Check if file is audio/video and needs transcription first
      let transcriptionSegments: { id: number; start: number; end: number; text: string }[] = [];
      
      if (type === 'file' && mimeType) {
        const isAudioVideo = mimeType.startsWith('audio/') || mimeType.startsWith('video/');
        
        if (isAudioVideo) {
          try {
            console.log(`Transcribing ${mimeType} file: ${title}`);
            console.log(`Content length: ${content.length} chars`);
            
            const { speechToTextWithTimestamps, ensureCompatibleFormat, detectAudioFormat } = await import('./replit_integrations/audio/client');
            
            // Convert base64 to buffer
            const rawBuffer = Buffer.from(content, "base64");
            console.log(`Buffer size: ${rawBuffer.length} bytes`);
            
            // Detect format
            const detectedFormat = detectAudioFormat(rawBuffer);
            console.log(`Detected format: ${detectedFormat}`);
            
            const { buffer: audioBuffer, format: inputFormat } = await ensureCompatibleFormat(rawBuffer);
            console.log(`Converted to ${inputFormat}, size: ${audioBuffer.length} bytes`);
            
            // Transcribe audio to text WITH TIMESTAMPS
            const { text: transcript, segments } = await speechToTextWithTimestamps(audioBuffer, inputFormat);
            
            if (!transcript || transcript.trim().length === 0) {
              return res.status(400).json({ 
                message: "음성을 인식할 수 없습니다. 파일에 음성이 포함되어 있는지 확인해주세요." 
              });
            }
            
            textContent = transcript;
            transcriptionSegments = segments;
            console.log(`Transcription successful with ${segments.length} segments: ${transcript.substring(0, 100)}...`);
          } catch (transcribeErr: any) {
            console.error("Transcription error:", transcribeErr);
            console.error("Error stack:", transcribeErr?.stack);
            return res.status(400).json({ 
              message: "오디오/비디오 변환 실패. 다른 형식의 파일을 시도해주세요.",
              error: String(transcribeErr)
            });
          }
        }
      }
      
      // Check if this is an audio/video file with segments
      const isAudioVideoWithSegments = type === 'file' && mimeType && 
        (mimeType.startsWith('audio/') || mimeType.startsWith('video/')) && 
        transcriptionSegments.length > 0;
      
      let analysisResult: any;
      
      if (isAudioVideoWithSegments) {
        // For audio/video files: analyze each segment with timestamp
        const segmentPrompt = `
You are an expert language tutor. Analyze each sentence segment and provide learning materials.
Output ONLY valid JSON matching this schema:
{
  "summary": "Brief summary of the content",
  "cefrLevel": "A1|A2|B1|B2|C1|C2",
  "cefrExplanation": "Why this content is rated at this CEFR level",
  "segments": [
    {
      "timestamp": "MM:SS",
      "timestampSeconds": 0,
      "sentence": "original sentence",
      "translation": "Korean translation",
      "expressionNote": "explanation of idioms/expressions used in Korean",
      "vocabulary": [{"word": "single word", "meaning": "Korean meaning"}],
      "phrases": [{"phrase": "expression/idiom", "meaning": "Korean meaning"}]
    }
  ],
  "grammar": [{"point": "grammar concept", "explanation": "explanation in Korean", "example": "example sentence"}],
  "culturalNotes": ["cultural context notes in Korean"]
}

IMPORTANT:
- Assess the CEFR level (A1-C2) based on vocabulary complexity, grammar structures, and content difficulty
- Each segment should have its own timestamp, sentence, translation, and extracted vocabulary/phrases
- "vocabulary" contains SINGLE WORDS only
- "phrases" contains MULTI-WORD EXPRESSIONS (idioms, collocations, phrasal verbs)
- All translations and explanations should be in Korean
`;

        // Helper to format seconds to MM:SS
        const formatTS = (seconds: number) => {
          const mins = Math.floor(seconds / 60);
          const secs = Math.floor(seconds % 60);
          return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        };
        
        const segmentsData = transcriptionSegments.map(seg => ({
          timestamp: formatTS(seg.start),
          timestampSeconds: seg.start,
          sentence: seg.text
        }));

        const userPrompt = `Analyze these transcribed audio segments for language learning. Each segment has a timestamp:

${JSON.stringify(segmentsData, null, 2)}`;

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [
            { role: "user", parts: [{ text: segmentPrompt }, { text: userPrompt }] }
          ],
          config: {
            responseMimeType: "application/json"
          }
        });

        const resultText = response.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!resultText) throw new Error("No response from AI");

        analysisResult = JSON.parse(resultText);
        analysisResult.isVideoAnalysis = true; // Mark as video-style analysis
        
      } else {
        // Standard text analysis
        const systemPrompt = `
          You are an expert language tutor. Analyze the provided content and extract learning materials.
          Output ONLY valid JSON matching this schema:
          {
            "summary": "Brief summary of the content",
            "vocabulary": [{"word": "single word", "meaning": "definition", "example": "example sentence"}],
            "phrases": [{"phrase": "useful expression/idiom like 'get it right', 'in a row', 'start to begin'", "meaning": "what it means", "usage": "example usage in context"}],
            "grammar": [{"point": "grammar concept", "explanation": "explanation", "example": "example sentence"}],
            "keySentences": [{"sentence": "full sentence from content", "translation": "translation", "nuance": "context/nuance"}],
            "culturalNotes": ["cultural context notes"]
          }
          
          IMPORTANT: 
          - "vocabulary" should only contain SINGLE WORDS
          - "phrases" should contain MULTI-WORD EXPRESSIONS like idioms, collocations, phrasal verbs (e.g., "get it right", "in quick succession", "take a look at")
        `;

        let userPrompt: string;
        if (type === 'file') {
          userPrompt = `Analyze this file content (${title || 'file'}) for language learning. Content: ${textContent.substring(0, 10000)}`;
        } else {
          userPrompt = `Analyze this text for language learning:\n\n${textContent}`;
        }

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

        analysisResult = JSON.parse(resultText);
      }

      // Auto-save to history
      const userId = req.user.claims.sub;
      await storage.createHistory({
        userId,
        type,
        title: title || "Untitled Analysis",
        originalContent: undefined,
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
      const userId = req.user?.id;
      const { destination, mission, language, messages, currentHearts, languageCode } = req.body;
      
      // Get user's CEFR level for the language
      let cefrLevel = 'A1';
      if (userId && languageCode) {
        const proficiency = await storage.getLanguageProficiencyByCode(userId, languageCode);
        if (proficiency) {
          cefrLevel = proficiency.cefrLevel;
        }
      }
      
      // Adjust language complexity based on CEFR level
      const levelGuidance = {
        'A1': 'Use VERY simple words and SHORT sentences (3-5 words). Speak slowly. Use basic vocabulary only. Example: "Hello! Coffee?" "Yes, one please."',
        'A2': 'Use simple sentences with basic connectors (and, but, because). Keep vocabulary common and everyday. Example: "Good morning! Would you like a coffee? It\'s fresh today."',
        'B1': 'Use complete sentences with moderate complexity. Include some idioms and colloquial expressions. Can discuss familiar topics naturally.',
        'B2': 'Use natural, fluent speech with varied vocabulary. Include cultural expressions and subtle nuances. Speak at normal pace.',
        'C1': 'Use sophisticated language with complex structures. Include idioms, slang, and cultural references freely. Challenge the learner naturally.',
        'C2': 'Use native-level complexity including rare words, cultural subtleties, and implicit meanings. No simplification needed.'
      };
      
      const systemPrompt = `
        You are "${mission.characterName}", a real ${mission.characterRole} living in a city where ${language} is spoken.
        
        CRITICAL: You are NOT a language teacher or tutor. You are a LOCAL PERSON with personality.
        
        USER'S LANGUAGE LEVEL: ${cefrLevel} (CEFR scale)
        LANGUAGE ADJUSTMENT: ${levelGuidance[cefrLevel as keyof typeof levelGuidance] || levelGuidance['A1']}
        
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
        6. IMPORTANT: Adjust your language complexity to match the user's ${cefrLevel} level
        
        PENALTY SYSTEM:
        - If the user says something RUDE or INAPPROPRIATE (no greeting, demanding, offensive):
          Add [HEART_PENALTY:-1] at the END of your response
        - Examples of rude: "Give me coffee", "Hey you!", skipping greetings, being dismissive
        - NOT rude: grammar mistakes, wrong words, mixing languages (these are just confusing, not rude)
        
        Current situation: "${mission.scenario}"
        
        Remember: You're a real person, not a robot or teacher. Act naturally at ${cefrLevel} level!
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
      const userId = req.user?.id;
      const { destination, mission, messages, heartsRemaining, languageCode } = req.body;
      
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
          "feedback": "Brief encouraging feedback about their performance",
          "performanceScore": 0-100 (overall language performance quality)
        }
        
        Performance scoring guide:
        - 90-100: Excellent communication, polite, achieved all objectives fluently
        - 70-89: Good attempt, minor mistakes but understood
        - 50-69: Basic communication achieved with some difficulty
        - 30-49: Struggled but tried, partial success
        - 0-29: Failed to communicate effectively
        
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
      
      // Update XP
      if (result.success) {
        await storage.updateUserXp(userId, 100);
      }
      
      // Update CEFR proficiency based on performance
      let proficiencyUpdate = null;
      if (userId && languageCode) {
        const performance = result.performanceScore || (result.success ? 75 : 40);
        const updateResult = await storage.updateProficiencyFromActivity(
          userId,
          languageCode,
          'world_tour_roleplay',
          performance,
          `World Tour mission in ${destination?.city || 'city'}: ${mission.scenario.substring(0, 50)}...`
        );
        proficiencyUpdate = {
          newLevel: updateResult.proficiency.cefrLevel,
          newScore: updateResult.proficiency.cefrScore,
          scoreChange: updateResult.log.scoreChange
        };
      }

      res.json({ ...result, proficiencyUpdate });
    } catch (err) {
      console.error("World tour evaluation error:", err);
      res.status(500).json({ 
        success: false, 
        objectivesCompleted: [],
        feedback: "Unable to evaluate. Please try again." 
      });
    }
  });

  // === World Tour Voice (TTS) ===
  app.post('/api/world-tour/tts', protect, async (req: any, res) => {
    try {
      const { text, language } = req.body;
      
      // Use OpenAI for TTS
      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({
        apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
        baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      });

      // Get appropriate voice based on language
      const voiceMap: Record<string, string> = {
        'French': 'nova',
        'Spanish': 'nova',
        'Japanese': 'nova',
        'Korean': 'nova',
        'German': 'alloy',
        'Italian': 'nova',
        'Portuguese': 'nova',
        'Mandarin': 'nova',
        'English': 'alloy'
      };
      const voice = voiceMap[language] || 'alloy';

      const response = await openai.chat.completions.create({
        model: "gpt-audio",
        modalities: ["text", "audio"],
        audio: { voice: voice as any, format: "mp3" },
        messages: [
          { role: "system", content: "You are a text-to-speech assistant. Repeat the following text exactly as given, with natural pronunciation." },
          { role: "user", content: `Say this naturally: ${text}` }
        ]
      });

      const audioData = (response.choices[0]?.message as any)?.audio?.data ?? "";
      
      if (!audioData) {
        return res.status(500).json({ error: "No audio generated" });
      }

      res.json({ audio: audioData });
    } catch (err) {
      console.error("World tour TTS error:", err);
      res.status(500).json({ error: "Failed to generate speech" });
    }
  });

  // === World Tour Voice (STT) ===
  app.post('/api/world-tour/stt', protect, async (req: any, res) => {
    try {
      const { audio } = req.body;
      
      if (!audio) {
        return res.status(400).json({ error: "Audio data required" });
      }

      const { speechToText, ensureCompatibleFormat } = await import('./replit_integrations/audio/client');
      
      const rawBuffer = Buffer.from(audio, "base64");
      const { buffer: audioBuffer, format: inputFormat } = await ensureCompatibleFormat(rawBuffer);
      
      const transcript = await speechToText(audioBuffer, inputFormat);
      
      res.json({ transcript });
    } catch (err) {
      console.error("World tour STT error:", err);
      res.status(500).json({ error: "Failed to transcribe audio" });
    }
  });

  // === Level Test Endpoints ===
  
  // Get user's language proficiency
  app.get('/api/proficiency', protect, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const proficiencies = await storage.getLanguageProficiency(userId);
      res.json(proficiencies);
    } catch (err) {
      console.error("Get proficiency error:", err);
      res.status(500).json({ error: "Failed to get proficiency" });
    }
  });

  // Get proficiency for specific language
  app.get('/api/proficiency/:languageCode', protect, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { languageCode } = req.params;
      const proficiency = await storage.getLanguageProficiencyByCode(userId, languageCode);
      res.json(proficiency || { cefrLevel: 'A1', cefrScore: 0 });
    } catch (err) {
      console.error("Get language proficiency error:", err);
      res.status(500).json({ error: "Failed to get language proficiency" });
    }
  });

  // Generate level test questions
  app.post('/api/level-test/generate', protect, async (req: any, res) => {
    try {
      const { languageCode, languageName, currentLevel } = req.body;
      
      const prompt = `
        You are a language proficiency test generator using CEFR standards.
        Create a comprehensive level test for ${languageName} (${languageCode}) language learners.
        ${currentLevel ? `Current estimated level: ${currentLevel}` : 'This is an initial placement test.'}
        
        Generate 15 questions that cover:
        - Vocabulary (5 questions)
        - Grammar (5 questions)
        - Reading comprehension (3 questions)
        - Situational/Practical usage (2 questions)
        
        Questions should range from A1 to C2 difficulty to accurately place the learner.
        
        Output ONLY valid JSON matching this schema:
        {
          "questions": [
            {
              "id": 1,
              "type": "vocabulary" | "grammar" | "reading" | "situational",
              "difficulty": "A1" | "A2" | "B1" | "B2" | "C1" | "C2",
              "question": "Question text in ${languageName}",
              "questionKo": "Question translated to Korean for the learner",
              "options": ["Option A", "Option B", "Option C", "Option D"],
              "correctAnswer": 0,
              "explanation": "Why this answer is correct (in Korean)",
              "skillTested": "Brief description of what skill this tests"
            }
          ]
        }
      `;

      const result = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt
      });

      const responseText = result.text || "";
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Failed to parse test questions");
      }

      const testData = JSON.parse(jsonMatch[0]);
      res.json(testData);
    } catch (err) {
      console.error("Generate level test error:", err);
      res.status(500).json({ error: "Failed to generate level test" });
    }
  });

  // Submit level test and get result
  app.post('/api/level-test/submit', protect, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { languageCode, languageName, answers, questions, testType = 'initial' } = req.body;
      
      // Calculate score
      let correctCount = 0;
      const difficultyScores: Record<string, { correct: number; total: number }> = {};
      
      questions.forEach((q: any, idx: number) => {
        const userAnswer = answers[idx];
        const isCorrect = userAnswer === q.correctAnswer;
        
        if (!difficultyScores[q.difficulty]) {
          difficultyScores[q.difficulty] = { correct: 0, total: 0 };
        }
        difficultyScores[q.difficulty].total++;
        
        if (isCorrect) {
          correctCount++;
          difficultyScores[q.difficulty].correct++;
        }
      });

      // Determine CEFR level based on performance at each difficulty
      const cefrLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
      let determinedLevel = 'A1';
      let cefrScore = 0;

      for (const level of cefrLevels) {
        const levelData = difficultyScores[level];
        if (levelData && levelData.correct / levelData.total >= 0.6) {
          determinedLevel = level;
          cefrScore = Math.round((correctCount / questions.length) * 100);
        } else {
          break;
        }
      }

      // Get previous proficiency
      const previousProficiency = await storage.getLanguageProficiencyByCode(userId, languageCode);
      const previousLevel = previousProficiency?.cefrLevel || null;
      const previousScore = previousProficiency?.cefrScore || 0;

      // Update or create proficiency
      await storage.upsertLanguageProficiency(userId, {
        languageCode,
        cefrLevel: determinedLevel,
        cefrScore,
        lastTestDate: new Date()
      });

      // Identify strengths and weaknesses
      const typeScores: Record<string, { correct: number; total: number }> = {};
      questions.forEach((q: any, idx: number) => {
        if (!typeScores[q.type]) {
          typeScores[q.type] = { correct: 0, total: 0 };
        }
        typeScores[q.type].total++;
        if (answers[idx] === q.correctAnswer) {
          typeScores[q.type].correct++;
        }
      });

      const strengths: string[] = [];
      const weaknesses: string[] = [];
      
      Object.entries(typeScores).forEach(([type, data]) => {
        const percentage = data.correct / data.total;
        if (percentage >= 0.7) {
          strengths.push(type);
        } else if (percentage < 0.5) {
          weaknesses.push(type);
        }
      });

      // Save test history
      await storage.createLevelTestHistory(userId, {
        languageCode,
        testType,
        previousLevel,
        newLevel: determinedLevel,
        score: correctCount,
        maxScore: questions.length,
        strengths,
        weaknesses
      });

      // Log proficiency change if level changed
      if (previousLevel !== determinedLevel || previousScore !== cefrScore) {
        await storage.createProficiencyLog(userId, {
          languageCode,
          activityType: 'level_test',
          scoreChange: cefrScore - previousScore,
          previousScore,
          newScore: cefrScore,
          previousLevel: previousLevel || 'A1',
          newLevel: determinedLevel,
          reason: testType === 'initial' ? 'Initial placement test' : 'Periodic assessment'
        });
      }

      res.json({
        cefrLevel: determinedLevel,
        cefrScore,
        correctCount,
        totalQuestions: questions.length,
        strengths,
        weaknesses,
        previousLevel,
        levelChanged: previousLevel !== determinedLevel
      });
    } catch (err) {
      console.error("Submit level test error:", err);
      res.status(500).json({ error: "Failed to submit level test" });
    }
  });

  // Update proficiency based on activity performance
  app.post('/api/proficiency/update', protect, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { languageCode, activityType, activityId, performance, reason } = req.body;
      
      // Get current proficiency
      let proficiency = await storage.getLanguageProficiencyByCode(userId, languageCode);
      
      if (!proficiency) {
        // Create initial proficiency if doesn't exist
        await storage.upsertLanguageProficiency(userId, {
          languageCode,
          cefrLevel: 'A1',
          cefrScore: 0
        });
        proficiency = await storage.getLanguageProficiencyByCode(userId, languageCode);
      }

      if (!proficiency) {
        return res.status(500).json({ error: "Failed to get/create proficiency" });
      }

      // Calculate score change based on performance
      // Performance: 0-100 scale, with 50 being neutral
      // Good performance (>70) increases score, poor (<30) decreases
      let scoreChange = 0;
      if (performance >= 80) scoreChange = 5;
      else if (performance >= 70) scoreChange = 3;
      else if (performance >= 60) scoreChange = 1;
      else if (performance < 30) scoreChange = -3;
      else if (performance < 40) scoreChange = -1;

      const previousScore = proficiency.cefrScore;
      const previousLevel = proficiency.cefrLevel;
      let newScore = Math.max(0, Math.min(100, previousScore + scoreChange));
      let newLevel = previousLevel;

      // Check for level changes
      const cefrLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
      const currentLevelIdx = cefrLevels.indexOf(previousLevel);

      if (newScore >= 100 && currentLevelIdx < cefrLevels.length - 1) {
        newLevel = cefrLevels[currentLevelIdx + 1];
        newScore = 0;
      } else if (newScore < 0 && currentLevelIdx > 0) {
        newLevel = cefrLevels[currentLevelIdx - 1];
        newScore = 80;
      }

      // Update proficiency
      await storage.upsertLanguageProficiency(userId, {
        languageCode,
        cefrLevel: newLevel,
        cefrScore: newScore
      });

      // Log the change
      if (scoreChange !== 0) {
        await storage.createProficiencyLog(userId, {
          languageCode,
          activityType,
          activityId,
          scoreChange,
          previousScore,
          newScore,
          previousLevel,
          newLevel,
          reason
        });
      }

      res.json({
        previousLevel,
        newLevel,
        previousScore,
        newScore,
        scoreChange,
        levelChanged: previousLevel !== newLevel
      });
    } catch (err) {
      console.error("Update proficiency error:", err);
      res.status(500).json({ error: "Failed to update proficiency" });
    }
  });

  // Get proficiency history
  app.get('/api/proficiency/:languageCode/history', protect, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { languageCode } = req.params;
      const history = await storage.getProficiencyLog(userId, languageCode);
      res.json(history);
    } catch (err) {
      console.error("Get proficiency history error:", err);
      res.status(500).json({ error: "Failed to get proficiency history" });
    }
  });

  return httpServer;
}
