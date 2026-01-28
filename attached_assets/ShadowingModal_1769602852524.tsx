
import React, { useState } from 'react';
import { DialogueLine } from '../types';
import { GeminiService } from '../services/geminiService';

interface ShadowingModalProps {
  line: DialogueLine;
  onClose: () => void;
  gemini: GeminiService;
  onAddXP: (amount: number, bonusScore?: number) => void;
}

const ShadowingModal: React.FC<ShadowingModalProps> = ({ line, onClose, gemini, onAddXP }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const startRecording = async () => {
    // Ensure audio is unlocked on first interaction
    await gemini.unlockAudio();
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("이 브라우저에서는 음성 인식을 지원하지 않습니다.");
    
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);
    recognition.onresult = async (e: any) => {
      const transcript = e.results[0][0].transcript;
      setLoading(true);
      try {
        const res = await gemini.evaluateShadowing(line.text, transcript);
        setEvaluation({ ...res, transcript });
        
        // 성과에 따른 레벨링 반영 (90점 이상 보너스)
        onAddXP(20, res.score);
      } catch (err) {
        console.error(err);
        alert("평가 중 오류가 발생했습니다. 다시 시도해 주세요.");
      } finally {
        setLoading(false);
      }
    };
    recognition.start();
  };

  const handleAIDictation = async () => {
    await gemini.unlockAudio();
    gemini.speak(line.text);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-[#0b0e14]/90 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative glass w-full max-w-2xl rounded-[40px] p-10 border border-white/5 shadow-2xl animate-in zoom-in-95 duration-300">
        <header className="flex justify-between items-center mb-8">
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/20 flex items-center justify-center text-indigo-400">
                <i className="fas fa-microphone-lines"></i>
              </div>
              <h3 className="text-2xl font-black italic uppercase tracking-tighter">Shadowing Drill</h3>
           </div>
           <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors">
              <i className="fas fa-times"></i>
           </button>
        </header>

        <div className="space-y-8">
           <div className="text-center space-y-4">
              <h4 className="text-3xl font-bold text-white leading-tight px-4">{line.text}</h4>
              <p className="text-slate-500 font-medium italic">"{line.translation}"</p>
              <button 
                onClick={handleAIDictation}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
              >
                <i className="fas fa-volume-high"></i> Listen to AI
              </button>
           </div>

           <div className="flex flex-col items-center gap-6">
              {!evaluation ? (
                <div className="flex flex-col items-center gap-4">
                  <button 
                    onClick={startRecording}
                    disabled={loading}
                    className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl transition-all shadow-xl ${
                      isRecording 
                        ? 'bg-red-500 animate-pulse text-white shadow-red-500/40 ring-4 ring-red-500/20' 
                        : 'bg-indigo-600 text-white hover:scale-105 shadow-indigo-600/30'
                    }`}
                  >
                    {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-microphone"></i>}
                  </button>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">
                    {isRecording ? "녹음 중..." : "클릭하여 녹음 시작"}
                  </p>
                </div>
              ) : (
                <div className="w-full space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                   <div className="glass p-8 rounded-[32px] border border-white/5 relative overflow-hidden bg-white/[0.02]">
                      <div className="flex justify-between items-end relative z-10">
                        <div>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Intelligence Score</p>
                          <p className={`text-6xl font-black italic leading-none ${
                            evaluation.score >= 80 ? 'text-emerald-400' : 
                            evaluation.score >= 50 ? 'text-amber-400' : 'text-rose-400'
                          }`}>
                            {evaluation.score}
                            <span className="text-lg text-slate-600 ml-2">/ 100</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Status</p>
                          <p className="font-black text-white uppercase text-sm tracking-tighter">
                            {evaluation.score >= 90 ? 'Perfect Sync' : 
                             evaluation.score >= 80 ? 'Excellent' :
                             evaluation.score >= 60 ? 'Good Progress' : 'Needs Calibration'}
                          </p>
                        </div>
                      </div>
                      <div className="mt-6 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-1000 ${
                            evaluation.score >= 80 ? 'bg-emerald-500' : 
                            evaluation.score >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${evaluation.score}%` }}
                        ></div>
                      </div>
                   </div>

                   <div className="space-y-4">
                     <div className="p-5 bg-white/5 rounded-2xl border border-white/5">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                          <i className="fas fa-waveform text-indigo-400"></i> Recorded Input
                        </p>
                        <p className="text-slate-300 italic font-medium">"{evaluation.transcript}"</p>
                     </div>
                     
                     <div className="p-6 bg-indigo-500/10 rounded-[24px] border border-indigo-500/20 relative overflow-hidden">
                        <div className="relative z-10">
                          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Neural Feedback (KR)</p>
                          <p className="text-sm text-indigo-50 leading-relaxed font-medium">
                            {evaluation.feedback}
                          </p>
                        </div>
                        <i className="fas fa-brain absolute -bottom-4 -right-4 text-6xl text-indigo-500/5 rotate-12"></i>
                     </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                     <button 
                       onClick={() => setEvaluation(null)}
                       className="py-4 bg-white/5 border border-white/10 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-white/10 transition-all text-slate-400"
                     >
                       다시 시도
                     </button>
                     <button 
                       onClick={onClose}
                       className="py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
                     >
                       완료 및 닫기
                     </button>
                   </div>
                </div>
              )}
           </div>
        </div>
        <p className="text-center text-[9px] text-slate-700 font-bold uppercase mt-8 tracking-[0.3em]">Neural Shadowing System v2.6 // Level Measured</p>
      </div>
    </div>
  );
};

export default ShadowingModal;
