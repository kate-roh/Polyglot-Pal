import { Sidebar } from "@/components/layout/Sidebar";
import { useBookmarks, useDeleteBookmark } from "@/hooks/use-bookmarks";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Bookmark as BookmarkIcon, MessageCircle, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function BookmarksPage() {
  const { data: bookmarks, isLoading } = useBookmarks();
  const { mutate: deleteBookmark } = useDeleteBookmark();

  if (isLoading) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'word': return <BookmarkIcon className="w-4 h-4 text-blue-400" />;
      case 'sentence': return <MessageCircle className="w-4 h-4 text-green-400" />;
      case 'grammar': return <Sparkles className="w-4 h-4 text-purple-400" />;
      default: return null;
    }
  };

  const BookmarkCard = ({ item }: { item: any }) => (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      <Card className="glass-card p-5 h-full flex flex-col">
        <div className="flex justify-between items-start gap-4 mb-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground bg-white/5 px-2 py-1 rounded-lg">
            {getIcon(item.type)}
            {item.type}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 -mt-1 -mr-1"
            onClick={() => deleteBookmark(item.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        <h3 className="text-xl font-bold mb-2 break-words">{item.content}</h3>
        <p className="text-muted-foreground mb-4">{item.meaning}</p>
        
        {item.context && (
          <div className="mt-auto pt-4 border-t border-white/5">
            <p className="text-xs text-muted-foreground/70 italic line-clamp-2">
              "{item.context}"
            </p>
          </div>
        )}
      </Card>
    </motion.div>
  );

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-4 md:p-8 lg:p-12 overflow-y-auto custom-scrollbar">
        <div className="max-w-5xl mx-auto space-y-8">
          <header>
            <h1 className="text-4xl font-display font-bold mb-2">Bookmarks</h1>
            <p className="text-muted-foreground text-lg">Your saved vocabulary and grammar collection.</p>
          </header>

          <Tabs defaultValue="all" className="w-full">
            <TabsList className="bg-white/5 border border-white/10 p-1 h-auto mb-6">
              <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-primary">All</TabsTrigger>
              <TabsTrigger value="word" className="rounded-lg data-[state=active]:bg-primary">Vocabulary</TabsTrigger>
              <TabsTrigger value="sentence" className="rounded-lg data-[state=active]:bg-primary">Sentences</TabsTrigger>
              <TabsTrigger value="grammar" className="rounded-lg data-[state=active]:bg-primary">Grammar</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {bookmarks?.map((item) => <BookmarkCard key={item.id} item={item} />)}
              </div>
            </TabsContent>
            {['word', 'sentence', 'grammar'].map((type) => (
              <TabsContent key={type} value={type} className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {bookmarks?.filter(b => b.type === type).map((item) => (
                    <BookmarkCard key={item.id} item={item} />
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>

          {bookmarks?.length === 0 && (
            <div className="text-center py-20 bg-white/5 rounded-2xl border border-dashed border-white/10">
              <BookmarkIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-bold text-muted-foreground">No bookmarks yet</h3>
              <p className="text-sm text-muted-foreground/60 mt-2">Save items from your analysis to review them later.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
