import 'server-only';
import { createHash } from 'node:crypto';

type Options = { limit: number; windowMs: number; prefix: string };

// Production never falls back to an instance-local counter or an unlimited path.
export function createDatabaseRateLimitGuard({ limit, windowMs, prefix }: Options) {
  return async (identifier: string): Promise<'allowed' | 'denied' | 'unavailable'> => {
    const origin = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    if (!origin || !key) return 'unavailable';
    try {
      const url = new URL('/rest/v1/rpc/consume_api_rate_limit', origin);
      if (url.protocol !== 'https:' || url.username || url.password) return 'unavailable';
      const response = await fetch(url.toString(), {
        method: 'POST', cache: 'no-store', signal: AbortSignal.timeout(5000),
        headers: { 'Content-Type': 'application/json', apikey: key, Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          p_namespace: prefix,
          p_key: createHash('sha256').update(`${prefix}:${identifier}`).digest('hex'),
          p_limit: limit, p_window_ms: windowMs,
        }),
      });
      if (!response.ok) return 'unavailable';
      const allowed: unknown = await response.json();
      return allowed === true ? 'allowed' : allowed === false ? 'denied' : 'unavailable';
    } catch { return 'unavailable'; }
  };
}
