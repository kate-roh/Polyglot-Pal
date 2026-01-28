
import React, { useState, useEffect } from 'react';
import { GeminiService } from '../services/geminiService';
import { GrammarLesson, Language, UserStats } from '../types';
import { DESTINATIONS } from '../constants';

interface GrammarLabProps {
  gemini: GeminiService;
  userStats: UserStats;
  onAddXP: (amount: number) => void;
}

const GrammarLab: React.FC<GrammarLabProps> = ({ gemini, userStats, onAddXP }) => {
  const [selectedLang, setSelectedLang] = useState<Language | null>(null);
  const [lesson, setLesson] = useState<GrammarLesson | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'theory' | 'practice'>('theory');
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [quizResult, setQuizResult] = useState<boolean | null>(null);

  const availableLanguages = Array.from(new Set(DESTINATIONS.map(d => JSON.stringify(d.language))))
    .map(s => JSON.parse(s)) as Language[];

  const loadLesson = async (lang: Language, topic?: string) => {
    setSelectedLang(lang);
    setLoading(true);
    setQuizResult(null);
    setQuizAnswers({});
    setActiveTab('theory');
    try {
      const data = await gemini.generateGrammarLesson(lang.name, userStats.level, topic);
      setLesson(data);
    } catch (err) {
      console.error(err);
      alert("Neural sync with grammar node failed.");
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
      onAddXP(30);
    }
  };

  if (!selectedLang) {
    return (
      <div className="h-full p-8 md:p-16 animate-in fade-in duration-500">
        <header className="text-center mb-12">
          <h2 className="text-4xl font-black italic uppercase tracking-tighter text-white mb-4">Grammar Research Lab</h2>
          <p className="text-slate-500 max-w-xl mx-auto">Master the structural patterns of foreign intelligence.</p>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 max-w-5xl mx-auto">
          {availableLanguages.map(lang => (
            <button
              key={lang.code}
              onClick={() => loadLesson(lang)}
              className="glass p-6 rounded-3xl hover:neon-border transition-all text-center flex flex-col items-center gap-3"
            >
              <span className="text-4xl">{lang.flag}</span>
              <span className="font-bold text-white text-sm">{lang.name}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#0b0e14] animate-in slide-in-from-bottom-4 duration-500">
      <header className="p-6 border-b border-white/5 flex flex-col md:flex-row items-center justify-between glass sticky top-0 z-20 gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => setSelectedLang(null)} className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-all">
            <i className="fas fa-arrow-left"></i>
          </button>
          <div>
            <h3 className="text-lg font-bold text-white">{lesson?.topic || 'Loading Lesson...'}</h3>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">{selectedLang.flag} {selectedLang.name} • Level {userStats.level}</p>
          </div>
        </div>

        <div className="flex p-1 bg-white/5 rounded-2xl border border-white/10">
          <button
            onClick={() => setActiveTab('theory')}
            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'theory' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}
          >
            Theory
          </button>
          <button
            onClick={() => setActiveTab('practice')}
            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'practice' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}
          >
            Practice
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-6">
            <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
            <p className="text-slate-500 font-bold tracking-widest uppercase animate-pulse">Compiling Grammar Data...</p>
          </div>
        ) : lesson && (
          <div className="max-w-4xl mx-auto space-y-12 pb-24">
            {activeTab === 'theory' ? (
              <div className="space-y-10 animate-in fade-in duration-500">
                <section className="glass p-8 rounded-[40px] border border-white/5">
                  <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-6">Core Concept</h4>
                  <div className="prose prose-invert max-w-none text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {/* Error #31 방지: lesson.explanation이 객체일 경우 문자열로 출력 */}
                    {typeof lesson.explanation === 'object' 
                      ? JSON.stringify(lesson.explanation, null, 2) 
                      : lesson.explanation}
                  </div>
                </section>

                <section className="space-y-6">
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-2">Linguistic Blueprints</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {lesson.examples.map((ex, i) => (
                      <div key={i} className="p-6 bg-white/5 rounded-3xl border border-white/5 hover:bg-white/10 transition-colors group">
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-xl font-bold text-white leading-tight">{ex.original}</p>
                          <button onClick={() => gemini.speak(ex.original, selectedLang.code)} className="text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            <i className="fas fa-volume-up"></i>
                          </button>
                        </div>
                        <p className="text-sm text-slate-400">{ex.translation}</p>
                      </div>
                    ))}
                  </div>
                </section>

                <div className="text-center pt-8">
                  <button onClick={() => setActiveTab('practice')} className="px-10 py-4 bg-indigo-600 rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-transform shadow-xl shadow-indigo-600/20">
                    Commence Practice Test
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                {lesson.exercises.map((ex, idx) => (
                  <div key={idx} className="glass p-8 rounded-[40px] border border-white/5">
                    <p className="text-sm font-bold text-slate-500 mb-6 uppercase tracking-widest">Exercise {idx + 1}</p>
                    <h4 className="text-xl font-bold text-white mb-8">{ex.question}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {ex.options.map((opt, i) => (
                        <button
                          key={i}
                          onClick={() => setQuizAnswers(prev => ({ ...prev, [idx]: opt }))}
                          className={`p-5 rounded-2xl border text-left transition-all ${
                            quizAnswers[idx] === opt 
                              ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' 
                              : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                          }`}
                        >
                          <span className="font-bold mr-3 text-indigo-400">{String.fromCharCode(65 + i)}</span>
                          {opt}
                        </button>
                      ))}
                    </div>
                    {quizResult !== null && (
                       <div className={`mt-6 p-4 rounded-xl text-xs flex items-start gap-3 ${quizAnswers[idx] === ex.answer ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                          <i className={`fas ${quizAnswers[idx] === ex.answer ? 'fa-check-circle' : 'fa-info-circle'} mt-0.5`}></i>
                          <p>{ex.explanation}</p>
                       </div>
                    )}
                  </div>
                ))}

                <div className="flex flex-col items-center gap-6 pt-10">
                  {quizResult === null ? (
                    <button 
                      onClick={handleQuizSubmit}
                      disabled={Object.keys(quizAnswers).length < lesson.exercises.length}
                      className="px-12 py-5 bg-indigo-600 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-3xl font-black uppercase tracking-widest text-sm shadow-2xl shadow-indigo-600/20 hover:scale-105 transition-transform"
                    >
                      Submit for AI Evaluation
                    </button>
                  ) : quizResult ? (
                    <div className="text-center space-y-4">
                       <div className="text-emerald-400 text-5xl mb-2 animate-bounce"><i className="fas fa-trophy"></i></div>
                       <h4 className="text-2xl font-black italic uppercase text-white">Neural Match Found!</h4>
                       <p className="text-slate-500 font-medium">Concept fully assimilated. +30 XP gained.</p>
                       <button onClick={() => setSelectedLang(null)} className="px-10 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white/10">Return to Lab</button>
                    </div>
                  ) : (
                    <div className="text-center space-y-4">
                       <div className="text-amber-400 text-5xl mb-2"><i className="fas fa-redo"></i></div>
                       <h4 className="text-2xl font-black italic uppercase text-white">Drift Detected</h4>
                       <p className="text-slate-500 font-medium">Review the theory and recalibrate your patterns.</p>
                       <button onClick={() => setQuizResult(null)} className="px-10 py-3 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest">Retry Practice</button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GrammarLab;
