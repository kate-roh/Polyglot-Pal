import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { MediaInput } from "@/components/MediaInput";
import { AnalysisDisplay } from "@/components/AnalysisDisplay";
import { useAnalyzeMedia } from "@/hooks/use-media";
import { useSaveHistory } from "@/hooks/use-history";
import { useAddXp } from "@/hooks/use-stats";
import { type AnalysisResult } from "@shared/routes";

export default function Dashboard() {
  const { mutate: analyze, isPending } = useAnalyzeMedia();
  const { mutate: saveHistory } = useSaveHistory();
  const { mutate: addXp } = useAddXp();
  
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [currentSourceType, setCurrentSourceType] = useState<string>("");
  const [statusMessage, setStatusMessage] = useState("");

  const handleAnalyze = (type: 'youtube' | 'file' | 'manual', content: string, title?: string, mimeType?: string) => {
    setCurrentSourceType(type);
    setResult(null); // Reset previous result
    setStatusMessage(`Analyzing ${title || type}...`);

    analyze(
      { type, content, title, mimeType },
      {
        onSuccess: (data) => {
          setResult(data);
          setStatusMessage("Analysis Complete!");
          
          // Save to history automatically
          saveHistory({
            type,
            title: title || `Analysis of ${type}`,
            originalContent: type === 'manual' ? content.substring(0, 100) + "..." : content, // Truncate manual text
            result: data,
          });

          // Award XP
          addXp(50);
          
          // Clear status after a bit
          setTimeout(() => setStatusMessage(""), 2000);
        },
        onError: () => {
          setStatusMessage("Analysis Failed. Please try again.");
        }
      }
    );
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-background overflow-hidden font-body text-foreground selection:bg-primary/30">
      <Navigation />
      
      <main className="flex-1 overflow-y-auto relative scroll-smooth">
        {/* Ambient Background Glow */}
        <div className="absolute top-0 left-0 w-full h-96 bg-primary/10 blur-[100px] pointer-events-none z-0" />
        
        <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-8 py-12">
          <header className="mb-12 text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
              Media <span className="text-primary">Studio</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Upload files, paste links, or write text to extract vocabulary, grammar, and cultural insights instantly.
            </p>
            {statusMessage && (
              <p className="mt-2 text-primary animate-pulse font-medium">{statusMessage}</p>
            )}
          </header>

          <MediaInput onAnalyze={handleAnalyze} isPending={isPending} />

          {result && (
            <div className="animate-in-stagger">
              <div className="flex items-center gap-4 mb-8">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <span className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Analysis Result</span>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              </div>
              
              <AnalysisDisplay data={result} sourceType={currentSourceType} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}