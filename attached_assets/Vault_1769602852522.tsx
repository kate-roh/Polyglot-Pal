
import React, { useState } from 'react';
import { Bookmark } from '../types';

interface VaultProps {
  bookmarks: Bookmark[];
  onToggleBookmark: (item: any, type: Bookmark['type'], sourceType: Bookmark['sourceType']) => void;
  onAddXP: (amount: number) => void;
  onStartTraining: () => void;
}

const Vault: React.FC<VaultProps> = ({ bookmarks, onToggleBookmark, onStartTraining }) => {
  const [filter, setFilter] = useState<'ALL' | 'WORD' | 'EXPRESSION' | 'SENTENCE'>('ALL');

  const filtered = bookmarks.filter(b => filter === 'ALL' || b.type.toUpperCase() === filter);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
         <div>
            <h2 className="text-4xl font-black italic tracking-tighter uppercase mb-2">Linguistic Vault</h2>
            <p className="text-slate-500 font-medium">Your curated collection of intelligence from across the globe.</p>
         </div>
         <div className="flex p-1 bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
            {['ALL', 'WORD', 'EXPRESSION', 'SENTENCE'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  filter === f ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
         </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filtered.length === 0 ? (
          <div className="col-span-full py-32 glass rounded-[40px] text-center border-2 border-dashed border-white/5">
             <i className="fas fa-box-open text-6xl text-slate-800 mb-6"></i>
             <h4 className="text-xl font-bold text-slate-600">The Vault is Empty</h4>
             <p className="text-slate-700 mt-2">Study Media or travel to World Tour to save expressions.</p>
          </div>
        ) : (
          filtered.map(b => (
            <div key={b.id} className="group glass p-6 rounded-[32px] border border-white/5 hover:neon-border transition-all relative overflow-hidden">
               <button 
                 onClick={() => onToggleBookmark(b, b.type, b.sourceType)}
                 className="absolute top-4 right-4 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
               >
                 <i className="fas fa-trash-alt"></i>
               </button>
               <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase mb-4 inline-block ${
                 b.type === 'word' ? 'bg-amber-500/20 text-amber-400' : 'bg-indigo-500/20 text-indigo-400'
               }`}>
                 {b.type}
               </span>
               <h4 className="text-xl font-black text-white mb-2 leading-tight">{b.text}</h4>
               <p className="text-sm text-slate-400 mb-6">{b.translation}</p>
               <div className="flex justify-between items-center border-t border-white/5 pt-4">
                  <div className="flex items-center gap-2">
                     <i className={`fas ${b.sourceType === 'MEDIA' ? 'fa-clapperboard' : 'fa-globe'} text-[10px] text-slate-600`}></i>
                     <span className="text-[10px] font-bold text-slate-600 uppercase">{b.sourceType}</span>
                  </div>
                  <button className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                     <i className="fas fa-volume-high text-xs text-indigo-400"></i>
                  </button>
               </div>
            </div>
          ))
        )}
      </div>

      <section className="bg-indigo-900/20 rounded-[40px] p-10 border border-indigo-500/20 flex flex-col md:flex-row items-center gap-10">
         <div className="flex-1 space-y-4">
            <h3 className="text-3xl font-black italic uppercase tracking-tighter">Ready for Training?</h3>
            <p className="text-slate-400 leading-relaxed">AI will now randomize your saved bookmarks into a high-intensity flashcard challenge to ensure long-term retention.</p>
            <div className="pt-4">
               <button onClick={onStartTraining} className="px-10 py-4 bg-indigo-600 rounded-2xl font-bold text-lg hover:scale-105 transition-transform flex items-center gap-3">
                  <i className="fas fa-play"></i>
                  Start Flashcard Session
               </button>
            </div>
         </div>
         <div className="w-64 h-64 bg-white/5 rounded-full flex items-center justify-center relative">
            <i className="fas fa-brain text-8xl text-indigo-500/50"></i>
            <div className="absolute inset-0 border-4 border-dashed border-indigo-500/30 rounded-full animate-[spin_20s_linear_infinite]"></div>
         </div>
      </section>
    </div>
  );
};

export default Vault;
