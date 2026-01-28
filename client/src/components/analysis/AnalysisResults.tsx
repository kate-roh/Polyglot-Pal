import { motion } from "framer-motion";
import { type AnalysisResult } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bookmark, MessageCircle, BookOpen, Lightbulb } from "lucide-react";
import { useCreateBookmark } from "@/hooks/use-bookmarks";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface AnalysisResultsProps {
  result: AnalysisResult;
  sourceType: string;
}

export function AnalysisResults({ result, sourceType }: AnalysisResultsProps) {
  const { mutate: createBookmark, isPending } = useCreateBookmark();
  const { toast } = useToast();

  const handleBookmark = (type: 'word' | 'sentence' | 'grammar', content: string, meaning: string, context?: string) => {
    createBookmark({
      type,
      content,
      meaning,
      context,
      sourceType
    }, {
      onSuccess: () => {
        toast({
          title: "Bookmarked!",
          description: "Added to your collection.",
        });
      }
    });
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      {/* Summary Section */}
      <motion.section variants={item}>
        <div className="glass-card rounded-2xl p-6 border-l-4 border-l-primary">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-bold">Summary</h3>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            {result.summary}
          </p>
        </div>
      </motion.section>

      {/* Grid Layout for Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vocabulary */}
        <motion.section variants={item} className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-bold">Key Vocabulary</h3>
          </div>
          {result.vocabulary.map((vocab, idx) => (
            <Card key={idx} className="glass-card p-4 hover:bg-white/5 transition-colors group">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h4 className="font-bold text-lg text-blue-300">{vocab.word}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{vocab.meaning}</p>
                  {vocab.example && (
                    <p className="text-xs text-white/50 mt-2 italic">"{vocab.example}"</p>
                  )}
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-500/20 hover:text-blue-400"
                  onClick={() => handleBookmark('word', vocab.word, vocab.meaning, vocab.example)}
                  disabled={isPending}
                >
                  <Bookmark className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </motion.section>

        {/* Grammar */}
        <motion.section variants={item} className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-bold">Grammar Points</h3>
          </div>
          {result.grammar.map((point, idx) => (
            <Card key={idx} className="glass-card p-4 hover:bg-white/5 transition-colors group">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h4 className="font-bold text-purple-300">{point.point}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{point.explanation}</p>
                  {point.example && (
                    <div className="mt-2 bg-black/20 p-2 rounded text-xs font-mono text-white/70">
                      {point.example}
                    </div>
                  )}
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-purple-500/20 hover:text-purple-400"
                  onClick={() => handleBookmark('grammar', point.point, point.explanation, point.example)}
                  disabled={isPending}
                >
                  <Bookmark className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </motion.section>
      </div>

      {/* Key Sentences */}
      <motion.section variants={item} className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <MessageCircle className="w-5 h-5 text-green-400" />
          <h3 className="text-lg font-bold">Key Sentences</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {result.keySentences.map((sentence, idx) => (
            <Card key={idx} className="glass-card p-5 hover:bg-white/5 transition-colors group relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-green-500/50" />
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-2">
                  <p className="font-medium text-lg leading-relaxed">{sentence.sentence}</p>
                  <p className="text-sm text-muted-foreground">{sentence.translation}</p>
                  {sentence.nuance && (
                    <p className="text-xs text-green-300/80 bg-green-500/10 inline-block px-2 py-1 rounded">
                      💡 {sentence.nuance}
                    </p>
                  )}
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-green-500/20 hover:text-green-400 shrink-0"
                  onClick={() => handleBookmark('sentence', sentence.sentence, sentence.translation, sentence.nuance)}
                  disabled={isPending}
                >
                  <Bookmark className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </motion.section>

      {/* Cultural Notes if any */}
      {result.culturalNotes && result.culturalNotes.length > 0 && (
        <motion.section variants={item}>
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-orange-400 mb-4">Cultural Notes</h3>
            <ul className="list-disc list-inside space-y-2 text-orange-200/80">
              {result.culturalNotes.map((note, idx) => (
                <li key={idx}>{note}</li>
              ))}
            </ul>
          </div>
        </motion.section>
      )}
    </motion.div>
  );
}
