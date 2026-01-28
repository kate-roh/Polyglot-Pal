import { Navigation } from "@/components/Navigation";
import { useHistory, useDeleteHistory } from "@/hooks/use-history";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, getDay, addMonths, subMonths, isToday, isSameMonth } from "date-fns";
import { Trash2, Youtube, FileText, Upload, ChevronLeft, ChevronRight, Loader2, Globe } from "lucide-react";
import { motion } from "framer-motion";
import { AnalysisDisplay } from "@/components/AnalysisDisplay";
import { useState, useMemo } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type TabType = 'expeditions' | 'vault';

export default function HistoryPage() {
  const { data: history, isLoading } = useHistory();
  const { mutate: deleteHistory } = useDeleteHistory();
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [activeTab, setActiveTab] = useState<TabType>('expeditions');

  const daysOfWeek = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  const handleMonthChange = (newMonth: Date) => {
    setCurrentMonth(newMonth);
    const today = new Date();
    if (isSameMonth(newMonth, today)) {
      setSelectedDate(today);
    } else {
      setSelectedDate(startOfMonth(newMonth));
    }
  };

  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });
    
    // Get the day of week for the first day (0 = Sunday, 1 = Monday, etc.)
    // We want Monday to be 0, so we adjust
    let startDay = getDay(start);
    startDay = startDay === 0 ? 6 : startDay - 1; // Convert Sunday=0 to Monday=0 format
    
    // Add empty slots for days before the start of the month
    const paddedDays: (Date | null)[] = Array(startDay).fill(null);
    return [...paddedDays, ...days];
  }, [currentMonth]);

  // Get dates that have activity
  const activityDates = useMemo(() => {
    if (!history) return new Set<string>();
    return new Set(
      history.map(item => format(new Date(item.createdAt!), 'yyyy-MM-dd'))
    );
  }, [history]);

  // Filter logs for selected date
  const logsForSelectedDate = useMemo(() => {
    if (!selectedDate || !history) return [];
    return history.filter(item => 
      isSameDay(new Date(item.createdAt!), selectedDate)
    );
  }, [selectedDate, history]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'youtube': return <Youtube className="w-5 h-5 text-red-400" />;
      case 'file': return <Upload className="w-5 h-5 text-blue-400" />;
      case 'world-tour': return <Globe className="w-5 h-5 text-green-400" />;
      default: return <FileText className="w-5 h-5 text-muted-foreground" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col md:flex-row h-screen bg-background overflow-hidden">
        <Navigation />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-background overflow-hidden font-body text-foreground">
      <Navigation />
      <main className="flex-1 overflow-y-auto relative scroll-smooth">
        <div className="absolute top-0 left-0 w-full h-96 bg-primary/10 blur-[100px] pointer-events-none z-0" />
        <div className="relative z-10 max-w-lg mx-auto px-4 py-8 space-y-6">
          
          {/* Header */}
          <header className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-1">
                Activity Radar
              </h1>
              <p className="text-sm text-muted-foreground uppercase tracking-widest font-medium">
                Neural History Log
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleMonthChange(subMonths(currentMonth, 1))}
                className="rounded-full"
                data-testid="button-prev-month"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="px-4 py-2 bg-primary/20 rounded-xl border border-primary/30">
                <span className="text-sm font-bold text-primary uppercase">
                  {format(currentMonth, 'MMM yyyy')}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleMonthChange(addMonths(currentMonth, 1))}
                className="rounded-full"
                data-testid="button-next-month"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </header>

          {/* Calendar Grid */}
          <Card className="glass-card p-6 rounded-3xl border border-border/50">
            {/* Days of week header */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {daysOfWeek.map((day, idx) => (
                <div key={idx} className="text-center text-xs font-bold text-muted-foreground uppercase py-2">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, idx) => {
                if (!day) {
                  return <div key={`empty-${idx}`} className="aspect-square" />;
                }
                
                const dateStr = format(day, 'yyyy-MM-dd');
                const hasActivity = activityDates.has(dateStr);
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isTodayDate = isToday(day);
                
                return (
                  <motion.button
                    key={dateStr}
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      "aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-bold transition-all relative",
                      isSelected 
                        ? "bg-primary text-primary-foreground" 
                        : hasActivity 
                          ? "bg-primary/30 text-primary hover:bg-primary/40" 
                          : "bg-muted/30 text-muted-foreground hover:bg-muted/50",
                      isTodayDate && !isSelected && "ring-2 ring-primary/50"
                    )}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    data-testid={`calendar-day-${format(day, 'd')}`}
                  >
                    {format(day, 'd')}
                    {hasActivity && !isSelected && (
                      <div className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-primary" />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </Card>

          {/* Logs for selected date */}
          <div className="space-y-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">
              Logs for {selectedDate ? format(selectedDate, 'do') : '...'}
            </h3>
            
            {logsForSelectedDate.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground/60 italic">
                No activity recorded for this timestamp.
              </div>
            ) : (
              <div className="space-y-3">
                {logsForSelectedDate.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card 
                      className="glass-card p-4 flex items-center gap-4 group cursor-pointer hover:border-primary/30 transition-all"
                      onClick={() => setSelectedItem(item)}
                      data-testid={`history-item-${item.id}`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                        {getIcon(item.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm truncate">{item.title}</h4>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          <span className="bg-white/5 px-2 py-0.5 rounded uppercase tracking-wider">{item.type}</span>
                          <span>{format(new Date(item.createdAt!), 'HH:mm')}</span>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteHistory(item.id);
                        }}
                        data-testid={`button-delete-${item.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Tab Navigation */}
          <div className="flex p-1 bg-muted/30 rounded-2xl border border-border/30">
            <button
              onClick={() => setActiveTab('expeditions')}
              className={cn(
                "flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                activeTab === 'expeditions' 
                  ? "bg-transparent text-muted-foreground" 
                  : "text-muted-foreground/50"
              )}
              data-testid="tab-expeditions"
            >
              Expeditions
            </button>
            <button
              onClick={() => setActiveTab('vault')}
              className={cn(
                "flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                activeTab === 'vault' 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground/50"
              )}
              data-testid="tab-vault"
            >
              Knowledge Vault
            </button>
          </div>
        </div>
      </main>

      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto glass-panel border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold font-display">{selectedItem?.title}</DialogTitle>
          </DialogHeader>
          {selectedItem && selectedItem.result && (
            <div className="mt-4">
              <AnalysisDisplay data={selectedItem.result} sourceType={selectedItem.type} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
