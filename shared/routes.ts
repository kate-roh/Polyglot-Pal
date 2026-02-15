import { z } from 'zod';
import { insertUserStatsSchema, insertAnalysisHistorySchema, insertBookmarkSchema, mediaAnalyzeRequestSchema, userStats, analysisHistory, bookmarks, analysisResultSchema } from './schema';

// Re-export types for use in frontend
export type { MediaAnalyzeRequest, AnalysisResult } from './schema';

const baseErrorSchema = z.object({
  message: z.string(),
  requestId: z.string().optional(),
  code: z.string().optional(),
});

export const errorSchemas = {
  validation: baseErrorSchema.extend({
    field: z.string().optional(),
  }),
  notFound: baseErrorSchema,
  internal: baseErrorSchema,
  unauthorized: baseErrorSchema,
};

export const api = {
  // Media Analysis (Gemini Proxy)
  media: {
    analyze: {
      method: 'POST' as const,
      path: '/api/media/analyze',
      input: mediaAnalyzeRequestSchema,
      responses: {
        200: analysisResultSchema,
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
        500: errorSchemas.internal
      }
    }
  },

  // User Stats
  stats: {
    get: {
      method: 'GET' as const,
      path: '/api/stats',
      responses: {
        200: z.custom<typeof userStats.$inferSelect>(),
        401: errorSchemas.unauthorized
      }
    },
    addXp: {
      method: 'POST' as const,
      path: '/api/stats/xp',
      input: z.object({ amount: z.number().int().positive() }),
      responses: {
        200: z.custom<typeof userStats.$inferSelect>(),
        401: errorSchemas.unauthorized
      }
    }
  },

  // History
  history: {
    list: {
      method: 'GET' as const,
      path: '/api/history',
      responses: {
        200: z.array(z.custom<typeof analysisHistory.$inferSelect>()),
        401: errorSchemas.unauthorized
      }
    },
    create: {
      method: 'POST' as const,
      path: '/api/history',
      input: insertAnalysisHistorySchema.omit({ userId: true }), // User ID from session
      responses: {
        201: z.custom<typeof analysisHistory.$inferSelect>(),
        401: errorSchemas.unauthorized
      }
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/history/:id',
      responses: {
        204: z.void(),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound
      }
    }
  },

  // Bookmarks
  bookmarks: {
    list: {
      method: 'GET' as const,
      path: '/api/bookmarks',
      responses: {
        200: z.array(z.custom<typeof bookmarks.$inferSelect>()),
        401: errorSchemas.unauthorized
      }
    },
    create: {
      method: 'POST' as const,
      path: '/api/bookmarks',
      input: insertBookmarkSchema.omit({ userId: true }), // User ID from session
      responses: {
        201: z.custom<typeof bookmarks.$inferSelect>(),
        401: errorSchemas.unauthorized
      }
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/bookmarks/:id',
      responses: {
        204: z.void(),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound
      }
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
