import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import { DESTINATIONS } from '@/lib/constants';
import L from 'leaflet';
import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight, Globe, Heart, Send, X, Trophy, RotateCcw, Loader2, Target, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiRequest } from '@/lib/queryClient';
import { useAddXp } from '@/hooks/use-stats';
import { type Destination } from '@/lib/types';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const pulsingIcon = L.divIcon({
  className: 'pulsing-marker',
  iconSize: [14, 14],
  iconAnchor: [7, 7]
});

interface Message {
  id: string;
  role: 'user' | 'npc';
  content: string;
  timestamp: Date;
}

interface GameState {
  hearts: number;
  objectivesCompleted: boolean[];
  isGameOver: boolean;
  isSuccess: boolean | null;
}

export default function WorldTour() {
  const [activeDestination, setActiveDestination] = useState<Destination | null>(null);
  const [isInMission, setIsInMission] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [gameState, setGameState] = useState<GameState>({
    hearts: 5,
    objectivesCompleted: [],
    isGameOver: false,
    isSuccess: null
  });
  const [showResultModal, setShowResultModal] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { mutate: addXp } = useAddXp();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleDestinationClick = (dest: Destination) => {
    setActiveDestination(dest);
  };

  const startMission = () => {
    if (!activeDestination) return;
    
    setIsInMission(true);
    setGameState({
      hearts: 5,
      objectivesCompleted: new Array(activeDestination.mission.objectives.length).fill(false),
      isGameOver: false,
      isSuccess: null
    });
    
    setMessages([{
      id: '1',
      role: 'npc',
      content: activeDestination.mission.greeting,
      timestamp: new Date()
    }]);
  };

  const endMission = async (forceEnd = false) => {
    if (!activeDestination || isLoading) return;
    
    setIsLoading(true);
    
    try {
      const response = await apiRequest('POST', '/api/world-tour/evaluate', {
        destination: activeDestination.id,
        mission: activeDestination.mission,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        heartsRemaining: gameState.hearts
      });
      
      const result = await response.json();
      
      setGameState(prev => ({
        ...prev,
        isGameOver: true,
        isSuccess: result.success,
        objectivesCompleted: result.objectivesCompleted || prev.objectivesCompleted
      }));
      
      if (result.success) {
        addXp(100);
      } else {
        addXp(10);
      }
      
      setShowResultModal(true);
    } catch (err) {
      console.error('Evaluation error:', err);
      setGameState(prev => ({
        ...prev,
        isGameOver: true,
        isSuccess: false
      }));
      setShowResultModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading || !activeDestination || gameState.isGameOver) return;

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
      const response = await apiRequest('POST', '/api/world-tour/chat', {
        destination: activeDestination.id,
        mission: activeDestination.mission,
        language: activeDestination.language.name,
        messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
        currentHearts: gameState.hearts
      });
      
      const data = await response.json();
      
      const npcMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'npc',
        content: data.response,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, npcMessage]);
      
      if (data.heartsChange && data.heartsChange < 0) {
        const newHearts = Math.max(0, gameState.hearts + data.heartsChange);
        setGameState(prev => ({
          ...prev,
          hearts: newHearts
        }));
        
        if (newHearts <= 0) {
          setGameState(prev => ({
            ...prev,
            isGameOver: true,
            isSuccess: false
          }));
          setShowResultModal(true);
        }
      }
      
    } catch (err) {
      console.error('Chat error:', err);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'npc',
        content: "I'm having trouble understanding. Could you try again?",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const resetMission = () => {
    setIsInMission(false);
    setMessages([]);
    setShowResultModal(false);
    setGameState({
      hearts: 5,
      objectivesCompleted: [],
      isGameOver: false,
      isSuccess: null
    });
  };

  const exitToMap = () => {
    resetMission();
    setActiveDestination(null);
  };

  if (isInMission && activeDestination) {
    return (
      <div className="flex flex-col h-screen bg-background">
        <header className="p-4 border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => endMission(true)} disabled={isLoading} data-testid="button-exit-mission">
                <X className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{activeDestination.flag}</span>
                <div>
                  <h3 className="font-bold text-foreground text-sm">{activeDestination.city}</h3>
                  <p className="text-xs text-muted-foreground">{activeDestination.mission.characterName} - {activeDestination.mission.characterRole}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Heart 
                  key={i} 
                  className={`w-5 h-5 transition-all ${i < gameState.hearts ? 'text-red-500 fill-red-500' : 'text-muted-foreground/30'}`}
                />
              ))}
            </div>
          </div>
          
          <div className="mt-3 p-3 bg-primary/10 rounded-xl border border-primary/20">
            <div className="flex items-start gap-2">
              <Target className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Current Mission</p>
                <p className="text-sm text-foreground">{activeDestination.mission.scenario}</p>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-end gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  {msg.role === 'npc' && (
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <div className={`p-4 rounded-2xl ${
                    msg.role === 'user' 
                      ? 'bg-primary text-primary-foreground rounded-br-sm' 
                      : 'bg-muted text-foreground rounded-bl-sm'
                  }`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-end gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div className="bg-muted p-4 rounded-2xl rounded-bl-sm">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Typing...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-border bg-card/80 backdrop-blur-xl">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder={`Talk to ${activeDestination.mission.characterName}...`}
              disabled={isLoading || gameState.isGameOver}
              className="flex-1"
              data-testid="input-chat"
            />
            <Button 
              onClick={sendMessage} 
              disabled={isLoading || !input.trim() || gameState.isGameOver}
              data-testid="button-send"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          
          {!gameState.isGameOver && (
            <div className="mt-3 flex justify-center">
              <Button 
                variant="outline" 
                onClick={() => endMission()} 
                disabled={isLoading}
                className="text-xs"
                data-testid="button-end-conversation"
              >
                End Conversation & Get Results
              </Button>
            </div>
          )}
        </div>

        <AnimatePresence>
          {showResultModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="w-full max-w-md"
              >
                <Card className="p-8 text-center bg-card border-border">
                  {gameState.isSuccess ? (
                    <>
                      <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Trophy className="w-10 h-10 text-green-500" />
                      </div>
                      <h2 className="text-2xl font-black text-foreground mb-2">Mission Complete!</h2>
                      <p className="text-muted-foreground mb-2">You successfully completed your mission in {activeDestination.city}!</p>
                      <div className="flex items-center justify-center gap-2 mb-6">
                        <span className="text-2xl">{activeDestination.flag}</span>
                        <span className="text-sm font-bold text-primary">+100 XP earned</span>
                      </div>
                      <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-6">
                        <p className="text-xs font-bold text-green-500 uppercase tracking-widest mb-2">Passport Stamp Earned</p>
                        <div className="text-4xl">{activeDestination.flag}</div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <RotateCcw className="w-10 h-10 text-amber-500" />
                      </div>
                      <h2 className="text-2xl font-black text-foreground mb-2">Keep Practicing!</h2>
                      <p className="text-muted-foreground mb-2">
                        {gameState.hearts <= 0 
                          ? "You ran out of hearts. Practice makes perfect!" 
                          : "You didn't complete all objectives. Try again!"}
                      </p>
                      <div className="flex items-center justify-center gap-2 mb-6">
                        <span className="text-sm font-bold text-amber-500">+10 XP (effort bonus)</span>
                      </div>
                    </>
                  )}
                  
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={exitToMap} className="flex-1" data-testid="button-back-to-map">
                      Back to Map
                    </Button>
                    <Button onClick={resetMission} className="flex-1" data-testid="button-try-again">
                      {gameState.isSuccess ? 'Play Again' : 'Try Again'}
                    </Button>
                  </div>
                </Card>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-full relative">
      <div className="absolute top-0 left-0 w-full h-full z-0">
        <MapContainer 
          center={[20, 0]} 
          zoom={2} 
          style={{ height: '100%', width: '100%', background: '#0b0e14' }}
          zoomControl={false}
          minZoom={2}
          maxBounds={[[-90, -180], [90, 180]]}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          
          {DESTINATIONS.map((dest) => (
            <Marker 
              key={dest.id} 
              position={[dest.lat, dest.lng]}
              icon={pulsingIcon}
              eventHandlers={{
                click: () => handleDestinationClick(dest),
              }}
            />
          ))}
        </MapContainer>
      </div>

      <div className="z-10 absolute top-6 left-6 md:left-72 pointer-events-none">
        <h1 className="text-4xl font-display font-bold text-white drop-shadow-lg flex items-center gap-3">
          <Globe className="text-primary w-8 h-8" />
          World Tour
        </h1>
        <p className="text-white/80 text-lg drop-shadow-md mt-1 max-w-md">
          Select a destination to start your immersive language mission.
        </p>
      </div>

      <AnimatePresence>
        {activeDestination && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="z-10 absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-md px-4 md:px-0"
          >
            <Card className="bg-black/90 backdrop-blur-xl border-primary/30 p-0 overflow-hidden">
              <div className="relative h-36 w-full">
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 to-transparent z-10" />
                <img src={activeDestination.image} alt={activeDestination.city} className="w-full h-full object-cover" />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setActiveDestination(null)}
                  className="absolute top-2 right-2 z-20 text-white/70 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </Button>
                <div className="absolute bottom-3 left-4 z-20">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-3xl">{activeDestination.flag}</span>
                    <h2 className="text-2xl font-bold text-white">{activeDestination.city}</h2>
                  </div>
                  <p className="text-sm text-gray-300">{activeDestination.country} · {activeDestination.language.name}</p>
                </div>
              </div>
              
              <div className="p-5 space-y-4">
                <div className="bg-muted/50 rounded-xl p-4 border border-border/50">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground">{activeDestination.mission.characterName}</p>
                      <p className="text-xs text-muted-foreground mb-2">{activeDestination.mission.characterRole}</p>
                      <p className="text-sm text-foreground/80 italic">"{activeDestination.mission.greeting.substring(0, 60)}..."</p>
                    </div>
                  </div>
                </div>

                <div className="bg-primary/10 rounded-xl p-4 border border-primary/20">
                  <p className="text-xs font-bold text-primary uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Target className="w-3 h-3" /> Your Mission
                  </p>
                  <p className="text-sm text-foreground">{activeDestination.mission.scenario}</p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Objectives</p>
                  <div className="grid grid-cols-2 gap-2">
                    {activeDestination.mission.objectives.map((obj, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                        {obj}
                      </div>
                    ))}
                  </div>
                </div>
                
                <Button 
                  className="w-full gap-2 group py-6 text-sm font-bold" 
                  onClick={startMission}
                  data-testid="button-start-mission"
                >
                  Start Mission <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
