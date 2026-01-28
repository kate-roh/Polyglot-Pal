import { useState } from "react";
import { Youtube, FileText, Type, UploadCloud, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface MediaInputProps {
  onAnalyze: (type: 'youtube' | 'file' | 'manual', content: string, title?: string, mimeType?: string) => void;
  isPending: boolean;
}

export function MediaInput({ onAnalyze, isPending }: MediaInputProps) {
  const [activeTab, setActiveTab] = useState<'youtube' | 'file' | 'manual'>('youtube');
  const [input, setInput] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = async () => {
    if (activeTab === 'youtube' && input) {
      onAnalyze('youtube', input, "YouTube Video");
    } else if (activeTab === 'manual' && input) {
      onAnalyze('manual', input, "Text Analysis");
    } else if (activeTab === 'file' && file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        // Basic Base64 extraction
        const content = result.split(',')[1]; 
        onAnalyze('file', content, file.name, file.type);
      };
      reader.readAsDataURL(file);
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
              onClick={() => { setActiveTab(tab.id); setInput(""); setFile(null); }}
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
        <div className="bg-card/90 rounded-xl p-6 md:p-8 backdrop-blur-xl relative overflow-hidden">
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
                <div className="space-y-4 text-center">
                   <div className="text-center mb-6">
                    <h3 className="text-lg font-semibold mb-1">Upload a Document or Media</h3>
                    <p className="text-muted-foreground text-sm">Supports PDF, TXT, MP3, MP4 (max 10MB)</p>
                  </div>
                  <div className="border-2 border-dashed border-white/10 rounded-2xl p-10 hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer relative group">
                    <input 
                      type="file" 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      accept=".pdf,.txt,.mp3,.mp4,.wav"
                    />
                    <div className="flex flex-col items-center gap-3">
                      {file ? (
                        <>
                          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary mb-2">
                            <FileText className="w-8 h-8" />
                          </div>
                          <span className="text-lg font-medium text-foreground">{file.name}</span>
                          <span className="text-sm text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setFile(null); }}
                            className="mt-2 text-xs text-red-400 hover:text-red-300 flex items-center gap-1 z-20 relative"
                          >
                            <X className="w-3 h-3" /> Remove
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <UploadCloud className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                          <span className="text-lg font-medium text-muted-foreground group-hover:text-primary transition-colors">Click to browse or drop file here</span>
                        </>
                      )}
                    </div>
                  </div>
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
                  disabled={isPending || (!input && !file)}
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
