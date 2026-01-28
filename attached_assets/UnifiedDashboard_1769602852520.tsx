
import React from 'react';
import { UserStats, AnalysisResult, Bookmark } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface UnifiedDashboardProps {
  stats: UserStats;
  recentHistory: AnalysisResult[];
  bookmarks: Bookmark[];
  onStartMission: () => void;
  onReviewNow: () => void;
  onStartLevelTest: () => void;
  onDeleteHistory: (id: string) => void;
  onLevelClick: () => void;
}

const UnifiedDashboard: React.FC<UnifiedDashboardProps> = ({ stats, recentHistory, bookmarks, onStartMission, onReviewNow, onStartLevelTest, onDeleteHistory, onLevelClick }) => {
  const chartData = (stats.dailyHistory || []).map(h => {
    const dayName = new Date(h.date).toLocaleDateString('en-US', { weekday: 'short' });
    return { name: dayName, xp: h.xp };
  });

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-700 pb-32">
      {/* 2x2 Grid for Mobile */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
         {[
           { label: 'Proficiency', val: stats.proficiency || 'Unranked', icon: 'fa-medal', color: 'text-indigo-400', click: onLevelClick },
           { label: 'Streak', val: stats.streak || 0, icon: 'fa-fire', color: 'text-orange-500' },
           { label: 'Vault', val: (bookmarks || []).length, icon: 'fa-bookmark', color: 'text-emerald-400' },
           { label: 'Level', val: stats.level || 1, icon: 'fa-bolt', color: 'text-blue-400', click: onLevelClick },
         ].map((item, i) => (
           <div key={i} onClick={item.click} className="glass p-4 md:p-7 rounded-2xl md:rounded-[40px] border border-white/5 flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-6 cursor-pointer">
              <div className={`w-10 h-10 md:w-16 md:h-16 rounded-xl md:rounded-3xl bg-white/5 flex items-center justify-center text-lg md:text-3xl ${item.color}`}>
                 <i className={`fas ${item.icon}`}></i>
              </div>
              <div className="min-w-0 flex-1 text-center md:text-left">
                 <p className="text-[8px] md:text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1 truncate">{item.label}</p>
                 <p className="text-[10px] md:text-xl font-black italic text-white truncate uppercase">{item.val}</p>
              </div>
           </div>
         ))}
      </section>

      {/* Assessment Banner - Always full width */}
      {(!stats.proficiency || stats.proficiency === 'Unranked') && (
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-6 md:p-12 text-white shadow-2xl">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-16 h-16 md:w-28 md:h-28 bg-white/20 rounded-full flex items-center justify-center text-3xl md:text-5xl animate-pulse">
               <i className="fas fa-brain"></i>
            </div>
            <div className="text-center md:text-left flex-1">
              <h2 className="text-xl md:text-4xl font-black italic uppercase mb-2">Initialize Assessment</h2>
              <p className="text-indigo-100 text-[10px] md:text-lg opacity-80 mb-6">당신의 언어 신경망을 분석하여 레벨을 설정합니다.</p>
              <button onClick={onStartLevelTest} className="w-full md:w-auto px-8 py-3.5 bg-white text-indigo-600 rounded-xl font-black uppercase text-xs">시작하기</button>
            </div>
          </div>
        </div>
      )}

      {/* Chart - Hidden or smaller on mobile to save space if needed, but here we show 1-col */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="lg:col-span-2 glass p-5 md:p-10 rounded-3xl md:rounded-[48px] border border-white/5">
            <h3 className="text-sm md:text-2xl font-black italic uppercase mb-6 flex items-center gap-3">
               <i className="fas fa-chart-line text-indigo-500"></i> Learning Velocity
            </h3>
            <div className="h-48 md:h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorXp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" hide />
                  <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '12px', fontSize: '10px' }} />
                  <Area type="monotone" dataKey="xp" stroke="#6366f1" strokeWidth={3} fill="url(#colorXp)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
         </div>

         {/* Quick Task - 1-col mobile */}
         <div className="glass p-6 md:p-10 rounded-3xl md:rounded-[48px] border border-white/5 flex flex-col gap-4">
            <h3 className="text-sm md:text-2xl font-black italic uppercase flex items-center gap-3">
               <i className="fas fa-bolt text-amber-400"></i> Quick Sync
            </h3>
            <div className="space-y-3">
               <button onClick={onStartMission} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl">Media Shadowing</button>
               <button onClick={onReviewNow} className="w-full py-4 bg-white/5 text-slate-400 rounded-2xl font-black uppercase text-[10px] tracking-widest border border-white/5">Vault Review</button>
            </div>
         </div>
      </div>
    </div>
  );
};

export default UnifiedDashboard;
