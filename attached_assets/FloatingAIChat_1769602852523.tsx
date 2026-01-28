
import React, { useState, useRef, useEffect } from 'react';
import { GeminiService } from '../services/geminiService';

interface FloatingAIChatProps {
  // Use GeminiService directly instead of a ref
  gemini: GeminiService;
  context: string;
}

const FloatingAIChat: React.FC<FloatingAIChatProps> = ({ gemini, context }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userText = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setLoading(true);

    try {
      const response = await gemini.chat(
        { city: 'Study Room', language: { code: 'en' } } as any,
        { name: 'AI Tutor', gender: 'Female', mood: 'Academic', kindness: 10 } as any,
        messages.map(m => ({ role: m.role === 'user' ? 'user' : 'model', content: m.text, timestamp: Date.now() })),
        `Context from current media: ${context}\n\nQuestion: ${userText}`,
        10
      );
      setMessages(prev => [...prev, { role: 'ai', text: response.content }]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-[80] flex flex-col items-end gap-4">
      {isOpen && (
        <div className="glass w-80 h-96 rounded-3xl border border-white/10 flex flex-col shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
          <header className="p-4 border-b border-white/5 flex justify-between items-center bg-indigo-600/10">
            <h4 className="text-xs font-black italic uppercase tracking-tighter flex items-center gap-2">
              <i className="fas fa-brain text-indigo-400"></i> AI Study Assistant
            </h4>
            <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-white"><i className="fas fa-times"></i></button>
          </header>
          
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {messages.length === 0 && (
              <p className="text-center text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-10 px-4">Ask anything about the current media context</p>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-xs ${
                  m.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white/5 border border-white/5 text-slate-300 rounded-bl-none'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && <div className="text-[10px] text-indigo-400 font-bold animate-pulse">Thinking...</div>}
          </div>

          <div className="p-3 bg-black/20 border-t border-white/5 flex gap-2">
            <input 
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Ask a question..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
            />
            <button onClick={handleSend} className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center"><i className="fas fa-paper-plane text-xs"></i></button>
          </div>
        </div>
      )}
      
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-xl text-white shadow-xl shadow-indigo-600/20 hover:scale-105 transition-transform"
      >
        <i className={`fas ${isOpen ? 'fa-comment-slash' : 'fa-comment-dots'}`}></i>
      </button>
    </div>
  );
};

export default FloatingAIChat;
