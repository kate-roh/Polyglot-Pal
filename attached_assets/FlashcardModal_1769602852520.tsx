
import React, { useState } from 'react';
import { Bookmark } from '../types';

interface FlashcardModalProps {
  bookmarks: Bookmark[];
  onClose: () => void;
  onAddXP: (amount: number) => void;
}

const FlashcardModal: React.FC<FlashcardModalProps> = ({ bookmarks, onClose, onAddXP }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [finished, setFinished] = useState(false);

  const current = bookmarks[currentIdx];

  const handleNext = (difficulty: 'hard' | 'normal' | 'easy') => {
    const xpMap = { hard: 5, normal: 10, easy: 15 };
    onAddXP(xpMap[difficulty]);
    
    if (currentIdx < bookmarks.length - 1) {
      setCurrentIdx(prev => prev + 1);
      setIsFlipped(false);
    } else {
      setFinished(true);
    }
  };

  if (bookmarks.length === 0) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
        <div className="absolute inset-0 bg-[#0b0e14]/90 backdrop-blur-md" onClick={onClose}></div>
        <div className="relative glass p-10 rounded-[40px] text-center space-y-4">
          <p className="text-slate-400 font-medium">No bookmarks available for review.</p>
          <button onClick={onClose} className="px-6 py-2 bg-indigo-600 rounded-xl font-bold">Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-[#0b0e14]/90 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative glass w-full max-w-xl rounded-[40px] p-10 border border-white/5 shadow-2xl animate-in zoom-in-95 duration-300 min-h-[500px] flex flex-col">
        {finished ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
             <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 text-4xl">
               <i className="fas fa-check-circle"></i>
             </div>
             <h3 className="text-3xl font-black italic uppercase tracking-tighter">Session Complete</h3>
             <p className="text-slate-400">You've reviewed all cards! Intelligence sync successful.</p>
             <button onClick={onClose} className="w-full py-4 bg-indigo-600 rounded-2xl font-bold">Return to Hub</button>
          </div>
        ) : (
          <>
            <header className="flex justify-between items-center mb-10">
               <div>
                  <h3 className="text-xl font-black italic uppercase tracking-tighter">Flashcard Ops</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Card {currentIdx + 1} of {bookmarks.length}</p>
               </div>
               <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center">
                  <i className="fas fa-times"></i>
               </button>
            </header>

            <div className="flex-1 perspective-1000">
               <div 
                 onClick={() => setIsFlipped(!isFlipped)}
                 className={`relative w-full h-64 transition-all duration-500 preserve-3d cursor-pointer ${isFlipped ? 'rotate-y-180' : ''}`}
               >
                  <div className="absolute inset-0 backface-hidden glass rounded-3xl flex flex-col items-center justify-center p-8 text-center border border-white/10">
                     <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-4">Foreign Intelligence</span>
                     <h4 className="text-3xl font-bold text-white leading-tight">{current.text}</h4>
                  </div>
                  <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl flex flex-col items-center justify-center p-8 text-center rotate-y-180">
                     <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-4">Local Meaning</span>
                     <h4 className="text-2xl font-bold text-white leading-tight">{current.translation}</h4>
                  </div>
               </div>
            </div>

            <div className="mt-10">
               {isFlipped ? (
                 <div className="grid grid-cols-3 gap-4 animate-in slide-in-from-bottom-2 duration-300">
                   {[
                     { id: 'hard', label: 'Hard', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
                     { id: 'normal', label: 'Good', color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' },
                     { id: 'easy', label: 'Easy', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' }
                   ].map(btn => (
                     <button
                       key={btn.id}
                       onClick={(e) => { e.stopPropagation(); handleNext(btn.id as any); }}
                       className={`py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 ${btn.color}`}
                     >
                       {btn.label}
                     </button>
                   ))}
                 </div>
               ) : (
                 <p className="text-center text-[10px] text-slate-500 font-bold uppercase tracking-widest animate-pulse">Click card to reveal meaning</p>
               )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FlashcardModal;
