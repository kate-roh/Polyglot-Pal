import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DESTINATIONS } from '@/lib/constants';
import { type Language } from '@/lib/types';
import { Navigation } from '@/components/Navigation';
import { apiRequest } from '@/lib/queryClient';

interface Flashcard {
  id: string;
  front: string;
  back: string;
  examples: string[];
}

export default function VocabularyPage() {
  const [selectedLang, setSelectedLang] = useState<Language | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(false);
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});
  const [currentIdx, setCurrentIdx] = useState(0);

  const availableLanguages = Array.from(new Set(DESTINATIONS.map(d => JSON.stringify(d.language))))
    .map(s => JSON.parse(s)) as Language[];

  const fetchCards = async (lang: Language) => {
    setLoading(true);
    try {
      const response = await apiRequest('POST', '/api/vocabulary/cards', {
        language: lang.name,
        count: 10
      });
      const data = await response.json();
      if (data.cards) {
        const cards = data.cards.map((card: any, idx: number) => ({
          id: String(idx),
          front: card.word,
          back: card.meaning,
          examples: [card.example, card.pronunciation].filter(Boolean)
        }));
        setFlashcards(cards);
        setCurrentIdx(0);
        setFlipped({});
      }
    } catch (err) {
      console.error(err);
      setFlashcards([
        { id: '1', front: 'Hello', back: '안녕하세요', examples: ['안녕하세요, 반갑습니다!', 'Hello, nice to meet you!'] },
        { id: '2', front: 'Thank you', back: '감사합니다', examples: ['도와주셔서 감사합니다', 'Thank you for your help'] },
        { id: '3', front: 'Goodbye', back: '안녕히 가세요', examples: ['내일 봐요, 안녕히 가세요', 'See you tomorrow, goodbye'] },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedLang) {
      fetchCards(selectedLang);
    }
  }, [selectedLang]);

  const toggleFlip = (id: string) => {
    setFlipped(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const currentCard = flashcards[currentIdx];

  if (!selectedLang) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="p-8 md:p-16">
          <header className="text-center mb-12">
            <h2 className="text-4xl font-black uppercase tracking-tighter text-foreground mb-4">Smart Flashcards</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">AI-generated vocabulary cards tailored for you</p>
          </header>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 max-w-5xl mx-auto">
            {availableLanguages.map(lang => (
              <motion.button
                key={lang.code}
                onClick={() => setSelectedLang(lang)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="glass-card p-6 rounded-3xl hover:border-primary/30 transition-all text-center flex flex-col items-center gap-3"
                data-testid={`lang-${lang.code}`}
              >
                <span className="text-4xl">{lang.flag}</span>
                <span className="font-bold text-foreground text-sm">{lang.name}</span>
              </motion.button>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="max-w-4xl mx-auto space-y-8 p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setSelectedLang(null)} data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <span>{selectedLang.flag}</span>
                {selectedLang.name} Flashcards
              </h2>
              <p className="text-muted-foreground text-sm">AI-generated phrases tailored for you</p>
            </div>
          </div>
          <Button 
            variant="outline"
            onClick={() => fetchCards(selectedLang)}
            disabled={loading}
            data-testid="button-refresh"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {loading ? (
          <Card className="h-96 flex flex-col items-center justify-center gap-4 glass-card rounded-3xl">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="text-muted-foreground font-medium">Generating fresh vocabulary cards...</p>
          </Card>
        ) : flashcards.length > 0 && currentCard ? (
          <div className="space-y-12">
            <div 
              className="relative group cursor-pointer" 
              style={{ perspective: '1000px' }} 
              onClick={() => toggleFlip(currentCard.id)}
            >
              <motion.div 
                className="relative w-full h-80 rounded-3xl shadow-xl"
                animate={{ rotateY: flipped[currentCard.id] ? 180 : 0 }}
                transition={{ duration: 0.6 }}
                style={{ transformStyle: 'preserve-3d' }}
              >
                <Card 
                  className="absolute inset-0 glass-card rounded-3xl flex flex-col items-center justify-center p-12 text-center"
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  <span className="text-sm font-bold uppercase tracking-widest text-primary mb-6">{selectedLang.name}</span>
                  <h3 className="text-4xl md:text-5xl font-black text-foreground leading-tight">
                    {currentCard.front}
                  </h3>
                  <div className="mt-8 flex gap-2">
                    <div className="w-2 h-2 rounded-full bg-muted"></div>
                    <div className="w-2 h-2 rounded-full bg-muted"></div>
                    <div className="w-2 h-2 rounded-full bg-muted"></div>
                  </div>
                </Card>
                
                <Card 
                  className="absolute inset-0 bg-gradient-to-br from-primary to-purple-700 text-primary-foreground rounded-3xl flex flex-col items-center justify-center p-12 text-center"
                  style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                >
                  <span className="text-sm font-bold uppercase tracking-widest text-primary-foreground/70 mb-6">Meaning</span>
                  <h3 className="text-3xl md:text-4xl font-bold mb-8">
                    {currentCard.back}
                  </h3>
                  <div className="space-y-3 max-w-md">
                    {currentCard.examples.map((ex, i) => (
                      <p key={i} className="text-sm md:text-base italic text-primary-foreground/80 border-l-2 border-primary-foreground/20 pl-4 text-left">
                        "{ex}"
                      </p>
                    ))}
                  </div>
                </Card>
              </motion.div>
              
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-card px-6 py-2 rounded-full shadow-md text-xs font-bold text-muted-foreground uppercase tracking-widest border">
                Click to Flip
              </div>
            </div>

            <div className="flex items-center justify-between px-4">
              <Button 
                variant="outline"
                size="icon"
                onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
                disabled={currentIdx === 0}
                className="w-14 h-14 rounded-full"
                data-testid="button-prev"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              
              <div className="flex gap-2">
                {flashcards.map((_, i) => (
                  <div 
                    key={i} 
                    className={`h-2 rounded-full transition-all duration-300 ${i === currentIdx ? 'w-8 bg-primary' : 'w-2 bg-muted'}`}
                  ></div>
                ))}
              </div>

              <Button 
                onClick={() => setCurrentIdx(prev => Math.min(flashcards.length - 1, prev + 1))}
                disabled={currentIdx === flashcards.length - 1}
                className="w-14 h-14 rounded-full"
                data-testid="button-next"
              >
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-muted-foreground">No cards found. Try refreshing.</p>
          </div>
        )}
      </main>
    </div>
  );
}
