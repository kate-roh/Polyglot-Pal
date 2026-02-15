// Best-effort secret redaction for logs.
// Goal: prevent accidental leakage of DB URLs, bearer tokens, and long secrets.

export function redactSecrets(input: unknown): string {
  let s = String(input ?? "");

  // postgresql://user:pass@host -> mask pass
  s = s.replace(/(\b[a-zA-Z]+:\/\/[^\s/:]+:)([^\s@]+)(@)/g, "$1****$3");

  // Authorization: Bearer xxx
  s = s.replace(/(Authorization:\s*Bearer\s+)([^\s]+)/gi, "$1****");

  // Generic token-ish strings
  s = s.replace(/\b([A-Za-z0-9_\-]{32,})\b/g, (m) => {
    const low = m.toLowerCase();
    if (low.includes("dummy")) return m;
    if (low.includes("resp_") || low.includes("sess")) return m; // keep ids
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
