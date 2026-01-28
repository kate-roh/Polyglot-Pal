import { GoogleGenAI, Type, Modality } from '@google/genai';
import { Character, Destination, Message, AnalysisResult, LevelTestQuestion, LevelTestResult, GrammarLesson } from '../lib/types';

export class GeminiService {
  private aiInstance: GoogleGenAI | null = null;
  private audioCtx: AudioContext | null = null;

  private get ai() {
    if (!this.aiInstance) {
      // Use VITE_GEMINI_API_KEY if available (from vite env), or fall back to empty string
      // Note: In production, it's safer to proxy through backend
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || ''; 
      if (!apiKey) console.warn("VITE_GEMINI_API_KEY missing. Some features may not work if not using backend proxy.");
      this.aiInstance = new GoogleGenAI({ apiKey });
    }
    return this.aiInstance;
  }

  // 더욱 강력해진 Safe JSON 파싱
  private safeParse(text: string, defaultValue: any = {}): any {
    try {
      if (!text) return defaultValue;
      // 마크다운 블록 제거
      const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
      
      // JSON 객체 또는 배열의 시작과 끝을 찾아 추출
      const startBrace = cleaned.indexOf('{');
      const startBracket = cleaned.indexOf('[');
      const endBrace = cleaned.lastIndexOf('}');
      const endBracket = cleaned.lastIndexOf(']');

      let jsonStr = cleaned;
      if (startBrace !== -1 && endBrace !== -1 && (startBracket === -1 || startBrace < startBracket)) {
        jsonStr = cleaned.substring(startBrace, endBrace + 1);
      } else if (startBracket !== -1 && endBracket !== -1) {
        jsonStr = cleaned.substring(startBracket, endBracket + 1);
      }
      
      const parsed = JSON.parse(jsonStr);
      // 필수 필드 체크 및 보정
      if (Array.isArray(defaultValue) && !Array.isArray(parsed)) return defaultValue;
      return parsed;
    } catch (e) {
      console.warn("JSON 파싱 에러 - 원본 텍스트:", text);
      return defaultValue;
    }
  }

  async unlockAudio() {
    try {
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      if (this.audioCtx.state === 'suspended') await this.audioCtx.resume();
      return true;
    } catch (e) { return false; }
  }

  async analyzeMedia(input: { type: 'youtube' | 'file' | 'manual', content: string, mimeType?: string, title?: string }): Promise<AnalysisResult> {
    const isYoutube = input.type === 'youtube';
    
    const sysPrompt = `You are a professional linguistic analyzer. Analyze the provided media content.
    Return ONLY a raw JSON object. NO MARKDOWN formatting.
    
    Structure Required:
    {
      "summary": "Korean summary (3-4 sentences)",
      "cefrLevel": "A1-C2",
      "script": [{
        "speaker": "Name",
        "text": "Original line",
        "translation": "Korean translation",
        "timestamp": "MM:SS",
        "seconds": integer,
        "vocabulary": [{"word": "string", "meaning": "string"}],
        "idioms": [{"phrase": "string", "meaning": "string"}]
      }],
      "notes": [{"title": "Concept", "content": "Explanation"}]
    }`;

    try {
      const config: any = { 
        responseMimeType: 'application/json',
        temperature: 0.1 
      };

      // 유튜브 링크인 경우 실제 검색을 통해 정보를 가져오도록 도구 추가
      if (isYoutube) {
        config.tools = [{ googleSearch: {} }];
      }

      let contents;
      if (input.type === 'file' && input.mimeType) {
        contents = {
          parts: [
            { inlineData: { data: input.content, mimeType: input.mimeType } },
            { text: sysPrompt }
          ]
        };
      } else if (isYoutube) {
        contents = `Search for this YouTube video and analyze its content/transcript: ${input.content}\n\nTask: ${sysPrompt}`;
      } else {
        contents = `${sysPrompt}\n\nContent to analyze: "${input.content}"`;
      }

      const response = await this.ai.models.generateContent({
        model: isYoutube ? 'gemini-2.0-flash-exp' : 'gemini-2.0-flash-exp', // Fallback to available model
        contents,
        config
      });

      const parsed = this.safeParse(response.text || '{}', {});
      
      // 데이터 누락 시 기본값 보정 (렌더링 에러 방지)
      const finalResult: AnalysisResult = {
        id: Date.now().toString(),
        title: input.title || (isYoutube ? 'YouTube Analysis' : 'Media Session'),
        date: new Date().toISOString(),
        type: input.type,
        source: input.content,
        summary: parsed.summary || '분석 결과를 요약할 수 없습니다.',
        cefrLevel: parsed.cefrLevel || 'Unknown',
        script: Array.isArray(parsed.script) ? parsed.script : [],
        vocabulary: [],
        idioms: [],
        notes: Array.isArray(parsed.notes) ? parsed.notes : [],
        keySentences: [],
        quiz: []
      };

      return finalResult;
    } catch (e) {
      console.error("Analysis Failure:", e);
      throw new Error("AI 분석 서버와의 연결이 원활하지 않습니다.");
    }
  }

