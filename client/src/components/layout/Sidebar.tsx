import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  History, 
  Bookmark, 
  LogOut, 
  Sparkles,
  User,
  Globe
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { useStats } from "@/hooks/use-stats";

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { data: stats } = useStats();

  const navItems = [
    { href: "/dashboard", label: "Media Studio", icon: LayoutDashboard },
    { href: "/world-tour", label: "World Tour", icon: Globe },
    { href: "/history", label: "History", icon: History },
    { href: "/bookmarks", label: "Bookmarks", icon: Bookmark },
  ];

  return (
    <aside className="w-64 h-screen fixed left-0 top-0 glass-panel border-r border-white/10 flex flex-col z-50 hidden md:flex">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-purple-400 flex items-center justify-center shadow-lg shadow-primary/20">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg leading-tight">Polyglot<br/><span className="text-primary font-normal">Hub</span></h1>
          </div>
        </div>

        {/* User Stats Card */}
        <div className="bg-white/5 rounded-xl p-4 border border-white/5 mb-6 backdrop-blur-md">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-white truncate max-w-[120px]">
                {user?.firstName || "Learner"}
              </p>
              <p className="text-xs text-muted-foreground">Level {stats?.level || 1}</p>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>XP Progress</span>
              <span>{stats?.xp || 0} XP</span>
            </div>
            <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${Math.min(((stats?.xp || 0) % 1000) / 10, 100)}%` }}
              />
            </div>
          </div>
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                  isActive 
                    ? "bg-primary/20 text-primary border border-primary/20" 
                    : "text-muted-foreground hover:bg-white/5 hover:text-white"
                )}
              >
                <Icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", isActive && "text-primary")} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-6">
        <button 
          onClick={() => logout()}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-muted-foreground hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
}
