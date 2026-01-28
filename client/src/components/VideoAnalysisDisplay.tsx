import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Mic, Heart, BookOpen, MessageSquare, HelpCircle, Users, Loader2, Check, X, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { VideoAnalysisResult, VideoSegment } from '@shared/schema';

interface VideoAnalysisDisplayProps {
  data: VideoAnalysisResult;
}

type TabType = 'segments' | 'roleplay' | 'quiz' | 'conversation';

export function VideoAnalysisDisplay({ data }: VideoAnalysisDisplayProps) {
  const [activeTab, setActiveTab] = useState<TabType>('segments');
  const [playingTTS, setPlayingTTS] = useState<string | null>(null);
  const [savedItems, setSavedItems] = useState<Set<string>>(new Set());
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [showQuizResults, setShowQuizResults] = useState(false);
  const playerRef = useRef<HTMLIFrameElement>(null);
  const { toast } = useToast();

  const isYoutube = data.platform === 'youtube';

  const seekToTimestamp = (seconds: number) => {
    if (isYoutube && playerRef.current?.contentWindow) {
      playerRef.current.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func: 'seekTo', args: [seconds, true] }),
        '*'
      );
    } else {
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
    if (savedItems.has(key)) return;

    try {
      await apiRequest('POST', '/api/bookmarks', {
        type,
        sourceType: 'youtube',
        content,
        meaning,
        context: context || data.videoUrl
      });
      setSavedItems(prev => new Set(prev).add(key));
      queryClient.invalidateQueries({ queryKey: ['/api/bookmarks'] });
      toast({ title: '저장됨!', description: `${type === 'sentence' ? '문장' : type === 'phrase' ? '표현' : '단어'}이 저장되었습니다.` });
    } catch (err) {
      toast({ title: '저장 실패', variant: 'destructive' });
    }
  };

  const tabs = [
    { id: 'segments' as TabType, label: '학습하기', icon: BookOpen },
    { id: 'roleplay' as TabType, label: '롤플레이', icon: Users },
    { id: 'quiz' as TabType, label: '복습퀴즈', icon: HelpCircle },
    { id: 'conversation' as TabType, label: '대화연습', icon: MessageSquare }
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
      {isYoutube ? (
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
      ) : (
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

      <Card className="p-4 rounded-2xl border-primary/20 bg-primary/5">
        <h3 className="font-bold text-foreground mb-2 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          학습개요
        </h3>
        <p className="text-muted-foreground text-sm leading-relaxed">{data.summary}</p>
      </Card>

      <div className="flex gap-2 p-1 bg-muted/50 rounded-2xl">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === tab.id 
                ? 'bg-primary text-primary-foreground shadow-lg' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
            data-testid={`tab-${tab.id}`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'segments' && (
          <motion.div
            key="segments"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {data.segments.map((segment, idx) => (
              <SegmentCard
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

        {activeTab === 'conversation' && data.conversationPractice && (
          <motion.div
            key="conversation"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            <Card className="p-4 rounded-2xl">
              <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                전체 대화 연습
              </h3>
              <div className="space-y-3">
                {data.conversationPractice.map((line, idx) => (
                  <div 
                    key={idx} 
                    className={`flex gap-3 ${line.speaker === 'A' ? '' : 'flex-row-reverse'}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                      line.speaker === 'A' ? 'bg-blue-500' : 'bg-orange-500'
                    }`}>
                      {line.speaker}
                    </div>
                    <div className={`flex-1 max-w-[80%] ${line.speaker === 'A' ? '' : 'text-right'}`}>
                      <div className={`inline-block p-3 rounded-2xl ${
                        line.speaker === 'A' ? 'bg-blue-500/10 rounded-tl-none' : 'bg-orange-500/10 rounded-tr-none'
                      }`}>
                        <p className="text-foreground font-medium">{line.line}</p>
                        <p className="text-muted-foreground text-sm mt-1">{line.translation}</p>
                      </div>
                      <button
                        onClick={() => playTTS(line.line, `conv-${idx}`)}
                        className="mt-1 p-1 hover:bg-muted rounded-lg transition-colors inline-flex"
                        data-testid={`button-tts-conv-${idx}`}
                      >
                        {playingTTS === `conv-${idx}` ? (
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        ) : (
                          <Volume2 className="w-4 h-4 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface SegmentCardProps {
  segment: VideoSegment;
  onSeek: (seconds: number) => void;
  onTTS: (text: string, id: string) => void;
  onSave: (type: 'word' | 'phrase' | 'sentence', content: string, meaning: string, context?: string) => void;
  playingTTS: string | null;
  savedItems: Set<string>;
  index: number;
}

function SegmentCard({ segment, onSeek, onTTS, onSave, playingTTS, savedItems, index }: SegmentCardProps) {
  return (
    <Card className="rounded-3xl overflow-hidden border-border/50">
      <div className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <button
            onClick={() => onSeek(segment.timestampSeconds)}
            className="px-3 py-1.5 bg-blue-500 text-white text-xs font-bold rounded-lg hover:bg-blue-600 transition-colors shrink-0"
            data-testid={`button-timestamp-${index}`}
          >
            {segment.timestamp}
          </button>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => onTTS(segment.sentence, `seg-${index}`)}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
              data-testid={`button-tts-${index}`}
            >
              {playingTTS === `seg-${index}` ? (
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              ) : (
                <Volume2 className="w-5 h-5 text-muted-foreground" />
              )}
            </button>
            <button className="p-2 hover:bg-muted rounded-lg transition-colors" data-testid={`button-mic-${index}`}>
              <Mic className="w-5 h-5 text-muted-foreground" />
            </button>
            <button
              onClick={() => onSave('sentence', segment.sentence, segment.translation, segment.expressionNote)}
              className={`p-2 hover:bg-muted rounded-lg transition-colors ${
                savedItems.has(`sentence-${segment.sentence}`) ? 'text-pink-500' : ''
              }`}
              data-testid={`button-save-sentence-${index}`}
            >
              <Heart className={`w-5 h-5 ${savedItems.has(`sentence-${segment.sentence}`) ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-lg font-semibold text-foreground leading-relaxed">{segment.sentence}</p>
          <p className="text-muted-foreground">{segment.translation}</p>
        </div>

        {segment.expressionNote && (
          <div className="p-3 bg-purple-500/10 rounded-xl border-l-4 border-purple-500">
            <p className="text-sm text-foreground">{segment.expressionNote}</p>
          </div>
        )}

        {((segment.vocabulary && segment.vocabulary.length > 0) || (segment.phrases && segment.phrases.length > 0)) && (
          <div className="flex flex-wrap gap-2 pt-2">
            {segment.vocabulary?.map((v, vIdx) => (
              <button
                key={`vocab-${vIdx}`}
                onClick={() => onSave('word', v.word, v.meaning)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors ${
                  savedItems.has(`word-${v.word}`)
                    ? 'bg-pink-500/20 text-pink-500'
                    : 'bg-muted hover:bg-muted/80'
                }`}
                data-testid={`button-save-vocab-${index}-${vIdx}`}
              >
                <span className="font-medium">{v.word}</span>
                <span className="text-muted-foreground">{v.meaning}</span>
                <Heart className={`w-3 h-3 ${savedItems.has(`word-${v.word}`) ? 'fill-current text-pink-500' : 'text-muted-foreground'}`} />
              </button>
            ))}
            {segment.phrases?.map((p, pIdx) => (
              <button
                key={`phrase-${pIdx}`}
                onClick={() => onSave('phrase', p.phrase, p.meaning)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors ${
                  savedItems.has(`phrase-${p.phrase}`)
                    ? 'bg-orange-500/20 text-orange-500'
                    : 'bg-orange-500/10 hover:bg-orange-500/20'
                }`}
                data-testid={`button-save-phrase-${index}-${pIdx}`}
              >
                <span className="font-medium">{p.phrase}</span>
                <span className="text-muted-foreground">{p.meaning}</span>
                <Heart className={`w-3 h-3 ${savedItems.has(`phrase-${p.phrase}`) ? 'fill-current text-orange-500' : 'text-muted-foreground'}`} />
              </button>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
