import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Phone, PhoneOff, Mic, MicOff, Lightbulb, MessageCircle, ArrowLeft, Loader2, Volume2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DESTINATIONS } from '@/lib/constants';
import { type Language } from '@/lib/types';
import { Navigation } from '@/components/Navigation';
import { apiRequest } from '@/lib/queryClient';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function LiveTutor() {
  const [selectedLang, setSelectedLang] = useState<Language | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const availableLanguages = Array.from(new Set(DESTINATIONS.map(d => JSON.stringify(d.language))))
    .map(s => JSON.parse(s)) as Language[];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startSession = () => {
    setIsConnected(true);
    setMessages([{
      id: '1',
      role: 'assistant',
      content: `Hello! I'm your ${selectedLang?.name} tutor. Let's practice speaking together. Feel free to ask me anything or start a conversation!`,
      timestamp: new Date()
    }]);
  };

  const stopSession = () => {
    setIsConnected(false);
    setMessages([]);
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await apiRequest('POST', '/api/tutor/message', {
        message: input,
        language: selectedLang?.name || 'Korean',
        conversationHistory: messages.map(m => ({ role: m.role === 'assistant' ? 'model' : m.role, content: m.content }))
      });
      const data = await response.json();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || "I understand. Let's continue practicing!",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error(err);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm having trouble connecting. Please try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!selectedLang) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="p-8 md:p-16">
          <header className="text-center mb-12">
            <h2 className="text-4xl font-black uppercase tracking-tighter text-foreground mb-4">Live AI Tutor</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Practice speaking with an AI language tutor in real-time</p>
          </header>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 max-w-5xl mx-auto">
            {availableLanguages.map(lang => (
              <motion.button
                key={lang.code}
                onClick={() => setSelectedLang(lang)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="glass-card p-6 rounded-3xl hover:border-primary/30 transition-all text-center flex flex-col items-center gap-3"
                data-testid={`lang-${lang.code}`}
              >
                <span className="text-4xl">{lang.flag}</span>
                <span className="font-bold text-foreground text-sm">{lang.name}</span>
              </motion.button>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="p-4 border-b border-border flex items-center justify-between glass-card">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => { stopSession(); setSelectedLang(null); }} data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{selectedLang.flag}</span>
            <div>
              <h3 className="font-bold text-foreground">{selectedLang.name} Tutor</h3>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground'}`}></span>
                <span className="text-xs text-muted-foreground">{isConnected ? 'Connected' : 'Offline'}</span>
              </div>
            </div>
          </div>
        </div>
        
        {isConnected && (
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setIsMuted(!isMuted)}
            className={isMuted ? 'text-red-500' : ''}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </Button>
        )}
      </header>

      <div className="flex-1 flex flex-col md:flex-row gap-4 p-4 min-h-0">
        <Card className="flex-1 glass-card rounded-3xl p-4 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto space-y-4 mb-4">
            {!isConnected ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4">
                  <MessageCircle className="w-10 h-10" />
                </div>
                <h4 className="text-lg font-bold text-foreground mb-2">Start your conversation</h4>
                <p className="text-muted-foreground max-w-sm">Connect with your AI tutor to practice speaking {selectedLang.name} in real-time.</p>
              </div>
            ) : (
              messages.map((msg) => (
                <motion.div 
                  key={msg.id} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] p-4 rounded-2xl ${
                    msg.role === 'user' 
                      ? 'bg-primary text-primary-foreground rounded-br-none' 
                      : 'bg-muted text-foreground rounded-bl-none'
                  }`}>
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                    <span className="text-xs opacity-60 mt-1 block">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </motion.div>
              ))
            )}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted p-4 rounded-2xl rounded-bl-none flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {isConnected ? (
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type your message..."
                className="flex-1 rounded-xl"
                data-testid="input-message"
              />
              <Button 
                onClick={sendMessage} 
                disabled={isLoading || !input.trim()} 
                className="rounded-xl"
                data-testid="button-send"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Button
              onClick={startSession}
              className="w-full py-6 rounded-2xl font-bold"
              data-testid="button-start-session"
            >
              <Phone className="w-5 h-5 mr-2" />
              Start Practice Session
            </Button>
          )}
        </Card>

        <Card className="md:w-80 glass-card rounded-3xl p-6 overflow-y-auto">
          <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            Tutor Notes
          </h4>
          <div className="space-y-4">
            <div className="p-4 bg-primary/10 rounded-2xl">
              <p className="text-sm font-bold text-primary mb-1">Current Focus</p>
              <p className="text-sm text-foreground">Conversational fillers and natural flow.</p>
            </div>
            <div className="space-y-3">
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Recommended Topics</p>
              {[
                "Daily routine",
                "Favorite travel destinations",
                "Ordering food at a restaurant",
                "Explaining your hobbies"
              ].map((topic, i) => (
                <button 
                  key={i} 
                  onClick={() => { setInput(topic); }}
                  className="w-full text-left p-3 text-sm rounded-xl hover:bg-muted border border-transparent hover:border-border transition-all text-muted-foreground"
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {isConnected && (
        <div className="p-4 border-t border-border">
          <Button
            onClick={stopSession}
            variant="destructive"
            className="w-full py-4 rounded-2xl font-bold"
            data-testid="button-end-session"
          >
            <PhoneOff className="w-5 h-5 mr-2" />
            End Session
          </Button>
        </div>
      )}
    </div>
  );
}
