
import React, { useState, useEffect, useRef } from 'react';
import { GeminiService } from '../services/geminiService';
import { LevelTestQuestion, LevelTestResult, Language } from '../types';
import { DESTINATIONS } from '../constants';

interface LevelTestProps {
  gemini: GeminiService;
  onComplete: (result: LevelTestResult, lang: Language) => void;
  onCancel: () => void;
}

const LevelTest: React.FC<LevelTestProps> = ({ gemini, onComplete, onCancel }) => {
  const [selectedLang, setSelectedLang] = useState<Language | null>(null);
  const [questions, setQuestions] = useState<LevelTestQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recordingText, setRecordingText] = useState('');
  
  const [timeLeft, setTimeLeft] = useState(30);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const availableLanguages = Array.from(new Set(DESTINATIONS.map(d => JSON.stringify(d.language))))
    .map(s => JSON.parse(s))
    .filter((lang: any) => lang.code !== 'ko') as Language[];

  useEffect(() => {
    if (selectedLang && questions.length > 0 && !evaluating && !loading) {
      setTimeLeft(30);
      if (timerRef.current) clearInterval(timerRef.current);
      
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleNext("TIME_EXPIRED");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [currentIdx, selectedLang, questions, evaluating, loading]);

  const startTestForLanguage = async (lang: Language) => {
    setSelectedLang(lang);
    setLoading(true);
    try {
      const q = await gemini.generateLevelTest(lang.name);
      setQuestions(q);
    } catch (err) {
      alert("Failed to sync with language node.");
      setSelectedLang(null);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async (answer: any) => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    const newAnswers = [...answers, { 
      questionId: questions[currentIdx].id, 
      answer,
      timeSpent: 30 - timeLeft 
    }];
    setAnswers(newAnswers);

    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setRecordingText('');
    } else {
      setEvaluating(true);
      if (selectedLang) {
        const result = await gemini.analyzeLevelTest(selectedLang.name, newAnswers);
        onComplete(result, selectedLang);
      }
    }
  };

  const handleSTT = () => {
    if (!selectedLang) return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Browser not supported");

    const recognition = new SpeechRecognition();
    recognition.lang = selectedLang.code === 'en' ? 'en-US' : selectedLang.code;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (e: any) => setRecordingText(e.results[0][0].transcript);
    recognition.start();
  };

  if (!selectedLang) {
    return (
      <div className="h-full flex flex-col bg-[#0b0e14] p-8 md:p-16 overflow-y-auto items-center">
        <h2 className="text-4xl font-black italic uppercase text-white mb-12">Select Language Node</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl w-full">
          {availableLanguages.map((lang) => (
            <button key={lang.code} onClick={() => startTestForLanguage(lang)} className="glass p-8 rounded-[32px] border border-white/5 hover:neon-border transition-all text-left">
              <div className="text-5xl mb-6">{lang.flag}</div>
              <h3 className="text-2xl font-bold text-white mb-2">{lang.name}</h3>
              <p className="text-xs text-indigo-400 font-bold uppercase tracking-widest italic">Initialize Neural Scan</p>
            </button>
          ))}
        </div>
        <button onClick={onCancel} className="mt-12 text-slate-600 hover:text-white uppercase text-[10px] font-black tracking-widest">Return to Dashboard</button>
      </div>
    );
  }

  if (loading || evaluating) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[#0b0e14]">
        <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-6"></div>
        <h3 className="text-xl font-black italic uppercase tracking-widest text-white">{evaluating ? "Analyzing Patterns" : "Syncing Node"}</h3>
      </div>
    );
  }

  const currentQ = questions[currentIdx];
  if (!currentQ) return null;

  return (
    <div className="h-full flex flex-col bg-[#0b0e14] overflow-hidden p-6 md:p-12 relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
        <div className={`h-full transition-all duration-1000 ease-linear ${timeLeft < 10 ? 'bg-red-500' : 'bg-indigo-500'}`} style={{ width: `${(timeLeft / 30) * 100}%` }}></div>
      </div>

      <header className="flex justify-between items-center mb-12">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-2xl">{selectedLang.flag}</div>
          <h2 className="text-lg font-black italic uppercase text-white">{selectedLang.name} Diagnostic</h2>
        </div>
        <div className="text-right">
           <span className={`text-3xl font-black italic ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>{timeLeft}s</span>
           <p className="text-[8px] font-bold text-slate-500 uppercase">Deadline</p>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full">
        <div className="text-center mb-10">
          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-2 block">Question {currentIdx + 1} // {currentQ.type}</span>
          <h1 className="text-2xl md:text-3xl font-bold text-white">{currentQ.question}</h1>
        </div>

        {currentQ.type !== 'PRONUNCIATION' ? (
          <div className="grid grid-cols-1 gap-4 w-full">
            {currentQ.options?.map((opt, i) => (
              <button key={i} onClick={() => handleNext(opt)} className="glass p-5 rounded-2xl border border-white/5 hover:border-indigo-500/50 text-left flex justify-between items-center group">
                <span className="text-slate-300 group-hover:text-white">{opt}</span>
                <i className="fas fa-chevron-right text-[10px] text-slate-700"></i>
              </button>
            ))}
          </div>
        ) : (
          <div className="w-full flex flex-col items-center gap-8">
            <div className="p-8 bg-white/5 rounded-[40px] border border-white/5 text-center w-full">
               <p className="text-2xl font-black italic text-indigo-400 mb-4">{currentQ.audioText}</p>
               <button onClick={() => gemini.speak(currentQ.audioText || '', selectedLang.code)} className="w-12 h-12 rounded-full bg-white/5 text-indigo-400 hover:bg-white/10"><i className="fas fa-volume-high"></i></button>
            </div>
            <button onClick={handleSTT} className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl ${isListening ? 'bg-red-500 animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.5)]' : 'bg-indigo-600 text-white'}`}><i className="fas fa-microphone"></i></button>
            {recordingText && (
              <div className="text-center">
                <p className="text-emerald-400 font-bold mb-4">"{recordingText}"</p>
                <button onClick={() => handleNext(recordingText)} className="px-8 py-3 bg-white/10 rounded-xl text-xs font-black uppercase text-white">Next</button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default LevelTest;
