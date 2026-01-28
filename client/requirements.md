## Packages
framer-motion | Complex layout animations and page transitions
clsx | Utility for conditional class names (standard with tailwind-merge)
tailwind-merge | Utility for merging tailwind classes

## Notes
Tailwind Config - extend fontFamily:
fontFamily: {
  display: ["'Outfit'", "sans-serif"],
  body: ["'Plus Jakarta Sans'", "sans-serif"],
}

Integration assumptions:
- Replit Auth is active.
- Endpoints follow the structure defined in shared/routes.ts
- Analysis returns rich JSON structure (summary, vocabulary, grammar, etc.)
