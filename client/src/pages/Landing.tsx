import { Button } from "@/components/ui/button";
import { Sparkles, PlayCircle, FileText, Zap } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-background font-body text-foreground selection:bg-primary/30 flex flex-col">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 glass-panel border-b-0 border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/25">
              <Sparkles className="text-white w-6 h-6" />
            </div>
            <span className="text-xl font-display font-bold tracking-tight">LingoAI</span>
          </div>
          <Button 
            onClick={handleLogin}
            className="font-semibold rounded-full px-6 bg-white/10 hover:bg-white/20 text-white border border-white/10"
          >
            Sign In
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center relative overflow-hidden pt-20">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-accent/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-5xl mx-auto px-6 py-24 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-sm animate-in-stagger" style={{ animationDelay: '0s' }}>
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sm font-medium text-muted-foreground">AI-Powered Immersion</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-display font-bold leading-tight mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60 animate-in-stagger" style={{ animationDelay: '0.1s' }}>
            Master Any Language <br /> Through <span className="text-primary">Media</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed animate-in-stagger" style={{ animationDelay: '0.2s' }}>
            Turn YouTube videos, podcasts, and articles into interactive language lessons. 
            Extract vocabulary, grammar, and cultural nuances instantly.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in-stagger" style={{ animationDelay: '0.3s' }}>
            <Button 
              size="lg" 
              onClick={handleLogin}
              className="text-lg px-8 py-6 rounded-full bg-primary hover:bg-primary/90 shadow-xl shadow-primary/25 transition-all hover:scale-105"
            >
              Get Started Free
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="text-lg px-8 py-6 rounded-full border-white/10 bg-white/5 hover:bg-white/10 backdrop-blur-md"
            >
              View Demo
            </Button>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 animate-in-stagger" style={{ animationDelay: '0.4s' }}>
            {[
              { icon: PlayCircle, title: "Video Analysis", desc: "Paste any YouTube link to get a full breakdown of the content." },
              { icon: FileText, title: "Document Support", desc: "Upload PDFs or text files to analyze reading materials." },
              { icon: Zap, title: "Instant Learning", desc: "Get grammar points, key sentences, and vocab in seconds." }
            ].map((feature, i) => (
              <div key={i} className="glass-card p-8 rounded-2xl text-left border border-white/5 bg-gradient-to-br from-white/5 to-transparent">
                <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center text-primary mb-6">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3 font-display">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
      
      <footer className="border-t border-white/10 py-10 text-center text-muted-foreground text-sm glass-panel">
        <p>© 2024 LingoAI. Built for polyglots.</p>
      </footer>
    </div>
  );
}
