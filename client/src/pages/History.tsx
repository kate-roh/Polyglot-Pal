import { Sidebar } from "@/components/layout/Sidebar";
import { useHistory, useDeleteHistory } from "@/hooks/use-history";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Trash2, Youtube, FileText, Upload, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { AnalysisResults } from "@/components/analysis/AnalysisResults";
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

  if (isLoading) return null; // Or skeleton

  const getIcon = (type: string) => {
    switch (type) {
      case 'youtube': return <Youtube className="w-5 h-5 text-red-400" />;
      case 'file': return <Upload className="w-5 h-5 text-blue-400" />;
      default: return <FileText className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-4 md:p-8 lg:p-12 overflow-y-auto custom-scrollbar">
        <div className="max-w-5xl mx-auto space-y-8">
          <header>
            <h1 className="text-4xl font-display font-bold mb-2">History</h1>
            <p className="text-muted-foreground text-lg">Your past learning sessions.</p>
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
              <div className="text-center py-20 bg-white/5 rounded-2xl border border-dashed border-white/10">
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
          {selectedItem && (
            <div className="mt-4">
              <AnalysisResults result={selectedItem.result} sourceType={selectedItem.type} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
