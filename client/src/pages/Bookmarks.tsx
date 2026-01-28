import { Navigation } from "@/components/Navigation";
import { useBookmarks, useDeleteBookmark } from "@/hooks/use-bookmarks";
import { format } from "date-fns";
import { Trash2, Bookmark as BookmarkIcon, Search, Loader2 } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function BookmarksPage() {
  const { data: bookmarks, isLoading } = useBookmarks();
  const { mutate: deleteBookmark } = useDeleteBookmark();
  const [filter, setFilter] = useState('all');

  const filteredBookmarks = bookmarks?.filter(b => filter === 'all' || b.type === filter);

  return (
    <div className="flex flex-col md:flex-row h-screen bg-background overflow-hidden">
      <Navigation />
      
      <main className="flex-1 overflow-y-auto p-4 md:p-12 relative">
         <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-blue-500/5 blur-[120px] pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <h1 className="text-3xl font-display font-bold">Your Collection</h1>
            
            <div className="flex gap-2 p-1 bg-white/5 rounded-lg w-fit">
              {['all', 'word', 'sentence', 'grammar'].map(type => (
                <button
                  key={type}
                  onClick={() => setFilter(type)}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                    filter === type 
                      ? 'bg-primary text-white shadow-lg' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}s
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center h-64 items-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredBookmarks?.length === 0 ? (
            <div className="text-center py-20 opacity-50">
              <BookmarkIcon className="w-16 h-16 mx-auto mb-4" />
              <p className="text-xl">No saved items found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {filteredBookmarks?.map((item, index) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    className="glass-card p-6 rounded-2xl flex flex-col h-full group border-t-4 border-t-transparent hover:border-t-primary"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded bg-white/5 ${
                        item.type === 'word' ? 'text-accent' : 
                        item.type === 'grammar' ? 'text-blue-400' : 'text-green-400'
                      }`}>
                        {item.type}
                      </span>
                      <button 
                        onClick={() => deleteBookmark(item.id)}
                        className="opacity-0 group-hover:opacity-100 p-2 hover:bg-destructive/10 hover:text-destructive rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <h3 className="text-xl font-bold mb-2 text-foreground break-words">{item.content}</h3>
                    <p className="text-primary font-medium mb-4">{item.meaning}</p>
                    
                    {item.context && (
                      <div className="mt-auto pt-4 border-t border-white/5">
                        <p className="text-sm text-muted-foreground italic line-clamp-3">"{item.context}"</p>
                      </div>
                    )}
                    
                    <div className="mt-4 text-xs text-muted-foreground/50 flex justify-between items-center">
                      <span className="capitalize truncate max-w-[150px]">{item.sourceType}</span>
                      <span>{item.createdAt && format(new Date(item.createdAt), 'MMM d')}</span>
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
