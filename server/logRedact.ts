// Best-effort secret redaction for logs.
// Goal: prevent accidental leakage of tokens, cookies, DB URLs, and large user blobs.

export function redactSecrets(input: unknown): string {
  let s = String(input ?? "");

  // Avoid dumping huge base64/audio blobs into logs (common for uploads/STT)
  s = s.replace(/\b([A-Za-z0-9+/=]{200,})\b/g, (m) => `[blob:${m.length}]`);

  // postgresql://user:pass@host -> mask pass
  s = s.replace(/(\b[a-zA-Z]+:\/\/[^\s\/:]+:)([^\s@]+)(@)/g, "$1****$3");

  // Authorization: Bearer xxx
  s = s.replace(/(Authorization:\s*Bearer\s+)([^\s]+)/gi, "$1****");

  // Cookie / Set-Cookie headers
  s = s.replace(/\b(cookie|set-cookie)\b\s*:\s*[^\r\n]+/gi, (m) => {
    const k = m.split(":")[0];
    return `${k}: ****`;
  });

  // Common API key env var leaks
  s = s.replace(/\b(AI_INTEGRATIONS_[A-Z0-9_]*API_KEY)\b\s*[:=]\s*([^\s,;]+)/g, "$1=****");

  // Generic token-ish strings
  s = s.replace(/\b([A-Za-z0-9_\-]{32,})\b/g, (m) => {
    const low = m.toLowerCase();
    // keep benign-ish ids
    if (low.includes("dummy")) return m;
    if (low.includes("resp_") || low.includes("sess") || low.includes("trace") || low.includes("req_")) return m;
    return m.slice(0, 6) + "…" + m.slice(-4);
  });

  return s;
}

export function safeLog(...args: any[]) {
  const out = args.map((a) => redactSecrets(a));
  // eslint-disable-next-line no-console
  console.log(...out);
}

export function safeError(...args: any[]) {
  const out = args.map((a) => redactSecrets(a));
  // eslint-disable-next-line no-console
  console.error(...out);
}
