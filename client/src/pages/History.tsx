import { Navigation } from "@/components/Navigation";
import { useHistory, useDeleteHistory } from "@/hooks/use-history";
import { format } from "date-fns";
import { Trash2, Youtube, FileText, Type, ChevronRight, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function HistoryPage() {
  const { data: history, isLoading } = useHistory();
  const { mutate: deleteItem } = useDeleteHistory();

  const getIcon = (type: string) => {
    switch(type) {
      case 'youtube': return <Youtube className="w-5 h-5 text-red-400" />;
      case 'file': return <FileText className="w-5 h-5 text-blue-400" />;
      default: return <Type className="w-5 h-5 text-green-400" />;
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-background overflow-hidden">
      <Navigation />
      
      <main className="flex-1 overflow-y-auto p-4 md:p-12 relative">
         <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-accent/5 blur-[120px] pointer-events-none" />
         
        <div className="max-w-4xl mx-auto relative z-10">
          <h1 className="text-3xl font-display font-bold mb-8">Analysis History</h1>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : history?.length === 0 ? (
            <div className="text-center py-20 opacity-50">
              <History className="w-16 h-16 mx-auto mb-4" />
              <p className="text-xl">No history yet. Start analyzing!</p>
            </div>
          ) : (
            <div className="grid gap-4">
              <AnimatePresence>
                {history?.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="glass-card p-5 rounded-xl group flex items-center gap-4 hover:border-primary/30"
                  >
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                      {getIcon(item.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-lg truncate pr-4">{item.title}</h4>
                      <p className="text-sm text-muted-foreground flex gap-3">
                        <span className="capitalize">{item.type}</span>
                        <span>•</span>
                        <span>{item.createdAt && format(new Date(item.createdAt), 'MMM d, yyyy')}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => deleteItem(item.id)}
                        className="p-2 hover:bg-destructive/20 hover:text-destructive rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                      <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
