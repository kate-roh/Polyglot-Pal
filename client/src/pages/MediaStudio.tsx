import { useState, useRef, useEffect } from 'react';
import { Upload, Play, FileText, Brain, Loader2, History, Trash2, Film, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { useAnalyzeMedia, useAnalyzeVideo } from '@/hooks/use-media';
import { useMediaLibrary, useUploadMedia, useDeleteMedia } from '@/hooks/use-media-library';
import { useHistory, useDeleteHistory } from '@/hooks/use-history';
import { AnalysisDisplay } from '@/components/AnalysisDisplay';
import { VideoAnalysisDisplay } from '@/components/VideoAnalysisDisplay';
import { type AnalysisResult, type VideoAnalysisResult } from '@shared/schema';
import { Navigation } from '@/components/Navigation';

type TabType = 'video' | 'file' | 'manual';

interface FileItem {
  id: string;
  file: File;
}

export default function MediaStudio() {
  const [activeTab, setActiveTab] = useState<TabType>('video');
  const [input, setInput] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<FileItem[]>([]);
  const [uploadedAssetUrl, setUploadedAssetUrl] = useState<string | null>(null);
  const [selectedResult, setSelectedResult] = useState<AnalysisResult | null>(null);
  const [videoResult, setVideoResult] = useState<VideoAnalysisResult | null>(null);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [estimatedTimeLeft, setEstimatedTimeLeft] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const uploadedVideoRef = useRef<HTMLVideoElement>(null);
  
  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);
  
  const { mutate: analyze, isPending: loadingMedia } = useAnalyzeMedia();
  const { mutate: analyzeVideo, isPending: loadingVideo } = useAnalyzeVideo();
  const { data: mediaLibrary } = useMediaLibrary();
  const { mutateAsync: uploadMedia } = useUploadMedia();
  const { mutateAsync: deleteMedia } = useDeleteMedia();
  const { data: history = [] } = useHistory();
  const { mutate: deleteHistory } = useDeleteHistory();
  
  const loading = loadingMedia || loadingVideo;

  async function analyzeAsset(assetId: string) {
    setStartTime(Date.now());
    setProgress(25);
    setStatusMessage('분석 준비 중...');

    // simulate progress a bit
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    progressIntervalRef.current = setInterval(() => {
      setProgress(prev => (prev >= 85 ? prev : prev + 3));
    }, 1200);

    try {
      setStatusMessage('AI 분석 진행 중...');
      const res = await fetch('/api/media/analyze-asset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ assetId }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || '분석 실패');

      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      setProgress(100);
      setSelectedResult(data);
      return;
    } finally {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      setEstimatedTimeLeft(0);
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles: FileItem[] = [];
    for (let i = 0; i < files.length; i++) {
      if (files[i].size > 200 * 1024 * 1024) {
        alert(`File ${files[i].name} is too large. Please use files under 200MB.`);
        continue;
      }
      newFiles.push({ id: Math.random().toString(36).substr(2, 9), file: files[i] });
    }
    setSelectedFiles(prev => [...prev, ...newFiles]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (id: string) => {
    setSelectedFiles(prev => prev.filter(f => f.id !== id));
  };

  // NOTE: We no longer need to base64 the full media in-browser.
  // Upload to server for persistence (iOS PWA friendly).

  const handleAnalyze = async () => {
    if (activeTab === 'video' && !input.trim()) return;
    if (activeTab === 'file' && selectedFiles.length === 0) return;
    if (activeTab === 'manual' && !input.trim()) return;

    // Start tracking time
    const now = Date.now();
    setStartTime(now);
    setProgress(10);
    setStatusMessage("AI에 연결 중...");
    
    // Estimate total time based on content type
    const estimatedTotalSeconds = activeTab === 'video' ? 45 : activeTab === 'file' ? 60 : 30;
    setEstimatedTimeLeft(estimatedTotalSeconds);
    
    // Progress simulation for better UX
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    progressIntervalRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 85) {
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
          }
          return prev;
        }
        return prev + 3;
      });
      setEstimatedTimeLeft(prev => Math.max(0, prev - 2));
    }, 2000);
    
    if (activeTab === 'video') {
      setProgress(30);
      setStatusMessage("영상 분석 중...");
      setEstimatedTimeLeft(Math.round(estimatedTotalSeconds * 0.7));
      analyzeVideo({ url: input.trim(), languageCode: 'en' }, {
        onSuccess: (result) => {
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
          }
          setProgress(100);
          setEstimatedTimeLeft(0);
          setVideoResult(result);
          setInput('');
        },
        onError: (error) => {
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
          }
          setProgress(0);
          setEstimatedTimeLeft(0);
          alert(error instanceof Error ? error.message : "분석 실패");
        }
      });
      return;
    }

    let content = input;
    let mimeType: string | undefined;
    let title = 'Analysis';

    if (activeTab === 'file') {
      setProgress(20);
      setStatusMessage("파일 읽는 중...");
      const file = selectedFiles[0]?.file;
      if (file) {
        let uploadedAssetId: number | null = null;
        mimeType = file.type;
        title = file.name;
        
        setProgress(25);
        setStatusMessage("서버에 업로드 중...");

        try {
          const up = await uploadMedia(file);
          uploadedAssetId = up.asset.id;
          const url = up.asset.url;
          setUploadedAssetUrl(url);

          if (file.type.startsWith('video/') && url) {
            setUploadedVideoUrl(url);
          } else {
            setUploadedVideoUrl(null);
          }

          // For analysis, keep current behavior (base64/text) for now.
          // TODO: switch analyze endpoint to accept mediaId to avoid re-upload.
          setProgress(40);
          setStatusMessage("AI로 전송 중...");
        } catch (err) {
          alert(err instanceof Error ? err.message : "업로드 실패");
          return;
        }

        // Analyze by assetId (server reads the stored file; avoids huge base64 in browser)
        try {
          if (!uploadedAssetId) {
            throw new Error('업로드된 에셋 정보를 찾을 수 없습니다.');
          }

          const res = await fetch('/api/media/analyze-asset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ assetId: uploadedAssetId }),
          });
          if (!res.ok) {
            const j = await res.json().catch(() => ({}));
            throw new Error(j?.message || '분석 실패');
          }
          const result = await res.json();
          setSelectedResult(result);
          setSelectedFiles([]);
          setInput('');
          return;
        } catch (err) {
          alert(err instanceof Error ? err.message : '분석 실패');
          return;
        }
      }
    } else {
      title = 'Manual Entry';
    }

    setProgress(50);
    setStatusMessage("AI 분석 진행 중...");
    
    analyze({
      type: activeTab,
      content,
      title,
      mimeType
    }, {
      onSuccess: (result) => {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
        setProgress(100);
        setEstimatedTimeLeft(0);
        setSelectedResult(result);
        setSelectedFiles([]);
        setInput('');
      },
      onError: (error) => {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
        setProgress(0);
        setEstimatedTimeLeft(0);
        alert(error instanceof Error ? error.message : "분석 실패");
      }
    });
  };

  // Show video analysis result
  if (videoResult) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="p-4 md:p-8 max-w-5xl mx-auto">
          <Button 
            variant="ghost" 
            onClick={() => setVideoResult(null)}
            className="mb-4"
            data-testid="button-back"
          >
            ← 스튜디오로 돌아가기
          </Button>
          <VideoAnalysisDisplay data={videoResult} />
        </main>
      </div>
    );
  }

  // Show text/file analysis result
  if (selectedResult) {
    const handleSeekUploadedVideo = (seconds: number) => {
      if (uploadedVideoRef.current) {
        uploadedVideoRef.current.currentTime = seconds;
        uploadedVideoRef.current.play();
      }
    };

    // Check if this is a video-style analysis with segments (uploaded audio/video)
    const resultWithSegments = selectedResult as any;
    const isVideoStyleAnalysis = resultWithSegments.isVideoAnalysis && resultWithSegments.segments;

    if (isVideoStyleAnalysis) {
      // Convert to VideoAnalysisResult format
      const videoStyleResult: VideoAnalysisResult = {
        summary: resultWithSegments.summary,
        cefrLevel: resultWithSegments.cefrLevel,
        cefrExplanation: resultWithSegments.cefrExplanation,
        segments: resultWithSegments.segments,
        grammar: resultWithSegments.grammar || [],
        culturalNotes: resultWithSegments.culturalNotes || [],
      };

      return (
        <div className="min-h-screen bg-background">
          <Navigation />
          <main className="p-4 md:p-8 max-w-5xl mx-auto">
            <Button 
              variant="ghost" 
              onClick={() => {
                setSelectedResult(null);
                if (uploadedVideoUrl) {
                  URL.revokeObjectURL(uploadedVideoUrl);
                  setUploadedVideoUrl(null);
                }
              }}
              className="mb-4"
              data-testid="button-back"
            >
              ← 스튜디오로 돌아가기
            </Button>
            
            {uploadedVideoUrl && (
              <div className="mb-6">
                <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black">
                  <video
                    ref={uploadedVideoRef}
                    src={uploadedVideoUrl}
                    className="w-full h-full"
                    controls
                    data-testid="uploaded-video-player"
                  />
                </div>
              </div>
            )}
            
            <VideoAnalysisDisplay 
              data={videoStyleResult} 
              onSeek={uploadedVideoUrl ? handleSeekUploadedVideo : undefined}
            />
          </main>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="p-4 md:p-8 max-w-5xl mx-auto">
          <Button 
            variant="ghost" 
            onClick={() => {
              setSelectedResult(null);
              if (uploadedVideoUrl) {
                URL.revokeObjectURL(uploadedVideoUrl);
                setUploadedVideoUrl(null);
              }
            }}
            className="mb-4"
            data-testid="button-back"
          >
            ← 스튜디오로 돌아가기
          </Button>
          
          {uploadedVideoUrl && (
            <div className="mb-6">
              <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black">
                <video
                  ref={uploadedVideoRef}
                  src={uploadedVideoUrl}
                  className="w-full h-full"
                  controls
                  data-testid="uploaded-video-player"
                />
              </div>
              <p className="text-sm text-muted-foreground mt-2 text-center">
                업로드된 영상을 재생하세요
              </p>
            </div>
          )}
          
          <AnalysisDisplay 
            data={selectedResult} 
            sourceType={activeTab === 'file' ? 'file' : 'manual'} 
            onSeek={uploadedVideoUrl ? handleSeekUploadedVideo : undefined}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="p-4 md:p-8 max-w-5xl mx-auto space-y-6 pb-32">
        {loading && (
          <div className="fixed inset-0 z-[250] bg-background/98 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-full max-w-sm space-y-8">
              <div className="relative flex items-center justify-center">
                <div className="w-32 h-32 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-3xl font-black text-foreground">{Math.round(progress)}%</p>
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-foreground font-bold text-lg">{statusMessage}</p>
                {estimatedTimeLeft > 0 && (
                  <p className="text-muted-foreground text-sm">
                    예상 남은 시간: 약 {estimatedTimeLeft}초
                  </p>
                )}
                <p className="text-primary/60 text-xs font-bold uppercase tracking-widest animate-pulse">Deep Neural Processing</p>
              </div>
            </div>
          </div>
        )}

        <header className="text-center">
          <h2 className="text-3xl font-black uppercase text-foreground tracking-tighter mb-2">Media Studio</h2>
          <p className="text-muted-foreground text-sm">영상이나 텍스트를 AI로 학습 자료로 변환하세요</p>
        </header>

        <Card className="glass-card rounded-3xl p-5 md:p-10 border border-border/50">
          <div className="flex p-1 bg-muted/50 rounded-2xl mb-8 border border-border/50">
            {(['video', 'file', 'manual'] as TabType[]).map(t => (
              <button 
                key={t} 
                onClick={() => setActiveTab(t)} 
                className={`flex-1 py-4 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === t ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}
                data-testid={`tab-${t}`}
              >
                {t === 'video' && <Play className="w-4 h-4 inline mr-2" />}
                {t === 'file' && <Upload className="w-4 h-4 inline mr-2" />}
                {t === 'manual' && <FileText className="w-4 h-4 inline mr-2" />}
                {t === 'video' ? '영상' : t === 'file' ? '파일' : '텍스트'}
              </button>
            ))}
          </div>

          <div className="space-y-6">
            {activeTab === 'video' && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-2">영상 URL</label>
                <Input 
                  type="text" 
                  value={input} 
                  onChange={e => setInput(e.target.value)} 
                  placeholder="YouTube, TikTok, Instagram 영상 링크를 붙여넣으세요" 
                  className="bg-muted/50 border-border rounded-2xl p-5 text-foreground"
                  data-testid="input-video-url"
                />
                <div className="flex gap-2 px-2">
                  <span className="text-xs bg-red-500/10 text-red-500 px-2 py-1 rounded-full">YouTube</span>
                  <span className="text-xs bg-black/10 text-foreground px-2 py-1 rounded-full">TikTok</span>
                  <span className="text-xs bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-500 px-2 py-1 rounded-full">Instagram</span>
                </div>
              </div>
            )}
            
            {activeTab === 'file' && (
              <div className="space-y-4">
                <div 
                  onClick={() => fileInputRef.current?.click()} 
                  className="border-2 border-dashed border-border rounded-3xl p-10 md:p-20 text-center hover:border-primary/50 transition-all cursor-pointer group bg-muted/20"
                >
                  <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileChange} accept="video/*,audio/*" />
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                    <Film className="w-8 h-8 text-primary" />
                  </div>
                  <h4 className="text-foreground font-bold text-lg mb-2">Upload your files</h4>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest">Video/Audio files under 200MB recommended</p>
                </div>

                {mediaLibrary?.items?.length ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between px-2">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">내 업로드 라이브러리</h3>
                      <span className="text-xs text-muted-foreground">{mediaLibrary.items.length}개</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                      {mediaLibrary.items.slice(0, 12).map((a) => (
                        <div key={a.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-2xl border border-border/50">
                          <div className="flex items-center gap-4 min-w-0">
                            {a.mimeType?.startsWith('video') ? <Film className="w-5 h-5 text-primary" /> : <Volume2 className="w-5 h-5 text-primary" />}
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-foreground truncate max-w-[180px]">{a.originalName}</p>
                              <p className="text-xs text-muted-foreground font-bold uppercase mt-1">{new Date(a.createdAt).toLocaleDateString()} · {Math.round(a.size/1024/1024)}MB</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={async (e) => {
                                e.preventDefault();
                                if (a.url) {
                                  setUploadedVideoUrl(a.url);
                                  setUploadedAssetUrl(a.url);
                                }
                              }}
                            >재생</Button>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={async (e) => {
                                e.preventDefault();
                                if (a.url && a.mimeType?.startsWith('video')) {
                                  setUploadedVideoUrl(a.url);
                                  setUploadedAssetUrl(a.url);
                                }
                                await analyzeAsset(a.id);
                              }}
                            >분석</Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={async (e) => {
                                e.preventDefault();
                                if (!confirm('이 미디어를 삭제할까요?')) return;
                                await deleteMedia(a.id);
                                if (uploadedAssetUrl === a.url) {
                                  setUploadedAssetUrl(null);
                                  setUploadedVideoUrl(null);
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {selectedFiles.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto">
                    {selectedFiles.map(f => (
                      <div key={f.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-2xl border border-border/50">
                        <div className="flex items-center gap-4 min-w-0">
                          {f.file.type.startsWith('video') ? <Film className="w-5 h-5 text-primary" /> : <Volume2 className="w-5 h-5 text-primary" />}
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-foreground truncate max-w-[140px]">{f.file.name}</p>
                            <p className="text-xs text-muted-foreground font-bold uppercase">{Math.round(f.file.size / 1024 / 1024)}MB</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => removeFile(f.id)} className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'manual' && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-2">Text Content</label>
                <Textarea 
                  value={input} 
                  onChange={e => setInput(e.target.value)} 
                  placeholder="Paste text to analyze..." 
                  className="bg-muted/50 border-border rounded-2xl p-5 text-foreground h-40 resize-none"
                  data-testid="input-manual-text"
                />
              </div>
            )}
            
            <Button 
              onClick={handleAnalyze} 
              disabled={loading || (activeTab === 'file' ? selectedFiles.length === 0 : !input.trim())} 
              className="w-full py-6 rounded-3xl font-bold uppercase tracking-widest text-sm"
              data-testid="button-analyze"
            >
              {loading ? <Loader2 className="w-5 h-5 mr-3 animate-spin" /> : <Brain className="w-5 h-5 mr-3" />}
              {loading ? "분석 중..." : "분석 시작"}
            </Button>
          </div>
        </Card>

        {history.length > 0 && (
          <section className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest flex items-center gap-3 px-2 text-muted-foreground">
              <History className="w-4 h-4 text-primary" /> Recent Sessions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {history.slice(0, 6).map((item: any) => (
                <Card 
                  key={item.id} 
                  onClick={() => setSelectedResult(item.result)}
                  className="glass-card p-4 rounded-3xl border border-border/50 hover:border-primary/30 transition-all cursor-pointer flex items-center gap-4 group"
                  data-testid={`history-item-${item.id}`}
                >
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                    {item.type === 'youtube' ? <Play className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm text-foreground truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground font-bold uppercase mt-1">{new Date(item.createdAt).toLocaleDateString()}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={(e) => { e.stopPropagation(); deleteHistory(item.id); }} 
                    className="text-muted-foreground hover:text-destructive md:opacity-0 md:group-hover:opacity-100"
                    data-testid={`button-delete-history-${item.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </Card>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
