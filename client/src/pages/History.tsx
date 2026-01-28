import { Navigation } from "@/components/Navigation";
import { useHistory, useDeleteHistory } from "@/hooks/use-history";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Trash2, Youtube, FileText, Upload, Calendar, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { AnalysisDisplay } from "@/components/AnalysisDisplay";
import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";

export default function HistoryPage() {
  const { data: history, isLoading } = useHistory();
  const { mutate: deleteHistory } = useDeleteHistory();
  const [selectedItem, setSelectedItem] = useState<any>(null);

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

  const getIcon = (type: string) => {
    switch (type) {
      case 'youtube': return <Youtube className="w-5 h-5 text-red-400" />;
      case 'file': return <Upload className="w-5 h-5 text-blue-400" />;
      default: return <FileText className="w-5 h-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-background overflow-hidden font-body text-foreground">
      <Navigation />
      <main className="flex-1 overflow-y-auto relative scroll-smooth">
        <div className="absolute top-0 left-0 w-full h-96 bg-primary/10 blur-[100px] pointer-events-none z-0" />
        <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-8 py-12 space-y-8">
          <header className="text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
              Learning <span className="text-primary">History</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">Your past learning sessions and analyses.</p>
          </header>

          <div className="grid gap-4">
            {history?.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="glass-card p-4 flex flex-col md:flex-row items-start md:items-center gap-4 group">
                  <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                    {getIcon(item.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg truncate pr-4">{item.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {format(new Date(item.createdAt!), 'MMM d, yyyy')}
                      </span>
                      <span className="bg-white/5 px-2 py-0.5 rounded text-xs uppercase tracking-wider">{item.type}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 w-full md:w-auto mt-4 md:mt-0">
                    <Button 
                      onClick={() => setSelectedItem(item)}
                      className="flex-1 md:flex-none"
                    >
                      View Analysis
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
                      onClick={() => deleteHistory(item.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}

            {history?.length === 0 && (
              <div className="text-center py-20 bg-muted/20 rounded-2xl border border-dashed border-border">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-bold text-muted-foreground">No history yet</h3>
                <p className="text-sm text-muted-foreground/60 mt-2">Start a new analysis to see it here.</p>
              </div>
            )}
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
