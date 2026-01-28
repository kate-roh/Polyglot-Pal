import { Link } from "wouter";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background text-foreground">
      <div className="glass-card p-12 rounded-2xl text-center max-w-md w-full border border-white/10 shadow-2xl">
        <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="h-10 w-10 text-destructive" />
        </div>
        <h1 className="text-4xl font-display font-bold mb-4">404</h1>
        <p className="text-lg text-muted-foreground mb-8">
          The page you are looking for does not exist.
        </p>
        <Link href="/">
          <button className="w-full py-3 px-6 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-colors">
            Return Home
          </button>
        </Link>
      </div>
    </div>
  );
}
