type CacheEntry = {
  status: number;
  body: unknown;
  expiresAt: number;
};

// In-memory idempotency cache.
// NOTE: good enough for single-node dev/prod; for multi-node use Redis.
const cache = new Map<string, CacheEntry>();

const DEFAULT_TTL_MS = 10 * 60 * 1000; // 10 minutes

function now() {
  return Date.now();
}

function sweep() {
  const t = now();
  cache.forEach((v, k) => {
    if (v.expiresAt <= t) cache.delete(k);
  });
}

export function makeIdempotencyKey(params: {
  userId?: string;
  route: string;
  key?: string | null;
}) {
  const k = (params.key || "").trim();
  if (!k) return null;
  const user = params.userId || "anonymous";
  return `${user}::${params.route}::${k}`;
}

export function getIdempotentResponse(fullKey: string) {
  sweep();
  const hit = cache.get(fullKey);
  if (!hit) return null;
  if (hit.expiresAt <= now()) {
    cache.delete(fullKey);
    return null;
  }
  return { status: hit.status, body: hit.body };
}

export function setIdempotentResponse(fullKey: string, status: number, body: unknown, ttlMs = DEFAULT_TTL_MS) {
  sweep();
  cache.set(fullKey, {
    status,
    body,
    expiresAt: now() + ttlMs,
  });
}
