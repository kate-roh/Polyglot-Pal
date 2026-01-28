import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Sparkles } from "lucide-react";

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  subMessage?: string;
}

export function LoadingOverlay({ isVisible, message = "Processing...", subMessage }: LoadingOverlayProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-xl flex flex-col items-center justify-center p-4"
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center max-w-sm text-center"
          >
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full animate-pulse" />
              <div className="w-16 h-16 bg-gradient-to-tr from-primary to-purple-500 rounded-2xl flex items-center justify-center shadow-xl shadow-primary/25 relative z-10 animate-float">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-background rounded-full p-1.5 shadow-lg border border-border z-20">
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
              </div>
            </div>

            <h2 className="text-2xl font-display font-bold text-white mb-2">{message}</h2>
            {subMessage && (
              <p className="text-muted-foreground">{subMessage}</p>
            )}

            <div className="mt-8 w-64 h-1.5 bg-secondary rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-primary rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity,
                  ease: "easeInOut" 
                }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
