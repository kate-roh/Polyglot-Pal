# Polyglot Hub - AI Language Learning Platform

## Overview

Polyglot Hub is an AI-powered language learning platform that combines immersive roleplay experiences with media analysis tools. The application allows users to practice languages through virtual "world tours" to different destinations, analyze YouTube videos and audio/video files for language learning content, and track their progress with XP and leveling systems.

Key features include:
- Media Studio for analyzing YouTube videos, uploaded files, and manual text input
- World Tour mode for destination-based language practice with voice input/output (STT/TTS)
- Vocabulary, phrases, and grammar extraction from media content
- Bookmark/vault system for saving words, phrases, sentences, and grammar points
- Progress tracking with XP, levels, and daily streaks
- Passport stamp system for completed World Tour cities
- Replit Auth integration for user authentication

### Bookmark Types
The bookmark system supports four types of saved items:
- **word**: Single vocabulary words
- **phrase**: Multi-word expressions, idioms, collocations (e.g., "get it right", "in quick succession")
- **sentence**: Full sentences with translations
- **grammar**: Grammar patterns and rules

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18+ with TypeScript
- **Routing**: Wouter (lightweight router)
- **State Management**: TanStack Query (React Query) for server state
- **Styling**: Tailwind CSS with shadcn/ui components
- **Animations**: Framer Motion for complex transitions
- **Build Tool**: Vite with React plugin

The frontend follows a feature-based organization with pages, components, hooks, and lib utilities. Path aliases (`@/` for client/src, `@shared/` for shared) simplify imports.

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Authentication**: Replit Auth (session-based with passport)
- **AI Integration**: Google Gemini API for content analysis

The backend uses a modular route registration pattern. Protected routes require authentication via the `isAuthenticated` middleware.

### Data Storage
- **Database**: PostgreSQL via Drizzle ORM
- **Schema Location**: `shared/schema.ts`
- **Tables**: users, sessions, userStats, analysisHistory, bookmarks, conversations, messages
- **Migrations**: Generated via `drizzle-kit push`

### API Structure
Routes are defined in `shared/routes.ts` using Zod schemas for type-safe request/response validation. The pattern uses a centralized `api` object with method, path, input schema, and response schemas.

Key endpoints:
- `POST /api/media/analyze` - Analyze media content with Gemini AI
- `GET/POST /api/stats` - User statistics management
- `GET/POST/DELETE /api/bookmarks` - Bookmark CRUD operations
- `GET/POST/DELETE /api/history` - Analysis history management

### Authentication Flow
Uses Replit Auth integration located in `server/replit_integrations/auth`. Sessions are stored in PostgreSQL via `connect-pg-simple`. The `isAuthenticated` middleware protects API routes.

## External Dependencies

### AI Services
- **Google Gemini API**: Used for media content analysis, grammar lessons, and chat functionality
- Environment variables: `AI_INTEGRATIONS_GEMINI_API_KEY`, `AI_INTEGRATIONS_GEMINI_BASE_URL`

### Database
- **PostgreSQL**: Primary data store
- Environment variable: `DATABASE_URL`
- Session storage via `connect-pg-simple`

### Third-Party Libraries
- **Leaflet**: Interactive world map for destination selection
- **Recharts**: Statistics and progress visualization
- **Radix UI**: Accessible component primitives (via shadcn/ui)

### External Assets
- Font Awesome icons (CDN)
- Google Fonts (Outfit, Plus Jakarta Sans, DM Sans, Geist Mono)
- Leaflet map tiles from CartoDB

### Build & Development
- Vite for frontend bundling with HMR
- esbuild for production server bundling
- TypeScript for type safety across full stack