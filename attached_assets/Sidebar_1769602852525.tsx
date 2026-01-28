
import React from 'react';
import { AppMode, UserStats } from '../types';

interface SidebarProps {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  stats: UserStats;
}

const Sidebar: React.FC<SidebarProps> = ({ mode, setMode, stats }) => {
  const menuItems: { id: AppMode; icon: string; label: string }[] = [
    { id: 'HOME', icon: 'fa-house', label: 'Home' },
    { id: 'WORLD_TOUR', icon: 'fa-globe', label: 'World Tour' },
    { id: 'TUTOR', icon: 'fa-headset', label: 'Live Tutor' },
    { id: 'GRAMMAR_LAB', icon: 'fa-microscope', label: 'Grammar Lab' },
    { id: 'MEDIA_STUDIO', icon: 'fa-clapperboard', label: 'Media Studio' },
    { id: 'EXPLORER', icon: 'fa-camera', label: 'Visual Explorer' },
    { id: 'VAULT', icon: 'fa-vault', label: 'Vault' },
    { id: 'HISTORY', icon: 'fa-clock-rotate-left', label: 'Mission Logs' },
  ];

  // Daily XP Goal is 200 XP
  const dailyGoalXP = 200;
  const progressPercent = Math.min(100, Math.round((stats.xpToday / dailyGoalXP) * 100));

  return (
    <aside className="w-20 md:w-64 border-r border-white/5 bg-black/40 flex flex-col h-full z-50">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
          <i className="fas fa-bolt text-xl"></i>
        </div>
        <span className="hidden md:block font-black text-xl tracking-tighter uppercase italic">PolyHub</span>
      </div>

      <nav className="flex-1 px-4 space-y-1 mt-6">
        {menuItems.map(item => (
          <button
            key={item.id}
            onClick={() => setMode(item.id)}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
              mode === item.id 
                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' 
                : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'
            }`}
          >
            <i className={`fas ${item.icon} text-lg w-6`}></i>
            <span className="hidden md:block font-bold text-sm">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-6">
         <div className="hidden md:block p-5 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10">
               <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1">Daily Goal</p>
               <p className="text-lg font-black italic">{progressPercent}%</p>
               <p className="text-[8px] opacity-60 mt-1">{stats.xpToday} / {dailyGoalXP} XP</p>
               <div className="mt-2 h-1 w-full bg-black/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white rounded-full transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
               </div>
            </div>
            <i className="fas fa-award absolute -bottom-2 -right-2 text-6xl text-white/10 rotate-12"></i>
         </div>
      </div>
    </aside>
  );
};

export default Sidebar;
