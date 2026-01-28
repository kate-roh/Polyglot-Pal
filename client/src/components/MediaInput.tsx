import { useState, useRef } from "react";
import { Youtube, FileText, Type, UploadCloud, X, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface MediaInputProps {
  onAnalyze: (type: 'youtube' | 'file' | 'manual', content: string, title?: string, mimeType?: string) => void;
  isPending: boolean;
}

interface FileItem {
  id: string;
  file: File;
}

export function MediaInput({ onAnalyze, isPending }: MediaInputProps) {
  const [activeTab, setActiveTab] = useState<'youtube' | 'file' | 'manual'>('youtube');
  const [input, setInput] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<FileItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles: FileItem[] = [];
    for (let i = 0; i < files.length; i++) {
      if (files[i].size > 100 * 1024 * 1024) { 
        alert(`Warning: ${files[i].name} (>100MB) may cause memory issues in browser.`);
      }
      newFiles.push({ id: Math.random().toString(36).substr(2, 9), file: files[i] });
    }
    setSelectedFiles(prev => [...prev, ...newFiles]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (id: string) => {
    setSelectedFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleSubmit = async () => {
    if (activeTab === 'youtube' && input) {
      onAnalyze('youtube', input, "YouTube Video");
    } else if (activeTab === 'manual' && input) {
      onAnalyze('manual', input, "Text Analysis");
    } else if (activeTab === 'file' && selectedFiles.length > 0) {
      // Process files one by one
      for (const item of selectedFiles) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          const content = result.split(',')[1]; 
          onAnalyze('file', content, item.file.name, item.file.type);
        };
        reader.readAsDataURL(item.file);
      }
      setSelectedFiles([]);
    }
  };

  const tabs = [
    { id: 'youtube', label: 'YouTube', icon: Youtube },
    { id: 'file', label: 'File Upload', icon: FileText },
    { id: 'manual', label: 'Enter Text', icon: Type },
  ] as const;

  return (
    <div className="w-full max-w-3xl mx-auto mb-10">
      <div className="flex justify-center gap-2 mb-8 bg-black/20 p-1 rounded-2xl w-fit mx-auto backdrop-blur-sm">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setInput(""); setSelectedFiles([]); }}
              className={cn(
                "flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium transition-all duration-300",
                isActive 
                  ? "bg-primary text-white shadow-lg shadow-primary/25" 
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="glass-panel rounded-2xl p-1 bg-gradient-to-br from-white/10 to-transparent">
        <div className="bg-card/90 rounded-xl p-6 md:p-8 backdrop-blur-xl relative overflow-hidden min-h-[400px]">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="relative z-10"
            >
              {activeTab === 'youtube' && (
                <div className="space-y-4">
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-semibold mb-1">Paste a YouTube Link</h3>
                    <p className="text-muted-foreground text-sm">We'll transcribe and analyze the video for you.</p>
                  </div>
                  <input
                    type="text"
                    placeholder="https://youtube.com/watch?v=..."
                    className="w-full px-5 py-4 rounded-xl bg-secondary/50 border border-white/5 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-muted-foreground/50 text-lg"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                  />
                </div>
              )}

              {activeTab === 'file' && (
                <div className="space-y-4">
                   <div className="text-center mb-6">
                    <h3 className="text-lg font-semibold mb-1">Upload Documents or Media</h3>
                    <p className="text-muted-foreground text-sm">Supports PDF, TXT, MP3, MP4 (max 100MB)</p>
                  </div>
                  
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-white/10 rounded-2xl p-10 hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer relative group text-center"
                  >
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      className="hidden"
                      multiple
                      onChange={handleFileChange}
                      accept=".pdf,.txt,.mp3,.mp4,.wav"
                    />
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <UploadCloud className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <span className="text-lg font-medium text-muted-foreground group-hover:text-primary transition-colors">Click to browse or drop files here</span>
                    </div>
                  </div>

                  {selectedFiles.length > 0 && (
                    <div className="mt-4 space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                      {selectedFiles.map(f => (
                        <div key={f.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", f.file.size > 100*1024*1024 ? "bg-amber-500/10 text-amber-500" : "bg-primary/10 text-primary")}>
                              <FileText className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate text-foreground">{f.file.name}</p>
                              <p className="text-xs text-muted-foreground">{(f.file.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                          </div>
                          <button onClick={() => removeFile(f.id)} className="p-2 hover:bg-white/10 rounded-lg text-muted-foreground hover:text-destructive transition-colors">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {selectedFiles.some(f => f.file.size > 100*1024*1024) && (
                    <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Warning</AlertTitle>
                      <AlertDescription>
                        Some files are larger than 100MB and may cause browser memory issues.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              {activeTab === 'manual' && (
                <div className="space-y-4">
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-semibold mb-1">Enter Text for Analysis</h3>
                    <p className="text-muted-foreground text-sm">Paste any article, paragraph, or conversation.</p>
                  </div>
                  <textarea
                    placeholder="Paste your text here..."
                    className="w-full h-48 px-5 py-4 rounded-xl bg-secondary/50 border border-white/5 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-muted-foreground/50 resize-none text-lg leading-relaxed"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                  />
                </div>
              )}

              <div className="mt-8 flex justify-center">
                <button
                  onClick={handleSubmit}
                  disabled={isPending || (!input && selectedFiles.length === 0)}
                  className="
                    px-10 py-4 rounded-xl font-bold text-lg
                    bg-gradient-to-r from-primary to-accent
                    text-white shadow-lg shadow-primary/25
                    hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-0.5
                    active:translate-y-0 active:shadow-md
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                    transition-all duration-300 ease-out w-full md:w-auto min-w-[200px]
                  "
                >
                  {isPending ? (
                    <span className="flex items-center gap-2 justify-center">
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Analyzing...
                    </span>
                  ) : (
                    "Start Analysis"
                  )}
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
