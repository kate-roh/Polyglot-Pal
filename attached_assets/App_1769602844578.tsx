
import React, { useState, useEffect, useRef } from 'react';
import { AppMode, UserStats, Bookmark, Destination, AnalysisResult, Character, Message, JourneyReport, SavedExpression, LevelTestResult, Language } from './types';
import { GeminiService } from './services/geminiService';
import Sidebar from './components/Sidebar';
import UnifiedDashboard from './components/UnifiedDashboard';
import WorldMap from './components/WorldMap';
import ChatInterface from './components/ChatInterface';
import MediaStudio from './components/MediaStudio';
import Vault from './components/Vault';
import JourneyLog from './components/JourneyLog';
import LevelTest from './components/LevelTest';
import GrammarLab from './components/GrammarLab';
import LevelInfoModal from './components/LevelInfoModal';
import LiveTutor from './components/LiveTutor';
import ImageExplorer from './components/ImageExplorer';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>('HOME');
  const [showLevelInfo, setShowLevelInfo] = useState(false);
  const [selectedDest, setSelectedDest] = useState<Destination | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(false);

  const gemini = useRef(new GeminiService());

  const getRankFromLevel = (level: number): string => {
    if (level <= 5) return 'A1 (Beginner)';
    if (level <= 15) return 'A2 (Elementary)';
    if (level <= 30) return 'B1 (Intermediate)';
    if (level <= 50) return 'B2 (Upper Intermediate)';
    if (level <= 80) return 'C1 (Advanced)';
    return 'C2 (Mastery)';
  };

  const createInitialStats = (): UserStats => {
    const todayStr = new Date().toISOString().split('T')[0];
    return {
      level: 1, xp: 0, xpToday: 0, streak: 0, 
      totalJourneys: 0, totalShadowings: 0, totalWords: 0,
      proficiency: 'Unranked',
      lastActivityDate: Date.now(), 
      lastLoginDate: todayStr,
      dailyHistory: [{ date: todayStr, xp: 0 }]
    };
  };

  const [stats, setStats] = useState<UserStats>(() => {
    try {
      const saved = localStorage.getItem('polyglot_stats');
      const todayStr = new Date().toISOString().split('T')[0];
      if (!saved) return createInitialStats();
      let parsed = JSON.parse(saved);
      if (!parsed.dailyHistory) parsed.dailyHistory = [{ date: todayStr, xp: 0 }];
      return parsed;
    } catch (e) { return createInitialStats(); }
  });

  const [bookmarks, setBookmarks] = useState<Bookmark[]>(() => {
    try {
      const saved = localStorage.getItem('polyglot_bookmarks');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  const [mediaHistory, setMediaHistory] = useState<AnalysisResult[]>(() => {
    try {
      const saved = localStorage.getItem('polyglot_media_history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  const [journeyHistory, setJourneyHistory] = useState<JourneyReport[]>(() => {
    try {
      const saved = localStorage.getItem('polyglot_journey_history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  useEffect(() => {
    localStorage.setItem('polyglot_stats', JSON.stringify(stats));
    localStorage.setItem('polyglot_bookmarks', JSON.stringify(bookmarks));
    localStorage.setItem('polyglot_media_history', JSON.stringify(mediaHistory));
    localStorage.setItem('polyglot_journey_history', JSON.stringify(journeyHistory));
  }, [stats, bookmarks, mediaHistory, journeyHistory]);

  const addXP = (amount: number, score?: number) => {
    const todayStr = new Date().toISOString().split('T')[0];
    setStats(prev => {
      const finalAmount = Math.round(amount * (score && score >= 90 ? 1.5 : 1));
      let newTotalXP = prev.xp + finalAmount;
      let newLevel = prev.level;
      while (newTotalXP >= 500) { newLevel += 1; newTotalXP -= 500; }
      const newHistory = (prev.dailyHistory || []).map(h => h.date === todayStr ? { ...h, xp: h.xp + finalAmount } : h);
      return { ...prev, xp: newTotalXP, xpToday: prev.xpToday + finalAmount, level: newLevel, proficiency: getRankFromLevel(newLevel), dailyHistory: newHistory };
    });
  };

  const handleStartJourney = async (dest: Destination) => {
    setLoading(true);
    setSelectedDest(dest);
    try {
      const char = await gemini.current.generateCharacter(dest, 'Tourist meeting a local');
      setCharacter(char);
      setMessages([{ role: 'model', content: `Welcome to ${dest.city}! I'm ${char.name}. How can I help you today?`, timestamp: Date.now() }]);
      setMode('WORLD_TOUR'); // 확실하게 월드투어 모드로 고정
    } catch (e) {
      alert("AI NPC 생성 실패");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!selectedDest || !character) return;
    const userMsg: Message = { role: 'user', content: text, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    
    try {
      const weatherData = { temp: 22, condition: 'Sunny', tip: 'Take a walk!' };
      const response = await gemini.current.chat(selectedDest, character, messages, text, 10, weatherData);
      setMessages(prev => [...prev, { role: 'model', content: response.content, timestamp: Date.now() }]);
      addXP(10);
    } catch (e) { console.error(e); }
  };

  const renderView = () => {
    switch (mode) {
      case 'HOME': return <UnifiedDashboard stats={stats} recentHistory={mediaHistory} bookmarks={bookmarks} onStartMission={() => setMode('MEDIA_STUDIO')} onReviewNow={() => setMode('VAULT')} onStartLevelTest={() => setMode('LEVEL_TEST')} onDeleteHistory={id => setMediaHistory(prev => prev.filter(i => i.id !== id))} onLevelClick={() => setShowLevelInfo(true)} />;
      case 'WORLD_TOUR': 
        if (selectedDest && character) {
          return (
            <ChatInterface 
              destination={selectedDest} character={character} weather={{temp: 22, condition: 'Sunny', localDesc: '', tip: 'It is a beautiful day to explore the city!'}} 
              messages={messages} politeness={10} onSendMessage={handleSendMessage} onEndJourney={() => {setSelectedDest(null); setCharacter(null); setMessages([]); setMode('HOME');}}
              scenarios={[{id:'1', name:'Street Vendor', icon:'fa-shop', image:'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad'}]} currentScenario={{id: '1', name: 'City Center', icon: 'fa-city', image: selectedDest.image}} onSelectScenario={() => {}} 
            />
          );
        }
        return <WorldMap onSelect={handleStartJourney} history={journeyHistory} />;
      case 'EXPLORER': return <ImageExplorer targetLanguage={{code: 'en', name: 'English', flag: '🇺🇸'}} />;
      case 'TUTOR': return <div className="p-4 md:p-8 h-full"><LiveTutor targetLanguage={{code: 'en', name: 'English', flag: '🇺🇸'}} /></div>;
      case 'LEVEL_TEST': return <LevelTest gemini={gemini.current} onComplete={() => setMode('HOME')} onCancel={() => setMode('HOME')} />;
      case 'GRAMMAR_LAB': return <GrammarLab gemini={gemini.current} userStats={stats} onAddXP={addXP} />;
      case 'MEDIA_STUDIO': return <MediaStudio gemini={gemini.current} onAddXP={addXP} onToggleBookmark={() => {}} history={mediaHistory} onSaveResult={res => setMediaHistory(prev => [res, ...prev])} onDeleteHistory={id => setMediaHistory(prev => prev.filter(i => i.id !== id))} />;
      case 'VAULT': return <Vault bookmarks={bookmarks} onToggleBookmark={() => {}} onAddXP={addXP} onStartTraining={() => {}} />;
      case 'HISTORY': return <JourneyLog history={journeyHistory} mediaHistory={mediaHistory} savedExpressions={[]} onSaveExpression={() => {}} onDeleteLog={id => {setJourneyHistory(prev => prev.filter(i => i.id !== id)); setMediaHistory(prev => prev.filter(i => i.id !== id));}} />;
      default: return <UnifiedDashboard stats={stats} recentHistory={mediaHistory} bookmarks={bookmarks} onStartMission={() => setMode('MEDIA_STUDIO')} onReviewNow={() => setMode('VAULT')} onStartLevelTest={() => setMode('LEVEL_TEST')} onDeleteHistory={() => {}} onLevelClick={() => setShowLevelInfo(true)} />;
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#0b0e14] text-slate-100 overflow-hidden">
      <div className="hidden md:block">
        <Sidebar mode={mode} setMode={(m) => { setMode(m); if(m!=='WORLD_TOUR') {setSelectedDest(null); setCharacter(null);} }} stats={stats} />
      </div>

      <main className="flex-1 overflow-hidden flex flex-col relative">
        {/* Header (Desktop Only or simplified on mobile) */}
        <header className="h-14 md:h-16 border-b border-white/5 flex justify-between items-center bg-black/40 z-[60] backdrop-blur-xl px-4 pt-[env(safe-area-inset-top)]">
           <div className="flex items-center gap-3">
              <button className="md:hidden w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-600/20" onClick={() => setMode('HOME')}>
                 <i className="fas fa-bolt text-sm"></i>
              </button>
              <h2 className="text-[10px] md:text-sm font-black italic tracking-widest uppercase text-indigo-400 truncate max-w-[150px]">
                {mode.replace('_', ' ')}
              </h2>
           </div>
           
           <div className="flex items-center gap-2">
              <div onClick={() => setShowLevelInfo(true)} className="flex items-center gap-2 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20 cursor-pointer active:scale-95 transition-transform">
                <span className="text-[10px] font-black text-indigo-400">Lv.{stats.level}</span>
                <div className="hidden xs:block w-12 h-1 bg-white/5 rounded-full overflow-hidden">
                   <div className="h-full bg-indigo-500" style={{width: `${(stats.xp/500)*100}%`}}></div>
                </div>
              </div>
           </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#0b0e14]">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center">
              <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-[10px] font-black uppercase text-indigo-400 animate-pulse tracking-widest">Neural Linking...</p>
            </div>
          ) : renderView()}
        </div>

        {/* Mobile Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 glass border-t border-white/10 px-6 py-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] flex justify-between items-center z-[100] shadow-[0_-10px_40px_rgba(0,0,0,0.8)]">
           {[
             { id: 'HOME', icon: 'fa-house' },
             { id: 'WORLD_TOUR', icon: 'fa-globe' },
             { id: 'EXPLORER', icon: 'fa-camera' },
             { id: 'MEDIA_STUDIO', icon: 'fa-clapperboard' },
             { id: 'HISTORY', icon: 'fa-clock-rotate-left' }
           ].map(item => (
             <button key={item.id} onClick={() => { setMode(item.id as AppMode); if(item.id!=='WORLD_TOUR') {setSelectedDest(null); setCharacter(null);} }} className={`relative p-2 transition-all ${mode === item.id ? 'text-indigo-400 scale-125' : 'text-slate-600'}`}>
               <i className={`fas ${item.icon} text-xl`}></i>
               {mode === item.id && <span className="absolute -top-1 right-0 w-1.5 h-1.5 bg-indigo-400 rounded-full"></span>}
             </button>
           ))}
        </nav>
      </main>

      {showLevelInfo && <LevelInfoModal userStats={stats} onClose={() => setShowLevelInfo(false)} />}
    </div>
  );
};

export default App;
