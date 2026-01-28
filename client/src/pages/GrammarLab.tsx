import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, Volume2, CheckCircle, RotateCcw, Trophy, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAddXp, useStats } from '@/hooks/use-stats';
import { DESTINATIONS } from '@/lib/constants';
import { type Language, type GrammarLesson } from '@/lib/types';
import { Navigation } from '@/components/Navigation';
import { apiRequest } from '@/lib/queryClient';

export default function GrammarLab() {
  const [selectedLang, setSelectedLang] = useState<Language | null>(null);
  const [lesson, setLesson] = useState<GrammarLesson | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'theory' | 'practice'>('theory');
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [quizResult, setQuizResult] = useState<boolean | null>(null);

  const { data: stats } = useStats();
  const { mutate: addXp } = useAddXp();

  const availableLanguages = Array.from(new Set(DESTINATIONS.map(d => JSON.stringify(d.language))))
    .map(s => JSON.parse(s)) as Language[];

  const loadLesson = async (lang: Language) => {
    setSelectedLang(lang);
    setLoading(true);
    setQuizResult(null);
    setQuizAnswers({});
    setActiveTab('theory');
    
    try {
      const response = await apiRequest('POST', '/api/grammar/lesson', {
        language: lang.name,
        level: stats?.level || 1
      });
      const data = await response.json();
      setLesson(data);
    } catch (err) {
      console.error(err);
      setLesson({
        topic: `${lang.name} Basics`,
        explanation: `Learn the fundamentals of ${lang.name} grammar. This lesson covers basic sentence structure and common patterns.`,
        examples: [
          { original: "Example sentence 1", translation: "Translation 1" },
          { original: "Example sentence 2", translation: "Translation 2" }
        ],
        exercises: [
          { question: "Choose the correct form:", options: ["Option A", "Option B", "Option C", "Option D"], answer: "Option A", explanation: "This is the correct form because..." }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQuizSubmit = () => {
    if (!lesson) return;
    let correctCount = 0;
    lesson.exercises.forEach((ex, idx) => {
      if (quizAnswers[idx] === ex.answer) correctCount++;
    });

    const isSuccess = correctCount === lesson.exercises.length;
    setQuizResult(isSuccess);
    if (isSuccess) {
      addXp(30);
    }
  };

  if (!selectedLang) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="p-8 md:p-16">
          <header className="text-center mb-12">
            <h2 className="text-4xl font-black uppercase tracking-tighter text-foreground mb-4">Grammar Research Lab</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Master the structural patterns of foreign languages</p>
          </header>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 max-w-5xl mx-auto">
            {availableLanguages.map(lang => (
              <motion.button
                key={lang.code}
                onClick={() => loadLesson(lang)}
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
    <div className="min-h-screen bg-background flex flex-col">
      <header className="p-6 border-b border-border flex flex-col md:flex-row items-center justify-between glass-card sticky top-0 z-20 gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setSelectedLang(null)} data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h3 className="text-lg font-bold text-foreground">{lesson?.topic || 'Loading Lesson...'}</h3>
            <p className="text-xs text-muted-foreground uppercase tracking-widest">{selectedLang.flag} {selectedLang.name} Level {stats?.level || 1}</p>
          </div>
        </div>

        <div className="flex p-1 bg-muted/50 rounded-2xl border border-border/50">
          <button
            onClick={() => setActiveTab('theory')}
            className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'theory' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground'}`}
            data-testid="tab-theory"
          >
            Theory
          </button>
          <button
            onClick={() => setActiveTab('practice')}
            className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'practice' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground'}`}
            data-testid="tab-practice"
          >
            Practice
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-6">
            <Loader2 className="w-16 h-16 text-primary animate-spin" />
            <p className="text-muted-foreground font-bold tracking-widest uppercase animate-pulse">Compiling Grammar Data...</p>
          </div>
        ) : lesson && (
          <div className="max-w-4xl mx-auto space-y-12 pb-24">
            {activeTab === 'theory' ? (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="space-y-10"
              >
                <Card className="glass-card p-8 rounded-3xl border border-border/50">
                  <h4 className="text-xs font-bold text-primary uppercase tracking-widest mb-6">Core Concept</h4>
                  <div className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {typeof lesson.explanation === 'object' 
                      ? JSON.stringify(lesson.explanation, null, 2) 
                      : lesson.explanation}
                  </div>
                </Card>

                <section className="space-y-6">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-2">Examples</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {lesson.examples.map((ex, i) => (
                      <Card key={i} className="p-6 glass-card rounded-3xl border border-border/50 hover:bg-muted/50 transition-colors group">
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-xl font-bold text-foreground leading-tight">{ex.original}</p>
                          <Button variant="ghost" size="icon" className="text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                            <Volume2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground">{ex.translation}</p>
                      </Card>
                    ))}
                  </div>
                </section>

                <div className="text-center pt-8">
                  <Button onClick={() => setActiveTab('practice')} className="px-10 py-4 rounded-2xl font-bold uppercase tracking-widest text-xs" data-testid="button-start-practice">
                    Start Practice Test
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, x: 20 }} 
                animate={{ opacity: 1, x: 0 }}
                className="space-y-8"
              >
                {lesson.exercises.map((ex, idx) => (
                  <Card key={idx} className="glass-card p-8 rounded-3xl border border-border/50">
                    <p className="text-sm font-bold text-muted-foreground mb-6 uppercase tracking-widest">Exercise {idx + 1}</p>
                    <h4 className="text-xl font-bold text-foreground mb-8">{ex.question}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {ex.options.map((opt, i) => (
                        <button
                          key={i}
                          onClick={() => setQuizAnswers(prev => ({ ...prev, [idx]: opt }))}
                          className={`p-5 rounded-2xl border text-left transition-all ${
                            quizAnswers[idx] === opt 
                              ? 'bg-primary border-primary text-primary-foreground shadow-lg' 
                              : 'bg-muted/50 border-border text-muted-foreground hover:bg-muted'
                          }`}
                          data-testid={`option-${idx}-${i}`}
                        >
                          <span className="font-bold mr-3 text-primary">{String.fromCharCode(65 + i)}</span>
                          {opt}
                        </button>
                      ))}
                    </div>
                    {quizResult !== null && (
                      <div className={`mt-6 p-4 rounded-xl text-xs flex items-start gap-3 ${quizAnswers[idx] === ex.answer ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                        {quizAnswers[idx] === ex.answer ? <CheckCircle className="w-4 h-4 mt-0.5" /> : <RotateCcw className="w-4 h-4 mt-0.5" />}
                        <p>{ex.explanation}</p>
                      </div>
                    )}
                  </Card>
                ))}

                <div className="flex flex-col items-center gap-6 pt-10">
                  {quizResult === null ? (
                    <Button 
                      onClick={handleQuizSubmit}
                      disabled={Object.keys(quizAnswers).length < lesson.exercises.length}
                      className="px-12 py-5 rounded-3xl font-bold uppercase tracking-widest text-sm"
                      data-testid="button-submit-quiz"
                    >
                      Submit for AI Evaluation
                    </Button>
                  ) : quizResult ? (
                    <div className="text-center space-y-4">
                      <Trophy className="w-16 h-16 text-green-400 mx-auto animate-bounce" />
                      <h4 className="text-2xl font-black uppercase text-foreground">Perfect Score!</h4>
                      <p className="text-muted-foreground font-medium">Concept fully mastered. +30 XP gained.</p>
                      <Button variant="outline" onClick={() => setSelectedLang(null)} className="px-10 py-3 rounded-xl text-xs font-bold uppercase tracking-widest">
                        Return to Lab
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center space-y-4">
                      <RotateCcw className="w-16 h-16 text-amber-400 mx-auto" />
                      <h4 className="text-2xl font-black uppercase text-foreground">Keep Practicing</h4>
                      <p className="text-muted-foreground font-medium">Review the theory and try again.</p>
                      <Button onClick={() => setQuizResult(null)} className="px-10 py-3 rounded-xl text-xs font-bold uppercase tracking-widest">
                        Retry Practice
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
