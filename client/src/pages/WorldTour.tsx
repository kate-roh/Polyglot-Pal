import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import { DESTINATIONS } from '@/lib/constants';
import L from 'leaflet';
import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight, Globe, Heart, Send, X, Trophy, RotateCcw, Loader2, Target, User, Lightbulb, Stamp, MapPin } from 'lucide-react';
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

const completedIcon = L.divIcon({
  className: 'completed-marker',
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
  hintsRemaining: number;
  objectivesCompleted: boolean[];
  isGameOver: boolean;
  isSuccess: boolean | null;
}

interface HintSuggestion {
  text: string;
  translation: string;
}

export default function WorldTour() {
  const [activeDestination, setActiveDestination] = useState<Destination | null>(null);
  const [isInMission, setIsInMission] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [gameState, setGameState] = useState<GameState>({
    hearts: 5,
    hintsRemaining: 3,
    objectivesCompleted: [],
    isGameOver: false,
    isSuccess: null
  });
  const [showResultModal, setShowResultModal] = useState(false);
  const [showHintPanel, setShowHintPanel] = useState(false);
  const [hints, setHints] = useState<HintSuggestion[]>([]);
  const [isLoadingHints, setIsLoadingHints] = useState(false);
  const [completedCities, setCompletedCities] = useState<string[]>(() => {
    const saved = localStorage.getItem('polyglot_completed_cities');
    return saved ? JSON.parse(saved) : [];
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { mutate: addXp } = useAddXp();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('polyglot_completed_cities', JSON.stringify(completedCities));
  }, [completedCities]);

  const handleDestinationClick = (dest: Destination) => {
    setActiveDestination(dest);
  };

  const startMission = () => {
    if (!activeDestination) return;
    
    setIsInMission(true);
    setShowHintPanel(false);
    setHints([]);
    setGameState({
      hearts: 5,
      hintsRemaining: 3,
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

  const requestHint = async () => {
    if (!activeDestination || gameState.hintsRemaining <= 0 || isLoadingHints) return;
    
    setIsLoadingHints(true);
    setShowHintPanel(true);
    
    try {
      const response = await apiRequest('POST', '/api/world-tour/hint', {
        destination: activeDestination.id,
        mission: activeDestination.mission,
        language: activeDestination.language.name,
        messages: messages.map(m => ({ role: m.role, content: m.content }))
      });
      
      const data = await response.json();
      setHints(data.hints || []);
      setGameState(prev => ({
        ...prev,
        hintsRemaining: prev.hintsRemaining - 1
      }));
    } catch (err) {
      console.error('Hint error:', err);
      setHints([
        { text: "Could you help me please?", translation: "도와주시겠어요?" },
        { text: "I would like to order...", translation: "주문하고 싶은데요..." },
        { text: "Thank you very much!", translation: "정말 감사합니다!" }
      ]);
      setGameState(prev => ({
        ...prev,
        hintsRemaining: prev.hintsRemaining - 1
      }));
    } finally {
      setIsLoadingHints(false);
    }
  };

  const useHintPhrase = (phrase: string) => {
    setInput(phrase);
    setShowHintPanel(false);
  };

  const endMission = async () => {
    if (!activeDestination || isLoading) return;
    
    setIsLoading(true);
    
    try {
      const response = await apiRequest('POST', '/api/world-tour/evaluate', {
        destination: activeDestination.id,
        mission: activeDestination.mission,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        heartsRemaining: gameState.hearts,
        hintsUsed: 3 - gameState.hintsRemaining
      });
      
      const result = await response.json();
      
      const isSuccess = result.success && gameState.hearts > 0;
      
      setGameState(prev => ({
        ...prev,
        isGameOver: true,
        isSuccess,
        objectivesCompleted: result.objectivesCompleted || prev.objectivesCompleted
      }));
      
      if (isSuccess) {
        addXp(100);
        if (!completedCities.includes(activeDestination.id)) {
          setCompletedCities(prev => [...prev, activeDestination.id]);
        }
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
    setShowHintPanel(false);

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
          setTimeout(() => {
            const gameOverMsg: Message = {
              id: (Date.now() + 2).toString(),
              role: 'npc',
              content: "I'm sorry, but I need to ask you to leave. Please come back when you're ready to be more respectful.",
              timestamp: new Date()
            };
            setMessages(prev => [...prev, gameOverMsg]);
            setGameState(prev => ({
              ...prev,
              isGameOver: true,
              isSuccess: false
            }));
            setShowResultModal(true);
          }, 1500);
        }
      }
      
    } catch (err) {
      console.error('Chat error:', err);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'npc',
        content: "Pardon? I didn't quite catch that. Could you say it again?",
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
    setShowHintPanel(false);
    setHints([]);
    setGameState({
      hearts: 5,
      hintsRemaining: 3,
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
        <header className="border-b border-border bg-card/95 backdrop-blur-xl sticky top-0 z-20">
          <div className="flex items-center justify-between p-3">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => endMission()} disabled={isLoading} data-testid="button-exit-mission">
                <X className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-2">
                <span className="text-xl">{activeDestination.flag}</span>
                <div>
                  <h3 className="font-bold text-foreground text-sm leading-tight">{activeDestination.mission.characterName}</h3>
                  <p className="text-xs text-muted-foreground">{activeDestination.mission.characterRole}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={false}
                    animate={i >= gameState.hearts ? { scale: [1, 0.5, 1], opacity: 0.3 } : { scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Heart 
                      className={`w-5 h-5 transition-colors ${i < gameState.hearts ? 'text-red-500 fill-red-500' : 'text-muted-foreground/20'}`}
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="px-3 pb-3">
            <div className="p-2.5 bg-amber-500/10 rounded-lg border border-amber-500/20">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-amber-500 shrink-0" />
                <p className="text-xs text-amber-200 font-medium">{activeDestination.mission.scenario}</p>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
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
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-purple-500/30 flex items-center justify-center shrink-0 border border-primary/20">
                      <span className="text-sm">{activeDestination.flag}</span>
                    </div>
                  )}
                  <div className={`p-3.5 rounded-2xl ${
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
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="flex items-end gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-purple-500/30 flex items-center justify-center border border-primary/20">
                  <span className="text-sm">{activeDestination.flag}</span>
                </div>
                <div className="bg-muted p-3.5 rounded-2xl rounded-bl-sm">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        <AnimatePresence>
          {showHintPanel && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="border-t border-border bg-card/95 backdrop-blur-xl p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" /> Suggested Phrases
                </p>
                <Button variant="ghost" size="icon" onClick={() => setShowHintPanel(false)} className="h-6 w-6">
                  <X className="w-3 h-3" />
                </Button>
              </div>
              {isLoadingHints ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-2">
                  {hints.map((hint, i) => (
                    <button
                      key={i}
                      onClick={() => useHintPhrase(hint.text)}
                      className="w-full text-left p-3 rounded-xl bg-muted/50 hover:bg-muted border border-border/50 transition-colors"
                    >
                      <p className="text-sm font-medium text-foreground">{hint.text}</p>
                      <p className="text-xs text-muted-foreground mt-1">{hint.translation}</p>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="p-3 border-t border-border bg-card/95 backdrop-blur-xl">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={requestHint}
              disabled={gameState.hintsRemaining <= 0 || isLoadingHints || gameState.isGameOver}
              className="shrink-0 relative"
              data-testid="button-hint"
            >
              <Lightbulb className="w-4 h-4" />
              {gameState.hintsRemaining > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                  {gameState.hintsRemaining}
                </span>
              )}
            </Button>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder={`Speak to ${activeDestination.mission.characterName}...`}
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
            <div className="mt-2 flex justify-center">
              <Button 
                variant="ghost" 
                onClick={endMission} 
                disabled={isLoading}
                className="text-xs text-muted-foreground"
                data-testid="button-complete-mission"
              >
                Complete Mission & Get Results
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
                <Card className="p-8 text-center bg-card border-border overflow-hidden">
                  {gameState.isSuccess ? (
                    <>
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", delay: 0.2 }}
                        className="w-24 h-24 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-green-500/30"
                      >
                        <Trophy className="w-12 h-12 text-green-500" />
                      </motion.div>
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                        <h2 className="text-2xl font-black text-foreground mb-2">Mission Complete!</h2>
                        <p className="text-muted-foreground mb-4">You successfully navigated {activeDestination.city}!</p>
                      </motion.div>
                      
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 }}
                        className="bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/20 rounded-2xl p-6 mb-6"
                      >
                        <div className="flex items-center justify-center gap-4">
                          <div className="text-center">
                            <div className="w-16 h-16 bg-card rounded-xl flex items-center justify-center mx-auto mb-2 border border-border shadow-lg">
                              <span className="text-3xl">{activeDestination.flag}</span>
                            </div>
                            <p className="text-xs font-bold text-primary uppercase tracking-widest">Stamp Earned</p>
                          </div>
                          <div className="text-left">
                            <p className="text-2xl font-black text-primary">+100 XP</p>
                            <p className="text-xs text-muted-foreground">
                              {gameState.hintsRemaining < 3 && `(${3 - gameState.hintsRemaining} hints used)`}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    </>
                  ) : (
                    <>
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", delay: 0.2 }}
                        className="w-24 h-24 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-amber-500/30"
                      >
                        <RotateCcw className="w-12 h-12 text-amber-500" />
                      </motion.div>
                      <h2 className="text-2xl font-black text-foreground mb-2">
                        {gameState.hearts <= 0 ? "Game Over!" : "Keep Practicing!"}
                      </h2>
                      <p className="text-muted-foreground mb-4">
                        {gameState.hearts <= 0 
                          ? "The local wasn't impressed with your manners. Be more polite next time!" 
                          : "You didn't quite complete the mission. Try again!"}
                      </p>
                      <div className="bg-muted/50 rounded-xl p-4 mb-6">
                        <p className="text-sm font-bold text-amber-500">+10 XP (effort bonus)</p>
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
              icon={completedCities.includes(dest.id) ? completedIcon : pulsingIcon}
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
          Complete missions around the world to earn stamps!
        </p>
        
        {completedCities.length > 0 && (
          <div className="mt-4 pointer-events-auto">
            <div className="bg-black/60 backdrop-blur-sm rounded-xl p-3 border border-white/10 inline-block">
              <p className="text-xs text-white/60 uppercase tracking-widest mb-2 flex items-center gap-2">
                <Stamp className="w-3 h-3" /> Passport Stamps
              </p>
              <div className="flex gap-2">
                {completedCities.map(cityId => {
                  const dest = DESTINATIONS.find(d => d.id === cityId);
                  return dest ? (
                    <div key={cityId} className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center border border-green-500/30">
                      <span className="text-lg">{dest.flag}</span>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {activeDestination && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="z-10 absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-md px-4 md:px-0"
          >
            <Card className="bg-black/90 backdrop-blur-xl border-white/10 p-0 overflow-hidden">
              <div className="relative h-32 w-full">
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-10" />
                <img src={activeDestination.image} alt={activeDestination.city} className="w-full h-full object-cover" />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setActiveDestination(null)}
                  className="absolute top-2 right-2 z-20 text-white/70 hover:text-white hover:bg-white/10"
                >
                  <X className="w-4 h-4" />
                </Button>
                
                {completedCities.includes(activeDestination.id) && (
                  <div className="absolute top-2 left-2 z-20 bg-green-500/20 backdrop-blur-sm px-2 py-1 rounded-full border border-green-500/30 flex items-center gap-1.5">
                    <Stamp className="w-3 h-3 text-green-400" />
                    <span className="text-xs font-bold text-green-400">Completed</span>
                  </div>
                )}
                
                <div className="absolute bottom-3 left-4 z-20">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-2xl">{activeDestination.flag}</span>
                    <h2 className="text-xl font-bold text-white">{activeDestination.city}</h2>
                  </div>
                  <p className="text-xs text-gray-400">{activeDestination.country} · {activeDestination.language.name}</p>
                </div>
              </div>
              
              <div className="p-4 space-y-4">
                <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-purple-500/30 flex items-center justify-center shrink-0 border border-primary/20">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-white text-sm">{activeDestination.mission.characterName}</p>
                    <p className="text-xs text-gray-400 mb-1.5">{activeDestination.mission.characterRole}</p>
                    <p className="text-xs text-gray-300 italic leading-relaxed">"{activeDestination.mission.greeting}"</p>
                  </div>
                </div>

                <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
                  <p className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <Target className="w-3 h-3" /> Your Mission
                  </p>
                  <p className="text-sm text-white">{activeDestination.mission.scenario}</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {activeDestination.mission.objectives.map((obj, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-gray-400 p-2 bg-white/5 rounded-lg">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/50 shrink-0" />
                      <span className="truncate">{obj}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-white/10">
                  <span className="flex items-center gap-1.5">
                    <Heart className="w-3 h-3 text-red-400" /> 5 Lives
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Lightbulb className="w-3 h-3 text-yellow-400" /> 3 Hints
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Trophy className="w-3 h-3 text-green-400" /> 100 XP
                  </span>
                </div>
                
                <Button 
                  className="w-full gap-2 group py-5 text-sm font-bold" 
                  onClick={startMission}
                  data-testid="button-start-mission"
                >
                  {completedCities.includes(activeDestination.id) ? 'Play Again' : 'Start Mission'}
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
