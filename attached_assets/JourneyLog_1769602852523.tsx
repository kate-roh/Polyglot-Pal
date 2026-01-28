
import React, { useState, useMemo } from 'react';
import { JourneyReport, SavedExpression, AnalysisResult } from '../types';

interface JourneyLogProps {
  history: JourneyReport[];
  mediaHistory: AnalysisResult[];
  savedExpressions: SavedExpression[];
  onSaveExpression: (exp: SavedExpression) => void;
  onDeleteLog: (id: string) => void;
}

const JourneyLog: React.FC<JourneyLogProps> = ({ history, mediaHistory, savedExpressions, onSaveExpression, onDeleteLog }) => {
  const [activeTab, setActiveTab] = useState<'journeys' | 'bookmarks'>('journeys');
  const [selectedLog, setSelectedLog] = useState<JourneyReport | null>(null);
  const [selectedDate, setSelectedDate] = useState<number | null>(new Date().getDate());

  const groupedHistory = useMemo(() => {
    const groups: Record<string, JourneyReport[]> = {};
    history.forEach(log => {
      const date = new Date(log.date);
      const key = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(log);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [history]);

  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  
  // 캘린더 월요일 시작 로직 (Mon-Sun)
  // JS getDay(): 0(일) ~ 6(토)
  // 월요일을 0으로 변환: (getDay() + 6) % 7
  const firstDayOfMonthRaw = new Date(currentYear, currentMonth, 1).getDay();
  const firstDayIdx = (firstDayOfMonthRaw + 6) % 7; 

  const activeDaysData = useMemo(() => {
    const dayMap: Record<number, any[]> = {};
    [...history, ...mediaHistory].forEach(item => {
      const d = new Date(item.date);
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        const dayNum = d.getDate();
        if (!dayMap[dayNum]) dayMap[dayNum] = [];
        dayMap[dayNum].push(item);
      }
    });
    return dayMap;
  }, [history, mediaHistory, currentMonth, currentYear]);

  const filteredLogsForSelectedDay = useMemo(() => {
    if (selectedDate === null) return [];
    return activeDaysData[selectedDate] || [];
  }, [selectedDate, activeDaysData]);

  const formatDateShort = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-500 pb-32 bg-[#0b0e14]">
      <div className="p-4 md:p-8 max-w-6xl mx-auto w-full flex-1 space-y-6 md:space-y-8">
        
        {/* Activity Calendar (Monday Start) */}
        <section className="glass p-5 md:p-10 rounded-[40px] border border-white/5 shadow-2xl relative bg-white/[0.01]">
          <header className="flex justify-between items-center mb-6 md:mb-10">
            <div>
              <h3 className="text-xl md:text-2xl font-black italic uppercase tracking-tighter">Activity Radar</h3>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Neural History Log</p>
            </div>
            <div className="px-3 py-1.5 bg-indigo-600/10 rounded-xl border border-indigo-500/20">
              <span className="text-indigo-400 font-black uppercase text-[10px]">
                {new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(today)}
              </span>
            </div>
          </header>
          
          <div className="grid grid-cols-7 gap-1 md:gap-3 mb-6">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(d => (
              <div key={d} className="text-center text-[10px] font-black text-slate-600 py-2 uppercase tracking-widest">{d}</div>
            ))}
            {/* 빈 칸 채우기 */}
            {Array.from({ length: firstDayIdx }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square opacity-0"></div>
            ))}
            {/* 날짜 채우기 */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayRecords = activeDaysData[day] || [];
              const isActive = dayRecords.length > 0;
              const isToday = day === today.getDate();
              const isSelected = selectedDate === day;
              
              return (
                <button 
                  key={day} 
                  onClick={() => setSelectedDate(day)}
                  className={`aspect-square rounded-2xl flex flex-col items-center justify-center relative transition-all active:scale-95 ${
                    isSelected ? 'bg-indigo-600 text-white shadow-lg' :
                    isActive ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold' : 'bg-white/5 text-slate-600'
                  } ${isToday && !isSelected ? 'ring-2 ring-indigo-500/50' : ''}`}
                >
                  <span className="text-xs md:text-sm">{day}</span>
                  {isActive && !isSelected && <div className="absolute bottom-2 w-1 h-1 bg-indigo-500 rounded-full"></div>}
                </button>
              );
            })}
          </div>

          <div className="animate-in fade-in duration-300">
             <div className="flex items-center gap-3 mb-4">
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Logs for {selectedDate}th</span>
                <div className="h-[1px] flex-1 bg-white/5"></div>
             </div>
             {filteredLogsForSelectedDay.length === 0 ? (
               <p className="text-center text-[10px] text-slate-700 py-10 italic">No activity recorded for this timestamp.</p>
             ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                 {filteredLogsForSelectedDay.map((record: any) => (
                   <div key={record.id} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between group hover:bg-white/10 transition-all">
                      <div className="flex items-center gap-4 min-w-0">
                         <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 text-sm">
                            <i className={`fas ${record.type ? (record.type === 'youtube' ? 'fa-play' : 'fa-file-alt') : 'fa-globe-americas'}`}></i>
                         </div>
                         <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate">{record.title || record.city}</p>
                            <p className="text-[9px] text-slate-500 font-black uppercase mt-1 tracking-tighter">{formatDateShort(record.date)} // {record.cefrLevel || 'EXPEDITION'}</p>
                         </div>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onDeleteLog(record.id); }}
                        className="w-9 h-9 flex items-center justify-center text-slate-700 hover:text-red-500 transition-all active:scale-90"
                      >
                        <i className="fas fa-trash-alt text-[11px]"></i>
                      </button>
                   </div>
                 ))}
               </div>
             )}
          </div>
        </section>

        {/* Tab System */}
        <div className="flex p-1 bg-white/5 rounded-2xl border border-white/10 w-full overflow-hidden">
          <button onClick={() => setActiveTab('journeys')} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'journeys' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}>Expeditions</button>
          <button onClick={() => setActiveTab('bookmarks')} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'bookmarks' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}>Knowledge Vault</button>
        </div>

        {activeTab === 'journeys' ? (
          <div className="space-y-10">
            {groupedHistory.map(([month, logs]) => (
              <div key={month} className="space-y-6">
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-black italic text-indigo-500/50 uppercase tracking-tighter">{month}</span>
                  <div className="h-[1px] flex-1 bg-white/5"></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {logs.map(log => (
                    <div key={log.id} onClick={() => setSelectedLog(log)} className="glass p-6 rounded-[32px] border border-white/5 hover:neon-border transition-all cursor-pointer relative bg-white/[0.02]">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 flex items-center justify-center text-indigo-400 text-lg"><i className="fas fa-id-card"></i></div>
                        <div>
                          <h4 className="font-bold text-white text-base">{log.city}</h4>
                          <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{log.destination}</p>
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2 italic leading-relaxed">"{log.summary}"</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 pb-20">
            {savedExpressions.map(exp => (
              <div key={exp.id} className="p-6 glass rounded-[32px] border border-white/5 relative group transition-all bg-white/[0.02]">
                 <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase mb-3 inline-block ${exp.type === 'word' ? 'bg-amber-500/20 text-amber-400' : 'bg-indigo-500/20 text-indigo-400'}`}>{exp.type}</span>
                 <h5 className="text-lg font-bold text-white mb-2 leading-tight">{exp.text}</h5>
                 <p className="text-sm text-slate-400 leading-relaxed italic">"{exp.translation}"</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedLog && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-[#0b0e14]/95 backdrop-blur-xl" onClick={() => setSelectedLog(null)}></div>
          <div className="relative glass w-full max-w-2xl h-full max-h-[70vh] rounded-[40px] overflow-hidden flex flex-col animate-in zoom-in-95 shadow-[0_40px_100px_rgba(0,0,0,0.8)]">
            <header className="p-8 border-b border-white/5 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">{selectedLog.city} Mission</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Data Reconstruction</p>
              </div>
              <button onClick={() => setSelectedLog(null)} className="w-12 h-12 rounded-full hover:bg-white/10 flex items-center justify-center transition-all active:scale-90"><i className="fas fa-times"></i></button>
            </header>
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
               <div className="space-y-10">
                  <section>
                    <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">Neural Debrief</h4>
                    <p className="text-xl text-slate-200 leading-relaxed font-medium italic">"{selectedLog.summary}"</p>
                  </section>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="p-6 glass rounded-3xl border border-white/5">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Sector Node</p>
                      <p className="text-base font-bold text-white uppercase tracking-tighter">{selectedLog.city}</p>
                    </div>
                    <div className="p-6 glass rounded-3xl border border-white/5">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Entry Timestamp</p>
                      <p className="text-base font-bold text-white uppercase tracking-tighter">{new Date(selectedLog.date).toLocaleDateString()}</p>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JourneyLog;
