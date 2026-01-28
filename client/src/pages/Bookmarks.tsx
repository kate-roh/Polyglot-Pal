import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { useBookmarks, useDeleteBookmark } from "@/hooks/use-bookmarks";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Heart, MessageCircle, Sparkles, Loader2, Quote, Volume2, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function BookmarksPage() {
  const { data: bookmarks, isLoading } = useBookmarks();
  const { mutate: deleteBookmark } = useDeleteBookmark();
  const [activeTab, setActiveTab] = useState<'all' | 'word' | 'phrase' | 'sentence' | 'grammar'>('all');
  const [playingTTS, setPlayingTTS] = useState<string | null>(null);

  const playTTS = async (text: string, id: string) => {
    if (playingTTS === id) return;
    setPlayingTTS(id);
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
        credentials: 'include'
      });
      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.onended = () => setPlayingTTS(null);
        audio.play();
      }
    } catch (err) {
      console.error('TTS error:', err);
    } finally {
      setTimeout(() => setPlayingTTS(null), 5000);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col md:flex-row h-screen bg-background overflow-hidden">
        <Navigation />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'word': return { 
        bg: 'bg-amber-500/20', 
        text: 'text-amber-400',
        border: 'border-amber-500/30',
        icon: <BookOpen className="w-4 h-4" />
      };
      case 'sentence': return { 
        bg: 'bg-green-500/20', 
        text: 'text-green-400',
        border: 'border-green-500/30',
        icon: <MessageCircle className="w-4 h-4" />
      };
      case 'grammar': return { 
        bg: 'bg-purple-500/20', 
        text: 'text-purple-400',
        border: 'border-purple-500/30',
        icon: <Sparkles className="w-4 h-4" />
      };
      case 'phrase': return { 
        bg: 'bg-orange-500/20', 
        text: 'text-orange-400',
        border: 'border-orange-500/30',
        icon: <Quote className="w-4 h-4" />
      };
      default: return { 
        bg: 'bg-blue-500/20', 
        text: 'text-blue-400',
        border: 'border-blue-500/30',
        icon: <Heart className="w-4 h-4" />
      };
    }
  };

  const tabs = [
    { id: 'all' as const, label: '전체', count: bookmarks?.length || 0 },
    { id: 'word' as const, label: '단어', count: bookmarks?.filter(b => b.type === 'word').length || 0 },
    { id: 'phrase' as const, label: '표현', count: bookmarks?.filter(b => b.type === 'phrase').length || 0 },
    { id: 'sentence' as const, label: '문장', count: bookmarks?.filter(b => b.type === 'sentence').length || 0 },
    { id: 'grammar' as const, label: '문법', count: bookmarks?.filter(b => b.type === 'grammar').length || 0 },
  ];

  const filteredBookmarks = activeTab === 'all' 
    ? bookmarks 
    : bookmarks?.filter(b => b.type === activeTab);

  return (
    <div className="flex flex-col md:flex-row h-screen bg-background overflow-hidden font-body text-foreground">
      <Navigation />
      <main className="flex-1 overflow-y-auto relative scroll-smooth">
        <div className="absolute top-0 left-0 w-full h-96 bg-pink-500/10 blur-[100px] pointer-events-none z-0" />
        <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-8 py-8 md:py-12 space-y-6 md:space-y-8">
          
          {/* Header */}
          <header className="text-center md:text-left">
            <div className="flex items-center gap-3 justify-center md:justify-start mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-red-500 flex items-center justify-center">
                <Heart className="w-6 h-6 text-white fill-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                  Knowledge Vault
                </h1>
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">
                  저장된 학습 컬렉션
                </p>
              </div>
            </div>
          </header>

          {/* Tab Navigation */}
          <div className="flex gap-2 p-1 bg-muted/50 rounded-2xl overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'bg-pink-500 text-white shadow-lg' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                data-testid={`tab-${tab.id}`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                  activeTab === tab.id ? 'bg-white/20' : 'bg-muted'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Bookmark Cards */}
          <AnimatePresence mode="popLayout">
            {filteredBookmarks && filteredBookmarks.length > 0 ? (
              <motion.div 
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                layout
              >
                {filteredBookmarks.map((item) => {
                  const style = getTypeStyle(item.type);
                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                    >
                      <Card className={`p-5 h-full flex flex-col rounded-3xl border-2 ${style.border} bg-gradient-to-br from-background to-muted/30`}>
                        {/* Header */}
                        <div className="flex justify-between items-start gap-2 mb-3">
                          <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase flex items-center gap-1.5 ${style.bg} ${style.text}`}>
                            {style.icon}
                            {item.type}
                          </span>
                          <div className="flex gap-1">
                            <button
                              onClick={() => playTTS(item.content, item.id.toString())}
                              className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center hover:bg-blue-500/20 transition-colors"
                              data-testid={`button-tts-${item.id}`}
                            >
                              {playingTTS === item.id.toString() ? (
                                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                              ) : (
                                <Volume2 className="w-4 h-4 text-blue-500" />
                              )}
                            </button>
                            <button
                              onClick={() => deleteBookmark(item.id)}
                              className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center hover:bg-red-500/20 transition-colors"
                              data-testid={`button-delete-bookmark-${item.id}`}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          </div>
                        </div>

                        {/* Content */}
                        <h3 className="text-lg font-bold mb-2 break-words text-foreground leading-tight">
                          {item.content}
                        </h3>
                        <p className="text-muted-foreground text-sm leading-relaxed italic">
                          "{item.meaning}"
                        </p>
                        
                        {/* Context */}
                        {item.context && (
                          <div className="mt-auto pt-4 border-t border-border/50">
                            <p className="text-xs text-muted-foreground/70 line-clamp-2">
                              {item.context}
                            </p>
                          </div>
                        )}
                      </Card>
                    </motion.div>
                  );
                })}
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed border-border"
              >
                <Heart className="w-16 h-16 text-pink-500/30 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-muted-foreground">아직 저장된 항목이 없어요</h3>
                <p className="text-sm text-muted-foreground/60 mt-2 max-w-md mx-auto">
                  Media Studio에서 영상을 분석하고, 하트 버튼을 눌러 단어와 표현을 저장해보세요!
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
