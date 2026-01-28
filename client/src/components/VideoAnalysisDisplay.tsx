import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Mic, Heart, BookOpen, MessageSquare, HelpCircle, Users, Loader2, Check, X, ExternalLink, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useBookmarks } from '@/hooks/use-bookmarks';
import type { VideoAnalysisResult, VideoSegment } from '@shared/schema';

interface VideoAnalysisDisplayProps {
  data: VideoAnalysisResult;
  onSeek?: (seconds: number) => void;
}

type TabType = 'conversation' | 'roleplay' | 'quiz';

export function VideoAnalysisDisplay({ data, onSeek }: VideoAnalysisDisplayProps) {
  const [activeTab, setActiveTab] = useState<TabType>('conversation');
  const [playingTTS, setPlayingTTS] = useState<string | null>(null);
  const [newlySavedItems, setNewlySavedItems] = useState<Set<string>>(new Set());
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [showQuizResults, setShowQuizResults] = useState(false);
  const playerRef = useRef<HTMLIFrameElement>(null);
  const { toast } = useToast();
  const { data: bookmarks } = useBookmarks();

  const savedItems = useMemo(() => {
    const items = new Set(newlySavedItems);
    bookmarks?.forEach((b: any) => {
      items.add(`${b.type}-${b.content}`);
    });
    return items;
  }, [bookmarks, newlySavedItems]);

  const isYoutube = data.platform === 'youtube';
  const isUploadedFile = !data.platform && !data.videoId;

  const seekToTimestamp = (seconds: number) => {
    if (onSeek) {
      onSeek(seconds);
      return;
    }
    if (isYoutube && playerRef.current?.contentWindow) {
      playerRef.current.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func: 'seekTo', args: [seconds, true] }),
        '*'
      );
    } else if (data.videoUrl) {
      window.open(`${data.videoUrl}&t=${seconds}s`, '_blank');
    }
  };

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

  const saveItem = async (type: 'word' | 'phrase' | 'sentence', content: string, meaning: string, context?: string) => {
    const key = `${type}-${content}`;
    if (savedItems.has(key)) {
      toast({ title: '이미 저장됨', description: '이미 보관함에 저장되어 있습니다.' });
      return;
    }

    try {
      await apiRequest('POST', '/api/bookmarks', {
        type,
        sourceType: isUploadedFile ? 'file' : (data.platform || 'video'),
        content,
        meaning,
        context: context || data.videoUrl || 'Uploaded file'
      });
      setNewlySavedItems(prev => new Set(prev).add(key));
      queryClient.invalidateQueries({ queryKey: ['/api/bookmarks'] });
      toast({ 
        title: '저장 완료', 
        description: `${type === 'sentence' ? '문장' : type === 'phrase' ? '표현' : '단어'}이 보관함에 저장되었습니다.` 
      });
    } catch (err) {
      toast({ title: '저장 실패', variant: 'destructive' });
    }
  };

  const tabs = [
    { id: 'conversation' as TabType, label: '전체 대화 연습', icon: MessageSquare },
    { id: 'roleplay' as TabType, label: '롤플레이 미션', icon: Users },
    { id: 'quiz' as TabType, label: '복습퀴즈', icon: HelpCircle }
  ];

  const getPlatformColor = () => {
    switch (data.platform) {
      case 'youtube': return 'bg-red-500';
      case 'tiktok': return 'bg-black';
      case 'instagram': return 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500';
      default: return 'bg-primary';
    }
  };

  const getPlatformName = () => {
    switch (data.platform) {
      case 'youtube': return 'YouTube';
      case 'tiktok': return 'TikTok';
      case 'instagram': return 'Instagram';
      default: return 'Video';
    }
  };

  return (
    <div className="space-y-6">
      {/* YouTube Player */}
      {isYoutube && (
        <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black">
          <iframe
            ref={playerRef}
            src={`https://www.youtube.com/embed/${data.videoId}?enablejsapi=1`}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            data-testid="youtube-player"
          />
        </div>
      )}
      
      {/* External link for TikTok/Instagram */}
      {!isYoutube && !isUploadedFile && data.videoUrl && (
        <Card className="p-6 rounded-2xl text-center">
          <div className={`w-16 h-16 ${getPlatformColor()} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
            <ExternalLink className="w-8 h-8 text-white" />
          </div>
          <h3 className="font-bold text-lg text-foreground mb-2">{data.videoTitle}</h3>
          <p className="text-muted-foreground text-sm mb-4">
            {getPlatformName()} 영상은 외부 앱에서 재생됩니다
          </p>
          <Button 
            onClick={() => window.open(data.videoUrl, '_blank')}
            className="gap-2"
            data-testid="button-open-video"
          >
            <ExternalLink className="w-4 h-4" />
            {getPlatformName()}에서 열기
          </Button>
        </Card>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-2 p-1 bg-muted/50 rounded-2xl overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
              activeTab === tab.id 
                ? 'bg-primary text-primary-foreground shadow-lg' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
            data-testid={`tab-${tab.id}`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* 전체 대화 연습 - Main Learning Tab */}
        {activeTab === 'conversation' && (
          <motion.div
            key="conversation"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* CEFR Level & Summary */}
            <Card className="p-4 rounded-2xl border-primary/20 bg-primary/5">
              <div className="flex items-center gap-3 flex-wrap mb-3">
                {data.cefrLevel && (
                  <div className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-lg text-sm">
                    CEFR {data.cefrLevel}
                  </div>
                )}
                <h3 className="font-bold text-foreground flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  학습개요
                </h3>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">{data.summary}</p>
              {data.cefrExplanation && (
                <p className="text-xs text-muted-foreground mt-2 italic">{data.cefrExplanation}</p>
              )}
            </Card>

            {/* Segment Cards - Conversation Style */}
            <h3 className="font-bold text-lg text-foreground px-1">전체 대화 연습</h3>
            
            {data.segments.map((segment, idx) => (
              <ConversationSegmentCard
                key={idx}
                segment={segment}
                onSeek={seekToTimestamp}
                onTTS={playTTS}
                onSave={saveItem}
                playingTTS={playingTTS}
                savedItems={savedItems}
                index={idx}
              />
            ))}
          </motion.div>
        )}

        {/* 롤플레이 미션 */}
        {activeTab === 'roleplay' && data.roleplayMission && (
          <motion.div
            key="roleplay"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="p-6 rounded-2xl space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground">실전 롤플레이 미션</h3>
                  <p className="text-sm text-muted-foreground">{data.roleplayMission.scenario}</p>
                </div>
              </div>
              <div className="grid gap-3">
                <div className="p-3 bg-blue-500/10 rounded-xl">
                  <p className="text-xs font-bold text-blue-500 uppercase mb-1">Your Role</p>
                  <p className="text-foreground">{data.roleplayMission.yourRole}</p>
                </div>
                <div className="p-3 bg-orange-500/10 rounded-xl">
                  <p className="text-xs font-bold text-orange-500 uppercase mb-1">NPC Role</p>
                  <p className="text-foreground">{data.roleplayMission.npcRole}</p>
                </div>
                <div className="p-3 bg-green-500/10 rounded-xl">
                  <p className="text-xs font-bold text-green-500 uppercase mb-1">Objective</p>
                  <p className="text-foreground">{data.roleplayMission.objective}</p>
                </div>
              </div>
              <Button className="w-full mt-4 py-6 rounded-2xl" data-testid="button-start-roleplay">
                <MessageSquare className="w-5 h-5 mr-2" />
                롤플레이 시작하기
              </Button>
            </Card>
          </motion.div>
        )}

        {/* 복습퀴즈 */}
        {activeTab === 'quiz' && data.quizQuestions && (
          <motion.div
            key="quiz"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {data.quizQuestions.map((q, idx) => (
              <Card key={idx} className="p-5 rounded-2xl">
                <p className="font-bold text-foreground mb-4">
                  <span className="text-primary mr-2">Q{idx + 1}.</span>
                  {q.question}
                </p>
                <div className="grid gap-2">
                  {q.options.map((opt, optIdx) => {
                    const isSelected = quizAnswers[idx] === optIdx;
                    const isCorrect = showQuizResults && optIdx === q.correctIndex;
                    const isWrong = showQuizResults && isSelected && optIdx !== q.correctIndex;
                    return (
                      <button
                        key={optIdx}
                        onClick={() => !showQuizResults && setQuizAnswers(prev => ({ ...prev, [idx]: optIdx }))}
                        className={`p-3 rounded-xl text-left transition-all flex items-center gap-3 ${
                          isCorrect ? 'bg-green-500/20 border-2 border-green-500' :
                          isWrong ? 'bg-red-500/20 border-2 border-red-500' :
                          isSelected ? 'bg-primary/20 border-2 border-primary' :
                          'bg-muted/50 hover:bg-muted border-2 border-transparent'
                        }`}
                        data-testid={`quiz-${idx}-option-${optIdx}`}
                      >
                        <span className="w-6 h-6 rounded-full bg-background flex items-center justify-center text-xs font-bold">
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span className="flex-1">{opt}</span>
                        {isCorrect && <Check className="w-5 h-5 text-green-500" />}
                        {isWrong && <X className="w-5 h-5 text-red-500" />}
                      </button>
                    );
                  })}
                </div>
                {showQuizResults && (
                  <div className="mt-4 p-3 bg-blue-500/10 rounded-xl">
                    <p className="text-sm text-foreground">{q.explanation}</p>
                  </div>
                )}
              </Card>
            ))}
            {!showQuizResults && (
              <Button 
                onClick={() => setShowQuizResults(true)} 
                className="w-full py-6 rounded-2xl"
                disabled={Object.keys(quizAnswers).length < (data.quizQuestions?.length || 0)}
                data-testid="button-check-quiz"
              >
                정답 확인하기
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface ConversationSegmentCardProps {
  segment: VideoSegment;
  onSeek: (seconds: number) => void;
  onTTS: (text: string, id: string) => void;
  onSave: (type: 'word' | 'phrase' | 'sentence', content: string, meaning: string, context?: string) => void;
  playingTTS: string | null;
  savedItems: Set<string>;
  index: number;
}

function ConversationSegmentCard({ segment, onSeek, onTTS, onSave, playingTTS, savedItems, index }: ConversationSegmentCardProps) {
  const isSentenceSaved = savedItems.has(`sentence-${segment.sentence}`);
  
  return (
    <Card className="rounded-3xl overflow-hidden border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50/50 to-transparent dark:from-blue-950/20">
      <div className="p-5 space-y-4">
        {/* Header: Timestamp + Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Timestamp Badge */}
          <button
            onClick={() => onSeek(segment.timestampSeconds)}
            className="px-4 py-2 bg-blue-500 text-white text-sm font-bold rounded-xl hover:bg-blue-600 transition-colors shadow-md"
            data-testid={`button-timestamp-${index}`}
          >
            {segment.timestamp}
          </button>
          
          {/* Control Icons */}
          <div className="flex gap-1 ml-auto">
            {/* TTS Button */}
            <button
              onClick={() => onTTS(segment.sentence, `seg-${index}`)}
              className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors"
              data-testid={`button-tts-${index}`}
            >
              {playingTTS === `seg-${index}` ? (
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              ) : (
                <Volume2 className="w-5 h-5 text-blue-600" />
              )}
            </button>
            
            {/* Mic Button - Coming Soon */}
            <button 
              className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center cursor-not-allowed opacity-50"
              data-testid={`button-mic-${index}`}
              disabled
              title="Shadowing 기능 준비중"
            >
              <Mic className="w-5 h-5 text-muted-foreground" />
            </button>
            
            {/* Heart/Save Button */}
            <button
              onClick={() => onSave('sentence', segment.sentence, segment.translation, segment.expressionNote)}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                isSentenceSaved 
                  ? 'bg-pink-500 text-white' 
                  : 'bg-pink-100 dark:bg-pink-900/30 hover:bg-pink-200 dark:hover:bg-pink-800/50'
              }`}
              data-testid={`button-save-sentence-${index}`}
            >
              <Heart className={`w-5 h-5 ${isSentenceSaved ? 'fill-current' : 'text-pink-500'}`} />
            </button>
          </div>
        </div>

        {/* Main Sentence */}
        <p className="text-xl font-bold text-foreground leading-relaxed">
          {segment.sentence}
        </p>

        {/* Korean Translation - Chat Bubble Style */}
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-bold">번역</span>
          </div>
          <div className="flex-1 p-3 bg-purple-100 dark:bg-purple-900/30 rounded-2xl rounded-tl-none">
            <p className="text-foreground">{segment.translation}</p>
          </div>
        </div>

        {/* Expression Note - Chat Bubble Style */}
        {segment.expressionNote && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0">
              <Lightbulb className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 p-3 bg-amber-100 dark:bg-amber-900/30 rounded-2xl rounded-tl-none">
              <p className="text-sm text-foreground">{segment.expressionNote}</p>
            </div>
          </div>
        )}

        {/* Vocabulary & Phrases Cards */}
        {((segment.vocabulary && segment.vocabulary.length > 0) || (segment.phrases && segment.phrases.length > 0)) && (
          <div className="space-y-2 pt-2">
            {/* Phrases (multi-word expressions) */}
            {segment.phrases?.map((p, pIdx) => {
              const isPhraseSaved = savedItems.has(`phrase-${p.phrase}`);
              return (
                <div
                  key={`phrase-${pIdx}`}
                  className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-950/30 rounded-xl border border-orange-200 dark:border-orange-800"
                >
                  <div className="flex-1">
                    <p className="font-bold text-foreground">{p.phrase}</p>
                    <p className="text-sm text-orange-600 dark:text-orange-400">{p.meaning}</p>
                  </div>
                  <button
                    onClick={() => onSave('phrase', p.phrase, p.meaning)}
                    className={`p-2 rounded-full transition-colors ${
                      isPhraseSaved 
                        ? 'bg-pink-500 text-white' 
                        : 'bg-pink-100 dark:bg-pink-900/30 hover:bg-pink-200'
                    }`}
                    data-testid={`button-save-phrase-${index}-${pIdx}`}
                  >
                    <Heart className={`w-4 h-4 ${isPhraseSaved ? 'fill-current' : 'text-pink-500'}`} />
                  </button>
                </div>
              );
            })}
            
            {/* Individual Words */}
            <div className="flex flex-wrap gap-2">
              {segment.vocabulary?.map((v, vIdx) => {
                const isWordSaved = savedItems.has(`word-${v.word}`);
                return (
                  <button
                    key={`vocab-${vIdx}`}
                    onClick={() => onSave('word', v.word, v.meaning)}
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors border ${
                      isWordSaved
                        ? 'bg-pink-500/20 border-pink-500 text-pink-600'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-pink-300'
                    }`}
                    data-testid={`button-save-vocab-${index}-${vIdx}`}
                  >
                    <span className="font-bold">{v.word}</span>
                    <span className="text-muted-foreground">{v.meaning}</span>
                    <Heart className={`w-3 h-3 ${isWordSaved ? 'fill-current text-pink-500' : 'text-muted-foreground'}`} />
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
