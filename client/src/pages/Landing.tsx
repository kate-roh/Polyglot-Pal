import { Link } from "wouter";
import { ArrowRight, Sparkles, Youtube, FileText, Mic, Globe } from "lucide-react";
import { motion } from "framer-motion";

export default function Landing() {
  const features = [
    { icon: Youtube, title: "YouTube Learning", desc: "Turn any YouTube video into an interactive language lesson instantly." },
    { icon: FileText, title: "File Analysis", desc: "Upload audio, video, or documents to extract vocabulary and grammar." },
    { icon: Mic, title: "AI Tutor", desc: "Chat with an advanced AI that corrects your mistakes in real-time." },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px]" />
      </div>

      <nav className="p-6 md:p-8 flex justify-between items-center max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-purple-400 flex items-center justify-center shadow-lg shadow-primary/20">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <span className="font-display font-bold text-xl">PolyglotHub</span>
        </div>
        <a href="/api/login" className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 transition-all font-medium backdrop-blur-md">
          Sign In
        </a>
      </nav>

      <main className="flex-1 flex flex-col justify-center px-4">
        <div className="max-w-5xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
              <Globe className="w-3.5 h-3.5" />
              <span>AI-Powered Language Mastery</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-display font-bold leading-tight">
              Master any language with <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Media</span>
            </h1>
            
            <p className="text-xl text-muted-foreground leading-relaxed max-w-lg">
              Stop using boring textbooks. Learn from the content you actually love using our advanced AI analysis engine.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <a 
                href="/api/login"
                className="px-8 py-4 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-lg shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-1 transition-all flex items-center justify-center gap-2 group"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <button className="px-8 py-4 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold text-lg border border-white/10 backdrop-blur-md transition-all">
                View Demo
              </button>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative hidden lg:block"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 to-blue-500/20 blur-3xl rounded-full" />
            <div className="relative glass-panel rounded-2xl p-6 border border-white/20 shadow-2xl animate-float">
              {/* Fake UI Mockup */}
              <div className="flex items-center gap-4 mb-6 border-b border-white/10 pb-4">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <div className="ml-auto text-xs text-muted-foreground">Analysis Result</div>
              </div>
              <div className="space-y-4">
                <div className="h-8 bg-white/10 rounded w-3/4" />
                <div className="h-4 bg-white/5 rounded w-full" />
                <div className="h-4 bg-white/5 rounded w-5/6" />
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="h-24 bg-purple-500/10 rounded-xl border border-purple-500/20" />
                  <div className="h-24 bg-blue-500/10 rounded-xl border border-blue-500/20" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Feature Grid */}
        <div className="max-w-7xl mx-auto w-full mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 pb-20">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="glass-card p-8 rounded-2xl"
            >
              <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center mb-6">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
