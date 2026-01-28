import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, MessageSquare, BookOpen, Lightbulb, Quote, Volume2, Loader2 } from "lucide-react";
import { type AnalysisResult } from "@shared/schema";
import { useAddBookmark } from "@/hooks/use-bookmarks";
import { useToast } from "@/hooks/use-toast";

interface AnalysisDisplayProps {
  data: AnalysisResult;
  sourceType: string;
  onSeek?: (seconds: number) => void;
}

export function AnalysisDisplay({ data, sourceType, onSeek }: AnalysisDisplayProps) {
  const { mutate: bookmark } = useAddBookmark();
  const { toast } = useToast();
  const [savedItems, setSavedItems] = useState<Set<string>>(new Set());
  const [playingTTS, setPlayingTTS] = useState<string | null>(null);

  const handleBookmark = (type: 'word' | 'sentence' | 'grammar' | 'phrase', content: string, meaning: string, context?: string) => {
    const key = `${type}-${content}`;
    if (savedItems.has(key)) {
      toast({ title: "이미 저장됨", description: "이 항목은 이미 저장되어 있습니다." });
      return;
    }
    
    bookmark({
      type,
      sourceType,
      content,
      meaning,
      context,
    }, {
      onSuccess: () => {
        setSavedItems(prev => new Set(prev).add(key));
        toast({ title: "저장됨!", description: `${type === 'sentence' ? '문장' : type === 'phrase' ? '표현' : type === 'grammar' ? '문법' : '단어'}이 저장되었습니다.` });
      }
    });
  };

  const playTTS = async (text: string, id: string) => {
    if (playingTTS === id) return;
    setPlayingTTS(id);
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
        credentials: 'include'
      });
      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.onended = () => setPlayingTTS(null);
        audio.play();
      }
    } catch (err) {
      console.error('TTS error:', err);
    } finally {
      setTimeout(() => setPlayingTTS(null), 5000);
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const isSaved = (type: string, content: string) => savedItems.has(`${type}-${content}`);

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6 pb-20"
    >
      {/* Summary Section */}
      <motion.div variants={item} className="bg-card p-4 md:p-6 rounded-2xl border border-border">
        <h3 className="text-lg md:text-xl font-bold mb-3 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 md:w-6 md:h-6 text-yellow-400" />
          요약
        </h3>
        <p className="text-sm md:text-base leading-relaxed text-muted-foreground">{data.summary}</p>
      </motion.div>

      {/* Key Sentences Section - Show First for context */}
      <motion.div variants={item} className="space-y-3">
        <h3 className="text-lg md:text-xl font-bold flex items-center gap-2 text-green-400">
          <MessageSquare className="w-5 h-5 md:w-6 md:h-6" />
          핵심 문장
        </h3>
        <div className="space-y-3">
          {data.keySentences.map((sentence, i) => (
            <div key={i} className="bg-card p-4 rounded-xl border border-border" data-testid={`sentence-card-${i}`}>
              <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-base md:text-lg font-medium text-foreground flex-1">{sentence.sentence}</p>
                  <div className="flex items-center gap-1 shrink-0">
                    <button 
                      onClick={() => playTTS(sentence.sentence, `sentence-${i}`)}
                      className="p-2 rounded-full hover-elevate text-muted-foreground hover:text-primary transition-colors"
                      data-testid={`button-tts-sentence-${i}`}
                    >
                      {playingTTS === `sentence-${i}` ? (
                        <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
                      ) : (
                        <Volume2 className="w-4 h-4 md:w-5 md:h-5" />
                      )}
                    </button>
                    <button 
                      onClick={() => handleBookmark('sentence', sentence.sentence, sentence.translation, sentence.nuance)}
                      className={`p-2 rounded-full transition-colors ${isSaved('sentence', sentence.sentence) ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'}`}
                      data-testid={`button-save-sentence-${i}`}
                    >
                      <Heart className={`w-4 h-4 md:w-5 md:h-5 ${isSaved('sentence', sentence.sentence) ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                </div>
                <p className="text-sm md:text-base text-green-400/80 italic">{sentence.translation}</p>
                {sentence.nuance && (
                  <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded-lg">
                    <span className="font-bold">뉘앙스:</span> {sentence.nuance}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Vocabulary & Phrases in a responsive grid */}
      <div className="grid grid-cols-1 gap-6">
        {/* Vocabulary Section */}
        <motion.div variants={item} className="space-y-3">
          <h3 className="text-lg md:text-xl font-bold flex items-center gap-2 text-accent">
            <BookOpen className="w-5 h-5 md:w-6 md:h-6" />
            주요 단어
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.vocabulary.map((vocab, i) => (
              <div key={i} className="bg-card p-3 md:p-4 rounded-xl border border-border" data-testid={`vocab-card-${i}`}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="text-base md:text-lg font-bold text-foreground">{vocab.word}</h4>
                  <div className="flex items-center gap-1 shrink-0">
                    <button 
                      onClick={() => playTTS(vocab.word, `vocab-${i}`)}
                      className="p-1.5 rounded-full hover-elevate text-muted-foreground hover:text-primary transition-colors"
                      data-testid={`button-tts-vocab-${i}`}
                    >
                      {playingTTS === `vocab-${i}` ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Volume2 className="w-4 h-4" />
                      )}
                    </button>
                    <button 
                      onClick={() => handleBookmark('word', vocab.word, vocab.meaning, vocab.example)}
                      className={`p-1.5 rounded-full transition-colors ${isSaved('word', vocab.word) ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'}`}
                      data-testid={`button-save-vocab-${i}`}
                    >
                      <Heart className={`w-4 h-4 ${isSaved('word', vocab.word) ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-primary font-medium mb-1">{vocab.meaning}</p>
                {vocab.example && (
                  <p className="text-xs text-muted-foreground italic border-l-2 border-primary/30 pl-2">"{vocab.example}"</p>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Phrases Section */}
        {data.phrases && data.phrases.length > 0 && (
          <motion.div variants={item} className="space-y-3">
            <h3 className="text-lg md:text-xl font-bold flex items-center gap-2 text-orange-400">
              <Quote className="w-5 h-5 md:w-6 md:h-6" />
              유용한 표현
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {data.phrases.map((phrase, i) => (
                <div key={i} className="bg-card p-3 md:p-4 rounded-xl border border-border" data-testid={`phrase-card-${i}`}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="text-base md:text-lg font-bold text-foreground">{phrase.phrase}</h4>
                    <div className="flex items-center gap-1 shrink-0">
                      <button 
                        onClick={() => playTTS(phrase.phrase, `phrase-${i}`)}
                        className="p-1.5 rounded-full hover-elevate text-muted-foreground hover:text-primary transition-colors"
                        data-testid={`button-tts-phrase-${i}`}
                      >
                        {playingTTS === `phrase-${i}` ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Volume2 className="w-4 h-4" />
                        )}
                      </button>
                      <button 
                        onClick={() => handleBookmark('phrase', phrase.phrase, phrase.meaning, phrase.usage)}
                        className={`p-1.5 rounded-full transition-colors ${isSaved('phrase', phrase.phrase) ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'}`}
                        data-testid={`button-save-phrase-${i}`}
                      >
                        <Heart className={`w-4 h-4 ${isSaved('phrase', phrase.phrase) ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-orange-400/80 font-medium mb-1">{phrase.meaning}</p>
                  {phrase.usage && (
                    <p className="text-xs text-muted-foreground italic border-l-2 border-orange-500/30 pl-2">"{phrase.usage}"</p>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Grammar Section */}
        <motion.div variants={item} className="space-y-3">
          <h3 className="text-lg md:text-xl font-bold flex items-center gap-2 text-blue-400">
            <BookOpen className="w-5 h-5 md:w-6 md:h-6" />
            문법 포인트
          </h3>
          <div className="space-y-3">
            {data.grammar.map((point, i) => (
              <div key={i} className="bg-card p-3 md:p-4 rounded-xl border border-border" data-testid={`grammar-card-${i}`}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="inline-block px-2 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    {point.point}
                  </span>
                  <button 
                    onClick={() => handleBookmark('grammar', point.point, point.explanation, point.example)}
                    className={`p-1.5 rounded-full transition-colors shrink-0 ${isSaved('grammar', point.point) ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'}`}
                    data-testid={`button-save-grammar-${i}`}
                  >
                    <Heart className={`w-4 h-4 ${isSaved('grammar', point.point) ? 'fill-current' : ''}`} />
                  </button>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{point.explanation}</p>
                {point.example && (
                  <div className="bg-muted/50 p-2 rounded-lg text-xs md:text-sm font-mono text-blue-300/80">
                    {point.example}
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Cultural Notes */}
      {data.culturalNotes && data.culturalNotes.length > 0 && (
        <motion.div variants={item} className="bg-card p-4 md:p-6 rounded-2xl border border-purple-500/20">
          <h3 className="text-sm font-bold mb-3 text-purple-400 uppercase tracking-widest">문화적 맥락</h3>
          <ul className="space-y-2">
            {data.culturalNotes.map((note, i) => (
              <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 shrink-0" />
                {note}
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </motion.div>
  );
}
