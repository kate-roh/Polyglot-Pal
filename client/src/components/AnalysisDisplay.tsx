import { motion } from "framer-motion";
import { BookMarked, MessageSquare, BookOpen, Lightbulb, Quote } from "lucide-react";
import { type AnalysisResult } from "@shared/schema";
import { useAddBookmark } from "@/hooks/use-bookmarks";

interface AnalysisDisplayProps {
  data: AnalysisResult;
  sourceType: string;
}

export function AnalysisDisplay({ data, sourceType }: AnalysisDisplayProps) {
  const { mutate: bookmark } = useAddBookmark();

  const handleBookmark = (type: 'word' | 'sentence' | 'grammar' | 'phrase', content: string, meaning: string, context?: string) => {
    bookmark({
      type,
      sourceType,
      content,
      meaning,
      context,
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
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8 pb-20"
    >
      {/* Summary Section */}
      <motion.div variants={item} className="glass-card p-6 rounded-2xl border-l-4 border-l-primary">
        <h3 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
          <Lightbulb className="w-6 h-6 text-yellow-400" />
          Summary
        </h3>
        <p className="text-lg leading-relaxed text-muted-foreground">{data.summary}</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Vocabulary Section */}
        <motion.div variants={item} className="space-y-4">
          <h3 className="text-xl font-display font-bold flex items-center gap-2 text-accent">
            <BookOpen className="w-6 h-6" />
            Key Vocabulary
          </h3>
          {data.vocabulary.map((vocab, i) => (
            <div key={i} className="glass-card p-4 rounded-xl group relative overflow-hidden">
              <div className="flex justify-between items-start mb-2">
                <h4 className="text-lg font-bold text-foreground">{vocab.word}</h4>
                <button 
                  onClick={() => handleBookmark('word', vocab.word, vocab.meaning, vocab.example)}
                  className="p-2 rounded-full hover:bg-white/10 text-muted-foreground hover:text-accent transition-colors"
                >
                  <BookMarked className="w-5 h-5" />
                </button>
              </div>
              <p className="text-primary font-medium mb-2">{vocab.meaning}</p>
              {vocab.example && (
                <p className="text-sm text-muted-foreground italic border-l-2 border-white/10 pl-3">"{vocab.example}"</p>
              )}
            </div>
          ))}
        </motion.div>

        {/* Grammar Section */}
        <motion.div variants={item} className="space-y-4">
          <h3 className="text-xl font-display font-bold flex items-center gap-2 text-blue-400">
            <BookMarked className="w-6 h-6" />
            Grammar Points
          </h3>
          {data.grammar.map((point, i) => (
            <div key={i} className="glass-card p-4 rounded-xl">
              <div className="flex justify-between items-start mb-2">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {point.point}
                </span>
                <button 
                  onClick={() => handleBookmark('grammar', point.point, point.explanation, point.example)}
                  className="p-2 rounded-full hover:bg-white/10 text-muted-foreground hover:text-blue-400 transition-colors"
                >
                  <BookMarked className="w-5 h-5" />
                </button>
              </div>
              <p className="text-muted-foreground mb-3">{point.explanation}</p>
              {point.example && (
                <div className="bg-black/20 p-3 rounded-lg text-sm font-mono text-blue-200/80">
                  {point.example}
                </div>
              )}
            </div>
          ))}
        </motion.div>
      </div>

      {/* Phrases Section */}
      {data.phrases && data.phrases.length > 0 && (
        <motion.div variants={item} className="space-y-4">
          <h3 className="text-xl font-display font-bold flex items-center gap-2 text-orange-400">
            <Quote className="w-6 h-6" />
            Useful Phrases & Expressions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.phrases.map((phrase, i) => (
              <div key={i} className="glass-card p-4 rounded-xl border border-white/5 hover:border-orange-500/30 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-lg font-bold text-foreground">{phrase.phrase}</h4>
                  <button 
                    onClick={() => handleBookmark('phrase', phrase.phrase, phrase.meaning, phrase.usage)}
                    className="p-2 rounded-full hover:bg-white/10 text-muted-foreground hover:text-orange-400 transition-colors"
                  >
                    <BookMarked className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-orange-400/80 font-medium mb-2">{phrase.meaning}</p>
                {phrase.usage && (
                  <p className="text-sm text-muted-foreground italic border-l-2 border-orange-500/30 pl-3">"{phrase.usage}"</p>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Key Sentences Section */}
      <motion.div variants={item} className="space-y-4">
        <h3 className="text-xl font-display font-bold flex items-center gap-2 text-green-400">
          <MessageSquare className="w-6 h-6" />
          Key Sentences
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.keySentences.map((sentence, i) => (
            <div key={i} className="glass-card p-5 rounded-xl border border-white/5 hover:border-green-500/30 transition-colors">
              <div className="flex justify-between items-start mb-3">
                <p className="text-lg font-medium text-foreground pr-4">{sentence.sentence}</p>
                <button 
                  onClick={() => handleBookmark('sentence', sentence.sentence, sentence.translation, sentence.nuance)}
                  className="p-2 rounded-full hover:bg-white/10 text-muted-foreground hover:text-green-400 transition-colors shrink-0"
                >
                  <BookMarked className="w-5 h-5" />
                </button>
              </div>
              <p className="text-green-400/80 italic mb-2">{sentence.translation}</p>
              {sentence.nuance && (
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-bold mt-3">
                  Nuance: <span className="text-muted-foreground/70 font-normal normal-case tracking-normal">{sentence.nuance}</span>
                </p>
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Cultural Notes */}
      {data.culturalNotes && data.culturalNotes.length > 0 && (
        <motion.div variants={item} className="glass-card p-6 rounded-2xl bg-gradient-to-br from-purple-900/20 to-transparent border border-purple-500/20">
          <h3 className="text-lg font-bold mb-4 text-purple-300 uppercase tracking-widest text-xs">Cultural Context</h3>
          <ul className="space-y-3">
            {data.culturalNotes.map((note, i) => (
              <li key={i} className="flex gap-3 text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 shrink-0" />
                {note}
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </motion.div>
  );
}
