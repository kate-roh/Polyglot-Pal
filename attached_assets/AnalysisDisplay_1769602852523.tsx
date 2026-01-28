
import React, { useState, useEffect } from 'react';
import { AnalysisResult, Bookmark, DialogueLine } from '../types';
import { GeminiService } from '../services/geminiService';
import ShadowingModal from './ShadowingModal';
import FloatingAIChat from './FloatingAIChat';

interface AnalysisDisplayProps {
  result: AnalysisResult | null;
  onBack: () => void;
  gemini: GeminiService;
  onAddXP: (amount: number, score?: number) => void;
  onToggleBookmark: (item: any, type: Bookmark['type'], sourceType: Bookmark['sourceType']) => void;
}

const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ result, onBack, gemini, onAddXP, onToggleBookmark }) => {
  const [activeTab, setActiveTab] = useState<'timeline' | 'insight'>('timeline');
  const [selectedLine, setSelectedLine] = useState<DialogueLine | null>(null);
  const [startTime, setStartTime] = useState(0);
  const [videoKey, setVideoKey] = useState(0);

  // 결과 데이터가 없으면 뒤로가기 실행 (검은 화면 방지)
  if (!result) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-[#0b0e14]">
        <i className="fas fa-exclamation-triangle text-amber-500 text-4xl mb-4"></i>
        <p className="text-slate-400 mb-6">데이터를 불러오지 못했습니다. 분석을 다시 시도해주세요.</p>
        <button onClick={onBack} className="px-6 py-3 bg-indigo-600 rounded-xl font-bold">뒤로가기</button>
      </div>
    );
  }

  const youtubeId = result.type === 'youtube' 
    ? result.source.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/)?.[1] 
    : null;

  const handleJumpToTime = (line: DialogueLine) => {
    setStartTime(line.seconds || 0);
    setVideoKey(prev => prev + 1);
    gemini.speak(line.text);
  };

  const renderTimeline = () => (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32">
      {result.script && result.script.length > 0 ? result.script.map((line, i) => (
        <div key={i} className="group relative px-2">
          <div className="glass p-5 md:p-6 rounded-[32px] border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all">
            <div className="flex justify-between items-center mb-4">
               <button 
                  onClick={() => handleJumpToTime(line)}
                  className="px-3 py-1 bg-indigo-500/20 text-indigo-400 rounded-full text-[9px] font-black tracking-widest uppercase"
                >
                  <i className="fas fa-play mr-1.5"></i> {line.timestamp || '0:00'}
                </button>
                <div className="flex gap-2">
                   <button onClick={() => gemini.speak(line.text)} className="w-9 h-9 rounded-xl bg-white/5 text-indigo-400 flex items-center justify-center active:scale-90 transition-transform">
                      <i className="fas fa-volume-up text-sm"></i>
                   </button>
                   <button onClick={() => setSelectedLine(line)} className="w-9 h-9 rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 flex items-center justify-center active:scale-90 transition-transform">
                      <i className="fas fa-microphone text-sm"></i>
                   </button>
                </div>
            </div>

            <h4 className="text-base md:text-xl font-bold text-white leading-relaxed mb-1">{line.text}</h4>
            <p className="text-indigo-300/80 text-xs md:text-sm font-medium italic mb-4">"{line.translation || '해석을 불러오는 중...'}"</p>

            {/* 인라인 단어/관용구 데이터 */}
            {( (line.vocabulary && line.vocabulary.length > 0) || (line.idioms && line.idioms.length > 0) ) && (
              <div className="space-y-3 mt-4 pt-4 border-t border-white/5">
                {line.vocabulary && line.vocabulary.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {line.vocabulary.map((v, idx) => (
                      <div key={idx} className="bg-white/5 px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-2">
                         <span className="text-[10px] font-black text-white">{v.word}</span>
                         <span className="text-[9px] text-slate-500 border-l border-white/10 pl-2">{v.meaning}</span>
                      </div>
                    ))}
                  </div>
                )}
                {line.idioms && line.idioms.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {line.idioms.map((id, idx) => (
                      <div key={idx} className="bg-indigo-500/10 px-3 py-1.5 rounded-xl border border-indigo-500/20 flex items-center gap-2">
                         <span className="text-[10px] font-black text-indigo-400">{id.phrase}</span>
                         <span className="text-[9px] text-indigo-300/50 border-l border-indigo-500/20 pl-2">{id.meaning}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )) : (
        <div className="text-center py-20 px-8">
          <i className="fas fa-microchip text-slate-800 text-5xl mb-4"></i>
          <p className="text-slate-600 italic font-medium">분석된 스크립트가 없습니다. 잠시 후 다시 시도해주시거나, 파일을 확인해주세요.</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-[#0b0e14] overflow-hidden">
      {youtubeId ? (
        <div className="w-full bg-black sticky top-0 z-[60] shadow-2xl pt-[env(safe-area-inset-top)]">
          <div className="max-w-4xl mx-auto video-container">
            <iframe 
              key={videoKey} 
              src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&start=${startTime}`} 
              frameBorder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
            ></iframe>
          </div>
        </div>
      ) : (
        <div className="h-1 bg-indigo-600/20 w-full overflow-hidden">
           <div className="h-full bg-indigo-600 animate-[progress_2s_infinite] origin-left"></div>
        </div>
      )}

      <header className="px-6 py-4 glass border-b border-white/5 flex items-center justify-between z-50">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="w-9 h-9 rounded-full bg-white/5 text-slate-400 flex items-center justify-center active:scale-90 transition-transform">
              <i className="fas fa-chevron-left text-sm"></i>
            </button>
            <div className="min-w-0">
               <h3 className="text-[11px] font-black text-white uppercase tracking-widest truncate max-w-[120px]">{result.title || 'Analysis'}</h3>
               <p className="text-[9px] text-indigo-500 font-bold uppercase tracking-[0.2em]">{result.cefrLevel || 'A1'} Intelligence</p>
            </div>
          </div>
          
          <div className="flex p-1 bg-white/10 rounded-xl border border-white/5">
             <button onClick={() => setActiveTab('timeline')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'timeline' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}>Timeline</button>
             <button onClick={() => setActiveTab('insight')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'insight' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}>Insight</button>
          </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-10 custom-scrollbar">
        <div className="max-w-4xl mx-auto">
          {activeTab === 'timeline' ? renderTimeline() : (
            <div className="glass p-10 rounded-[40px] border border-white/5 bg-indigo-600/5 animate-in fade-in duration-500">
               <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">Neural Summary</h4>
               <p className="text-xl text-slate-200 leading-relaxed italic font-medium">"{result.summary || '요약 정보를 생성하지 못했습니다.'}"</p>
            </div>
          )}
        </div>
      </div>

      <FloatingAIChat gemini={gemini} context={result.summary || ''} />
      {selectedLine && (
        <ShadowingModal line={selectedLine} onClose={() => setSelectedLine(null)} gemini={gemini} onAddXP={onAddXP} />
      )}
    </div>
  );
};

export default AnalysisDisplay;
