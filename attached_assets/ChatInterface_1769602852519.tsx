
import React, { useState, useEffect, useRef } from 'react';
import { Destination, Character, Weather, Message, Scenario } from '../types';

interface ChatInterfaceProps {
  destination: Destination;
  character: Character;
  weather: Weather;
  messages: Message[];
  politeness: number;
  onSendMessage: (text: string) => void;
  onEndJourney: () => void;
  scenarios: Scenario[];
  currentScenario: Scenario;
  onSelectScenario: (s: Scenario) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  destination, character, weather, messages, politeness, onSendMessage, onEndJourney, scenarios, currentScenario, onSelectScenario 
}) => {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSTT = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Browser not supported");
    
    const recognition = new SpeechRecognition();
    recognition.lang = destination.language.code;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      onSendMessage(transcript);
    };
    recognition.start();
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-[#0b0e14] relative overflow-hidden">
      {/* Header */}
      <header className="shrink-0 glass border-b border-white/5 p-3 md:p-4 z-[60] flex items-center justify-between gap-3 pt-[calc(0.75rem+env(safe-area-inset-top))]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl overflow-hidden border border-indigo-500/30 bg-slate-800 shrink-0">
            {character.avatarUrl ? (
              <img src={character.avatarUrl} className="w-full h-full object-cover" alt="" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-500 bg-indigo-500/10">
                <i className="fas fa-user text-sm"></i>
              </div>
            )}
          </div>
          <div className="min-w-0">
            <h4 className="font-black text-xs text-white truncate">{character.name}</h4>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-10 h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 transition-all" style={{ width: `${character.kindness * 10}%` }}></div>
              </div>
              <span className="text-[6px] text-slate-500 font-bold uppercase tracking-widest">Host</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
           <div className="hidden xs:flex flex-col items-end mr-2">
              <span className="text-[7px] text-slate-500 font-bold uppercase">{weather.condition}</span>
              <span className="text-xs font-black text-indigo-400">{weather.temp}°C</span>
           </div>
           <button onClick={() => setShowInfo(!showInfo)} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400"><i className="fas fa-info-circle text-xs"></i></button>
           <button onClick={onEndJourney} className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center"><i className="fas fa-sign-out-alt text-xs"></i></button>
        </div>
      </header>

      {/* Main Area */}
      <div className="flex-1 overflow-hidden relative flex">
        {showInfo && (
          <div className="absolute inset-0 z-[70] bg-[#0b0e14]/98 p-6 overflow-y-auto animate-in fade-in duration-300">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black italic text-white uppercase tracking-tighter">Mission Node</h3>
                <button onClick={() => setShowInfo(false)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"><i className="fas fa-times text-xs"></i></button>
             </div>
             <div className="space-y-6">
                <div className="rounded-[32px] overflow-hidden border border-white/10 aspect-video">
                  <img src={currentScenario.image} className="w-full h-full object-cover" alt="" />
                </div>
                <div className="glass p-5 rounded-3xl">
                   <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Environmental Tip</p>
                   <p className="text-xs text-slate-300 leading-relaxed italic">"{weather.tip}"</p>
                </div>
                <div className="space-y-2">
                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2">Objectives</p>
                   {scenarios.map(s => (
                     <button key={s.id} onClick={() => { onSelectScenario(s); setShowInfo(false); }} className={`w-full flex items-center gap-3 p-4 rounded-2xl border text-xs font-bold transition-all ${s.id === currentScenario.id ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white/5 border-transparent text-slate-500'}`}>
                        <i className={`fas ${s.icon}`}></i> {s.name}
                     </button>
                   ))}
                </div>
             </div>
          </div>
        )}

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-gradient-to-b from-transparent to-indigo-950/5">
          {messages.map((m, i) => (
            <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2`}>
              <div className={`max-w-[85%] p-4 rounded-[20px] ${
                m.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'glass border border-white/5 text-slate-200 rounded-bl-none'
              }`}>
                <p className="text-sm leading-relaxed">{m.content}</p>
              </div>
            </div>
          ))}
          <div className="h-32"></div>
        </div>
      </div>

      {/* Input Area */}
      <div className="shrink-0 absolute bottom-0 left-0 right-0 glass border-t border-white/10 px-4 py-3 pb-[calc(1rem+env(safe-area-inset-bottom))] z-[80] bg-[#0b0e14]/90 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto flex items-end gap-2">
          <button 
            onClick={handleSTT}
            className={`w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center transition-all ${
              isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-white/5 border border-white/10 text-slate-500'
            }`}
          >
            <i className={`fas ${isListening ? 'fa-stop' : 'fa-microphone'}`}></i>
          </button>
          
          <div className="flex-1 relative">
            <textarea 
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (input.trim()) { onSendMessage(input); setInput(''); }
                }
              }}
              placeholder="Type in native language..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-3.5 pr-12 text-white focus:border-indigo-500 outline-none resize-none text-sm min-h-[52px] max-h-32"
              rows={1}
            />
            <button 
              onClick={() => { if (input.trim()) { onSendMessage(input); setInput(''); } }}
              className="absolute right-2.5 bottom-2.5 w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white active:scale-90"
            >
              <i className="fas fa-paper-plane text-[10px]"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