  async speak(text: string, langCode: string = 'en') {
    try {
      if (!this.audioCtx) await this.unlockAudio();
      // NOTE: Client-side TTS with Gemini requires permissions and model access
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.0-flash-exp', // Fallback model
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } }
        }
      });
      const base64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64 && this.audioCtx) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const dataInt16 = new Int16Array(bytes.buffer);
        const buffer = this.audioCtx.createBuffer(1, dataInt16.length, 24000);
        const channelData = buffer.getChannelData(0);
        for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
        const source = this.audioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(this.audioCtx.destination);
        source.start();
      }
    } catch (e) {}
  }

  async chat(destination: Destination, character: Character, history: Message[], input: string, politeness: number, weather?: any): Promise<{ content: string }> {
    const weatherInfo = weather ? `Environment: ${weather.condition}, ${weather.temp}°C. Tip: ${weather.tip}` : "";
    const response = await this.ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: [
        ...history.slice(-8).map(m => ({ role: m.role, parts: [{ text: m.content }] })),
        { role: 'user', parts: [{ text: input }] }
      ],
      config: {
        systemInstruction: `You are ${character.name} in ${destination.city}. Personality: ${character.personality}. Kindness: ${character.kindness}/10. ${weatherInfo}. Politeness of user: ${politeness}/10. Respond ONLY in ${destination.language.name}. Be as immersive as possible.`,
      }
    });
    return { content: response.text || "" };
  }

  async generateGrammarLesson(langName: string, level: number, topic?: string): Promise<GrammarLesson> {
    const response = await this.ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: `Generate grammar lesson for ${langName} level ${level}. Topic: ${topic || 'Essential Grammar'}.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING },
            explanation: { type: Type.STRING },
            examples: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { original: { type: Type.STRING }, translation: { type: Type.STRING } }, required: ["original", "translation"] } },
            exercises: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { question: { type: Type.STRING }, options: { type: Type.ARRAY, items: { type: Type.STRING } }, answer: { type: Type.STRING }, explanation: { type: Type.STRING } }, required: ["question", "options", "answer", "explanation"] } }
          },
          required: ["topic", "explanation", "examples", "exercises"]
        }
      }
    });
    return this.safeParse(response.text || '{}', { topic: "", explanation: "", examples: [], exercises: [] });
  }

  async generateLevelTest(langName: string): Promise<LevelTestQuestion[]> {
    const response = await this.ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: `Generate 5 level test questions for ${langName}.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: { id: { type: Type.INTEGER }, type: { type: Type.STRING }, question: { type: Type.STRING }, options: { type: Type.ARRAY, items: { type: Type.STRING } }, correctAnswer: { type: Type.STRING }, audioText: { type: Type.STRING } },
            required: ["id", "type", "question"]
          }
        }
      }
    });
    return this.safeParse(response.text || '[]', []);
  }

  async analyzeLevelTest(langName: string, answers: any[]): Promise<LevelTestResult> {
    const response = await this.ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: `Analyze language test: ${JSON.stringify(answers)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: { score: { type: Type.NUMBER }, proficiency: { type: Type.STRING }, strengths: { type: Type.ARRAY, items: { type: Type.STRING } }, weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } }, summary: { type: Type.STRING }, recommendedLevel: { type: Type.NUMBER } },
          required: ["score", "proficiency", "summary", "recommendedLevel"]
        }
      }
    });
    return this.safeParse(response.text || '{}', { score: 0, proficiency: 'A1', strengths: [], weaknesses: [], summary: "", recommendedLevel: 1 });
  }

  async generateCharacter(destination: Destination, scenario: string): Promise<Character> {
    const response = await this.ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: `Create character for ${destination.city} roleplay. Scenario: ${scenario}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: { name: { type: Type.STRING }, gender: { type: Type.STRING }, personality: { type: Type.STRING }, kindness: { type: Type.NUMBER }, mood: { type: Type.STRING } },
          required: ["name", "gender", "personality", "kindness", "mood"]
        }
      }
    });
    return this.safeParse(response.text || '{}', { name: "Local", gender: "Female", personality: "Friendly", kindness: 10, mood: "Happy" });
  }

  async evaluateShadowing(original: string, recording: string): Promise<{ score: number; feedback: string }> {
    const response = await this.ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: `Evaluate shadowing: Original: "${original}", User: "${recording}".`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: { score: { type: Type.NUMBER }, feedback: { type: Type.STRING } },
          required: ["score", "feedback"]
        }
      }
    });
    return this.safeParse(response.text || '{}', { score: 0, feedback: "" });
  }
}
