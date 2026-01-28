import { X, Medal, Trophy, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CEFR_COLORS, CEFR_LABELS } from "@/hooks/use-proficiency";

interface UserStats {
  level: number;
  xp: number;
  proficiency?: string;
}

interface LevelInfoModalProps {
  userStats: UserStats;
  onClose: () => void;
}

const levels = [
  { rank: 'C2', title: 'Mastery', range: 'Lv 81+', desc: '네이티브 수준의 복잡한 주제 이해 및 유창한 표현 가능' },
  { rank: 'C1', title: 'Advanced', range: 'Lv 51-80', desc: '광범위하고 까다로운 텍스트 이해 및 자연스러운 의사소통 가능' },
  { rank: 'B2', title: 'Upper Int.', range: 'Lv 31-50', desc: '추상적 주제의 핵심 이해 및 사회적 상호작용 원활' },
  { rank: 'B1', title: 'Intermediate', range: 'Lv 16-30', desc: '여행 상황 대처 및 친숙한 주제에 대한 간단한 설명 가능' },
  { rank: 'A2', title: 'Elementary', range: 'Lv 6-15', desc: '일상적인 정보 교환 및 단순한 문장 사용 가능' },
  { rank: 'A1', title: 'Beginner', range: 'Lv 1-5', desc: '기초적인 일상 용어 및 아주 단순한 문장 이해 가능' },
];

export function LevelInfoModal({ userStats, onClose }: LevelInfoModalProps) {
  const xpPercentage = Math.min((userStats.xp % 500) / 500 * 100, 100);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6">
      <div 
        className="absolute inset-0 bg-background/90 backdrop-blur-xl" 
        onClick={onClose}
        data-testid="modal-backdrop"
      />
      <div className="relative glass-card w-full max-w-lg rounded-3xl p-8 md:p-10 border border-border/50 shadow-2xl animate-in zoom-in-95 duration-300 overflow-y-auto max-h-[90vh]">
        <header className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
              <Medal className="w-5 h-5" />
            </div>
            <h3 className="text-2xl font-black uppercase tracking-tighter">Proficiency Radar</h3>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="rounded-full"
            data-testid="button-close-modal"
          >
            <X className="w-5 h-5" />
          </Button>
        </header>

        <div className="mb-8 p-6 bg-primary/10 rounded-3xl border border-primary/20">
          <div className="flex justify-between items-end mb-3">
            <div>
              <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Current Status</p>
              <h4 className="text-3xl font-black uppercase text-foreground">
                {userStats.proficiency || 'Unranked'}
              </h4>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-primary">
                <Trophy className="w-5 h-5" />
                <p className="text-2xl font-black">Lv.{userStats.level}</p>
              </div>
            </div>
          </div>
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500" 
              style={{ width: `${xpPercentage}%` }}
            />
          </div>
          <div className="flex justify-between items-center mt-2">
            <div className="flex items-center gap-1 text-muted-foreground">
              <TrendingUp className="w-3 h-3" />
              <p className="text-[9px] font-bold uppercase tracking-widest">Next Level Progress</p>
            </div>
            <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">
              XP: {userStats.xp % 500} / 500
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {levels.map((l) => {
            const isActive = (userStats.proficiency || '').includes(l.rank);
            return (
              <div 
                key={l.rank} 
                className={cn(
                  "p-4 rounded-2xl border transition-all",
                  isActive 
                    ? "bg-primary/20 border-primary/50" 
                    : "bg-muted/30 border-border/30 opacity-50"
                )}
                data-testid={`level-card-${l.rank}`}
              >
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "text-lg font-black px-2 py-0.5 rounded",
                      isActive ? "bg-primary text-primary-foreground" : "text-primary"
                    )}>
                      {l.rank}
                    </span>
                    <span className="text-sm font-bold text-foreground">{l.title}</span>
                  </div>
                  <span className="text-[10px] font-bold text-muted-foreground">{l.range}</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{l.desc}</p>
              </div>
            );
          })}
        </div>
        
        <p className="text-center text-[9px] text-muted-foreground font-bold uppercase mt-8 tracking-[0.3em]">
          CEFR Standardized Intelligence Matrix
        </p>
      </div>
    </div>
  );
}
