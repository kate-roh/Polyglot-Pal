
import React, { useState, useRef } from 'react';
import { GeminiService } from '../services/geminiService';
import { AnalysisResult, Bookmark } from '../types';
import AnalysisDisplay from './AnalysisDisplay';

interface MediaStudioProps {
  gemini: GeminiService;
  onAddXP: (amount: number, score?: number) => void;
  onToggleBookmark: (item: any, type: Bookmark['type'], sourceType: Bookmark['sourceType']) => void;
  history: AnalysisResult[];
  onSaveResult: (result: AnalysisResult) => void;
  onDeleteHistory: (id: string) => void;
}

interface FileItem {
  id: string;
  file: File;
}

const MediaStudio: React.FC<MediaStudioProps> = ({ gemini, onAddXP, onToggleBookmark, history, onSaveResult, onDeleteHistory }) => {
  const [activeTab, setActiveTab] = useState<'youtube' | 'file' | 'manual'>('youtube');
  const [input, setInput] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [selectedResult, setSelectedResult] = useState<AnalysisResult | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fileToAIFormat = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = (reader.result as string).split(',')[1];
        resolve(result);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles: FileItem[] = [];
    for (let i = 0; i < files.length; i++) {
      if (files[i].size > 200 * 1024 * 1024) { // 200MB 제한 가이드
        alert(`파일 ${files[i].name}의 크기가 너무 큽니다. 200MB 이하의 파일을 권장합니다.`);
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

  const handleAnalyze = async () => {
    if (activeTab === 'youtube' && !input.trim()) return;
    if (activeTab === 'file' && selectedFiles.length === 0) return;
    if (activeTab === 'manual' && !input.trim()) return;

    setLoading(true);
    setProgress(5);
    setStatusMessage("AI 모델 연결 중...");
    
    try {
      await gemini.unlockAudio();

      if (activeTab === 'file') {
        const total = selectedFiles.length;
        for (let i = 0; i < total; i++) {
          const item = selectedFiles[i];
          setStatusMessage(`파일 로딩 중 (${i + 1}/${total}): ${item.file.name}`);
          
          let base64Content = await fileToAIFormat(item.file);
          setProgress(20 + (i / total) * 70);
          
          setStatusMessage("인공지능 분석 중...");
          const res = await gemini.analyzeMedia({
            type: 'file',
            content: base64Content,
            mimeType: item.file.type,
            title: item.file.name
          });
          
          // 메모리 강제 해제 유도
          base64Content = ""; 
          
          onSaveResult(res);
          onAddXP(50);
          
          if (i === total - 1) {
            setSelectedResult(res);
          }
        }
      } else {
        setStatusMessage(activeTab === 'youtube' ? "유튜브 정보를 검색하고 분석하는 중..." : "텍스트 분석 중...");
        const res = await gemini.analyzeMedia({
          type: activeTab,
          content: input,
          title: activeTab === 'youtube' ? 'YouTube Session' : 'Manual Entry'
        });
        onSaveResult(res);
        onAddXP(50);
        setSelectedResult(res);
      }

      setProgress(100);
      setTimeout(() => {
        setLoading(false);
        setSelectedFiles([]);
        setInput('');
      }, 500);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "분석 실패: 메모리가 부족하거나 네트워크 오류입니다.");
      setLoading(false);
    }
  };

  if (selectedResult) {
    return (
      <AnalysisDisplay 
        result={selectedResult} 
        onBack={() => setSelectedResult(null)} 
        gemini={gemini} 
        onAddXP={onAddXP} 
        onToggleBookmark={onToggleBookmark} 
      />
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500 pb-32">
      {loading && (
        <div className="fixed inset-0 z-[250] bg-[#0b0e14]/98 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-full max-w-sm space-y-8">
            <div className="relative flex items-center justify-center">
               <div className="w-32 h-32 md:w-40 md:h-40 border-[6px] border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin"></div>
               <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-3xl font-black text-white">{Math.round(progress)}%</p>
               </div>
            </div>
            <div className="space-y-2">
              <p className="text-white font-bold text-lg">{statusMessage}</p>
              <p className="text-indigo-400/60 text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Deep Neural Processing</p>
            </div>
          </div>
        </div>
      )}

      <header className="text-center">
        <h2 className="text-3xl font-black italic uppercase text-white tracking-tighter mb-2">Media Studio</h2>
        <p className="text-slate-500 text-xs">최신 AI 기술로 미디어를 학습 자료로 변환합니다.</p>
      </header>

      <div className="glass rounded-[40px] p-5 md:p-10 border border-white/5 shadow-2xl overflow-hidden">
        <div className="flex p-1 bg-white/5 rounded-2xl mb-8 border border-white/5">
          {['youtube', 'file', 'manual'].map(t => (
            <button key={t} onClick={() => setActiveTab(t as any)} 
              className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === t ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-500 hover:text-white'}`}>
              {t}
            </button>
          ))}
        </div>

        <div className="space-y-6">
          {activeTab === 'youtube' && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">YouTube URL</label>
              <input type="text" value={input} onChange={e => setInput(e.target.value)} 
                placeholder="https://www.youtube.com/watch?v=..." 
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white focus:border-indigo-500 outline-none text-sm transition-all" />
              <p className="text-[9px] text-slate-500 px-2 italic">* AI가 실제 검색을 통해 영상의 정보를 확인합니다.</p>
            </div>
          )}
          
          {activeTab === 'file' && (
            <div className="space-y-4">
              <div onClick={() => fileInputRef.current?.click()} 
                className="border-2 border-dashed border-white/10 rounded-[40px] p-10 md:p-20 text-center hover:border-indigo-500/50 transition-all cursor-pointer group bg-white/[0.01]">
                <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileChange} accept="video/*,audio/*" />
                <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <i className="fas fa-file-video text-3xl text-indigo-400"></i>
                </div>
                <h4 className="text-white font-bold text-lg mb-2">파일을 업로드하세요</h4>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest italic">200MB 이하의 동영상/오디오 권장</p>
              </div>

              {selectedFiles.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto no-scrollbar">
                  {selectedFiles.map(f => (
                    <div key={f.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                      <div className="flex items-center gap-4 min-w-0">
                        <i className={`fas ${f.file.type.startsWith('video') ? 'fa-film' : 'fa-volume-high'} text-indigo-400`}></i>
                        <div className="min-w-0">
                           <p className="text-[11px] font-bold text-white truncate max-w-[140px]">{f.file.name}</p>
                           <p className="text-[9px] text-slate-600 font-bold uppercase">{Math.round(f.file.size / 1024 / 1024)}MB</p>
                        </div>
                      </div>
                      <button onClick={() => removeFile(f.id)} className="text-slate-600 hover:text-red-500"><i className="fas fa-times"></i></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'manual' && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Text Content</label>
              <textarea value={input} onChange={e => setInput(e.target.value)} 
                placeholder="텍스트를 붙여넣어 분석하세요..." 
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white h-40 resize-none outline-none focus:border-indigo-500 text-sm transition-all" />
            </div>
          )}
          
          <button onClick={handleAnalyze} disabled={loading || (activeTab === 'file' ? selectedFiles.length === 0 : !input.trim())} 
            className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-[24px] font-black uppercase tracking-[0.2em] text-sm transition-all shadow-2xl shadow-indigo-600/30 active:scale-[0.98]">
            {loading ? <i className="fas fa-sync fa-spin mr-3"></i> : <i className="fas fa-brain mr-3"></i>}
            {loading ? "Neural 분석 중..." : "분석 시작"}
          </button>
        </div>
      </div>

      {history.length > 0 && (
        <section className="space-y-4">
          <h3 className="text-xs font-black italic uppercase tracking-widest flex items-center gap-3 px-2 text-slate-500">
            <i className="fas fa-history text-indigo-500"></i> Recent Sessions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {history.slice(0, 6).map(item => (
              <div key={item.id} onClick={() => setSelectedResult(item)}
                className="glass p-4 rounded-3xl border border-white/5 hover:neon-border transition-all cursor-pointer flex items-center gap-4 group relative">
                <div className="w-10 h-10 bg-indigo-600/10 rounded-xl flex items-center justify-center text-indigo-400">
                  <i className={`fas ${item.type === 'youtube' ? 'fa-play' : 'fa-file-alt'}`}></i>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-xs text-white truncate">{item.title}</p>
                  <p className="text-[9px] text-slate-500 font-bold uppercase mt-1 tracking-tighter">{item.cefrLevel} // {new Date(item.date).toLocaleDateString()}</p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); onDeleteHistory(item.id); }} className="opacity-0 group-hover:opacity-100 p-2 text-slate-700 hover:text-red-500 transition-all">
                  <i className="fas fa-trash-alt text-xs"></i>
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default MediaStudio;
