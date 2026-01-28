import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  History, 
  Bookmark, 
  LogOut, 
  Zap,
  Sparkles,
  Globe,
  Film,
  BookOpen,
  MessageCircle,
  GraduationCap
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useUserStats } from "@/hooks/use-stats";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Navigation() {
  const [location] = useLocation();
  const { logout } = useAuth();
  const { data: stats } = useUserStats();

  const navItems = [
    { href: "/dashboard", label: "Home", icon: LayoutDashboard },
    { href: "/world-tour", label: "World Tour", icon: Globe },
    { href: "/media-studio", label: "Media Studio", icon: Film },
    { href: "/grammar-lab", label: "Grammar Lab", icon: BookOpen },
    { href: "/tutor", label: "Live Tutor", icon: MessageCircle },
    { href: "/vocabulary", label: "Vocabulary", icon: GraduationCap },
    { href: "/history", label: "History", icon: History },
    { href: "/bookmarks", label: "Collection", icon: Bookmark },
  ];

  return (
    <div className="w-full md:w-64 flex-shrink-0 flex flex-col h-full glass-panel md:border-r border-b md:border-b-0 border-white/10 z-20">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/25">
            <Sparkles className="text-white w-6 h-6" />
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
            Lingo<span className="text-primary">AI</span>
          </span>
        </div>

        {stats && (
          <div className="mb-8 p-4 rounded-xl bg-secondary/50 border border-white/5 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Level {stats.level}</span>
              <div className="flex items-center gap-1 text-yellow-400">
                <Zap className="w-3 h-3 fill-yellow-400" />
                <span className="text-xs font-bold">{stats.dailyStreak} Day Streak</span>
              </div>
            </div>
            <div className="w-full bg-black/20 rounded-full h-2 mb-1">
              <div 
                className="bg-gradient-to-r from-primary to-accent h-2 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${(stats.xp % 1000) / 10}%` }}
              />
            </div>
            <div className="flex justify-end">
              <span className="text-[10px] text-muted-foreground">{stats.xp} XP</span>
            </div>
          </div>
        )}

        <nav className="space-y-2">
          {navItems.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <div 
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer group",
                    isActive 
                      ? "bg-primary/10 text-primary border border-primary/20 shadow-sm" 
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  )}
                >
                  <Icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                  <span className="font-medium">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-6 border-t border-white/10">
        <Button 
          variant="ghost" 
          className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={() => logout()}
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
