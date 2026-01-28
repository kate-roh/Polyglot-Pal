
import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { Language, Flashcard } from '../types';

interface VocabularyProps {
  targetLanguage: Language;
}

const Vocabulary: React.FC<VocabularyProps> = ({ targetLanguage }) => {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(false);
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});
  const [currentIdx, setCurrentIdx] = useState(0);

  const fetchCards = async () => {
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate 5 useful daily phrases for learning ${targetLanguage.name}. Include the target language phrase, its English translation, and two example sentences.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                front: { type: Type.STRING },
                back: { type: Type.STRING },
                examples: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["id", "front", "back", "examples"]
            }
          }
        }
      });

      // Correctly access text property from response
      const text = response.text;
      if (text) {
        const cards = JSON.parse(text.trim());
        setFlashcards(cards);
        setCurrentIdx(0);
        setFlipped({});
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, [targetLanguage]);

  const toggleFlip = (id: string) => {
    setFlipped(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const currentCard = flashcards[currentIdx];

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-8 animate-in zoom-in-95 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Smart Flashcards</h2>
          <p className="text-slate-500 mt-1">AI-generated phrases tailored for you.</p>
        </div>
        <button 
          onClick={fetchCards}
          disabled={loading}
          className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
          title="Refresh Flashcards"
        >
          <i className={`fas fa-sync-alt ${loading ? 'fa-spin' : ''}`}></i>
        </button>
      </div>

      {loading ? (
        <div className="h-96 flex flex-col items-center justify-center gap-4 glass rounded-[40px]">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Brewing fresh language cards...</p>
        </div>
      ) : flashcards.length > 0 && currentCard ? (
        <div className="space-y-12">
          <div className="relative group cursor-pointer" style={{ perspective: '1000px' }} onClick={() => toggleFlip(currentCard.id)}>
            <div 
              className={`relative w-full h-80 transition-all duration-500 transform-gpu preserve-3d shadow-xl rounded-[40px] ${flipped[currentCard.id] ? 'rotate-y-180' : ''}`}
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* Front */}
              <div className="absolute inset-0 backface-hidden bg-white rounded-[40px] flex flex-col items-center justify-center p-12 text-center">
                <span className="text-sm font-bold uppercase tracking-widest text-indigo-500 mb-6">{targetLanguage.name}</span>
                <h3 className="text-4xl md:text-5xl font-black text-slate-800 leading-tight">
                  {currentCard.front}
                </h3>
                <div className="mt-8 flex gap-2">
                   <div className="w-2 h-2 rounded-full bg-slate-200"></div>
                   <div className="w-2 h-2 rounded-full bg-slate-200"></div>
                   <div className="w-2 h-2 rounded-full bg-slate-200"></div>
                </div>
              </div>
              
              {/* Back */}
              <div 
                className="absolute inset-0 backface-hidden bg-gradient-to-br from-indigo-600 to-purple-700 text-white rounded-[40px] flex flex-col items-center justify-center p-12 text-center rotate-y-180"
                style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
              >
                <span className="text-sm font-bold uppercase tracking-widest text-white/70 mb-6">Meaning</span>
                <h3 className="text-3xl md:text-4xl font-bold mb-8">
                  {currentCard.back}
                </h3>
                <div className="space-y-3 max-w-md">
                  {currentCard.examples.map((ex, i) => (
                    <p key={i} className="text-sm md:text-base italic text-white/80 border-l-2 border-white/20 pl-4 text-left">
                      "{ex}"
                    </p>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-white px-6 py-2 rounded-full shadow-md text-xs font-bold text-slate-400 uppercase tracking-widest">
              Click to Flip
            </div>
          </div>

          <div className="flex items-center justify-between px-4">
            <button 
              onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
              disabled={currentIdx === 0}
              className="w-14 h-14 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-30 disabled:hover:bg-white shadow-sm"
            >
              <i className="fas fa-arrow-left"></i>
            </button>
            
            <div className="flex gap-2">
              {flashcards.map((_, i) => (
                <div 
                  key={i} 
                  className={`h-2 rounded-full transition-all duration-300 ${i === currentIdx ? 'w-8 bg-indigo-600' : 'w-2 bg-slate-200'}`}
                ></div>
              ))}
            </div>

            <button 
              onClick={() => setCurrentIdx(prev => Math.min(flashcards.length - 1, prev + 1))}
              disabled={currentIdx === flashcards.length - 1}
              className="w-14 h-14 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-200 disabled:opacity-30"
            >
              <i className="fas fa-arrow-right"></i>
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-slate-500">No cards found. Try refreshing.</p>
        </div>
      )}
    </div>
  );
};

export default Vocabulary;
