
import React from 'react';
import { UserStats } from '../types';

interface LevelInfoModalProps {
  userStats: UserStats;
  onClose: () => void;
}

const LevelInfoModal: React.FC<LevelInfoModalProps> = ({ userStats, onClose }) => {
  const levels = [
    { rank: 'C2', title: 'Mastery', range: 'Lv 81+', desc: '네이티브 수준의 복잡한 주제 이해 및 유창한 표현 가능' },
    { rank: 'C1', title: 'Advanced', range: 'Lv 51-80', desc: '광범위하고 까다로운 텍스트 이해 및 자연스러운 의사소통 가능' },
    { rank: 'B2', title: 'Upper Int.', range: 'Lv 31-50', desc: '추상적 주제의 핵심 이해 및 사회적 상호작용 원활' },
    { rank: 'B1', title: 'Intermediate', range: 'Lv 16-30', desc: '여행 상황 대처 및 친숙한 주제에 대한 간단한 설명 가능' },
    { rank: 'A2', title: 'Elementary', range: 'Lv 6-15', desc: '일상적인 정보 교환 및 단순한 문장 사용 가능' },
    { rank: 'A1', title: 'Beginner', range: 'Lv 1-5', desc: '기초적인 일상 용어 및 아주 단순한 문장 이해 가능' },
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6">
      <div className="absolute inset-0 bg-[#0b0e14]/90 backdrop-blur-xl" onClick={onClose}></div>
      <div className="relative glass w-full max-w-lg rounded-[40px] p-8 md:p-10 border border-white/10 shadow-2xl animate-in zoom-in-95 duration-300 overflow-y-auto max-h-[90vh]">
        <header className="flex justify-between items-center mb-8">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 flex items-center justify-center text-indigo-400">
                <i className="fas fa-medal"></i>
              </div>
              <h3 className="text-2xl font-black italic uppercase tracking-tighter">Proficiency Radar</h3>
           </div>
           <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors">
              <i className="fas fa-times"></i>
           </button>
        </header>

        <div className="mb-8 p-6 bg-indigo-600/10 rounded-3xl border border-indigo-500/20">
           <div className="flex justify-between items-end mb-3">
              <div>
                 <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Current Status</p>
                 <h4 className="text-3xl font-black italic text-white uppercase">{userStats.proficiency || 'Unranked'}</h4>
              </div>
              <div className="text-right">
                 <p className="text-2xl font-black text-indigo-500">Lv.{userStats.level}</p>
              </div>
           </div>
           <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500" style={{ width: `${(userStats.xp / 500) * 100}%` }}></div>
           </div>
           <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-2 text-right">XP: {userStats.xp} / 500 to Next Node</p>
        </div>

        <div className="space-y-4">
           {levels.map((l) => {
              const isActive = (userStats.proficiency || '').includes(l.rank);
              return (
                <div key={l.rank} className={`p-4 rounded-2xl border transition-all ${isActive ? 'bg-indigo-600/20 border-indigo-500/50' : 'bg-white/5 border-white/5 opacity-50'}`}>
                   <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-3">
                         <span className="text-lg font-black italic text-indigo-400">{l.rank}</span>
                         <span className="text-sm font-bold text-white">{l.title}</span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-500">{l.range}</span>
                   </div>
                   <p className="text-[11px] text-slate-400 leading-relaxed">{l.desc}</p>
                </div>
              );
           })}
        </div>
        
        <p className="text-center text-[9px] text-slate-700 font-bold uppercase mt-8 tracking-[0.3em]">CEFR Standardized Intelligence Matrix</p>
      </div>
    </div>
  );
};

export default LevelInfoModal;
