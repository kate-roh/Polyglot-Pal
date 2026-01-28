import { Link } from "wouter";
import { Navigation } from "@/components/Navigation";
import { useUserStats } from "@/hooks/use-stats";
import { useHistory } from "@/hooks/use-history";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Globe, 
  Film, 
  BookOpen, 
  MessageCircle, 
  GraduationCap,
  ArrowRight,
  Sparkles,
  Zap,
  Trophy,
  Target
} from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    href: "/world-tour",
    title: "World Tour",
    description: "Complete language missions in cities around the world",
    icon: Globe,
    color: "from-blue-500 to-cyan-500",
    highlight: true
  },
  {
    href: "/media-studio",
    title: "Media Studio",
    description: "Analyze YouTube videos, audio files, and text",
    icon: Film,
    color: "from-purple-500 to-pink-500"
  },
  {
    href: "/grammar-lab",
    title: "Grammar Lab",
    description: "Learn grammar rules with AI-powered explanations",
    icon: BookOpen,
    color: "from-green-500 to-emerald-500"
  },
  {
    href: "/tutor",
    title: "Live Tutor",
    description: "Practice conversation with your AI language tutor",
    icon: MessageCircle,
    color: "from-orange-500 to-amber-500"
  },
  {
    href: "/vocabulary",
    title: "Vocabulary",
    description: "Review and practice your saved vocabulary",
    icon: GraduationCap,
    color: "from-red-500 to-rose-500"
  }
];

export default function Dashboard() {
  const { data: stats } = useUserStats();
  const { data: history = [] } = useHistory();

  const recentActivity = history.slice(0, 3);
  const completedCities = JSON.parse(localStorage.getItem('polyglot_completed_cities') || '[]');

  return (
    <div className="flex flex-col md:flex-row h-screen bg-background overflow-hidden font-body text-foreground selection:bg-primary/30">
      <Navigation />
      
      <main className="flex-1 overflow-y-auto relative scroll-smooth">
        <div className="absolute top-0 left-0 w-full h-96 bg-primary/10 blur-[100px] pointer-events-none z-0" />
        
        <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-8 py-12">
          <header className="mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 mb-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/25">
                <Sparkles className="text-white w-6 h-6" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
                  Welcome to <span className="text-primary">LingoAI</span>
                </h1>
                <p className="text-muted-foreground">Your AI-powered language learning companion</p>
              </div>
            </motion.div>
          </header>

          {stats && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
            >
              <Card className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.level}</p>
                    <p className="text-xs text-muted-foreground">Level</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-4 bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.xp}</p>
                    <p className="text-xs text-muted-foreground">Total XP</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-4 bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <Target className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.dailyStreak}</p>
                    <p className="text-xs text-muted-foreground">Day Streak</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{completedCities.length}</p>
                    <p className="text-xs text-muted-foreground">Cities Visited</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-12"
          >
            <h2 className="text-xl font-bold text-foreground mb-6">Start Learning</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {features.map((feature, i) => (
                <Link key={feature.href} href={feature.href}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * i }}
                    whileHover={{ y: -4 }}
                    className={`group cursor-pointer ${feature.highlight ? 'md:col-span-2 lg:col-span-1' : ''}`}
                  >
                    <Card className={`p-6 h-full border-border/50 hover:border-primary/30 transition-all duration-300 ${feature.highlight ? 'bg-gradient-to-br from-primary/10 to-purple-500/10 border-primary/20' : ''}`}>
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                        <feature.icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">{feature.description}</p>
                      <div className="flex items-center text-primary text-sm font-medium">
                        Start <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Card>
                  </motion.div>
                </Link>
              ))}
            </div>
          </motion.div>

          {recentActivity.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-foreground">Recent Activity</h2>
                <Link href="/history">
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                    View All <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
              <div className="space-y-3">
                {recentActivity.map((item: any) => (
                  <Card key={item.id} className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Film className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{item.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
