import 'server-only';

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export class RequestBodyError extends Error {
  constructor(
    message: string,
    readonly status: 400 | 413,
  ) {
    super(message);
    this.name = 'RequestBodyError';
  }
}

export async function readJsonBody(request: Request, maxBytes: number): Promise<unknown> {
  const contentLength = request.headers.get('content-length');
  if (contentLength) {
    const parsedLength = Number(contentLength);
    if (!Number.isFinite(parsedLength) || parsedLength < 0) {
      throw new RequestBodyError('Tamanho de requisição inválido.', 400);
    }
    if (parsedLength > maxBytes) {
      throw new RequestBodyError('A requisição excede o tamanho permitido.', 413);
    }
  }

  if (!request.body) {
    throw new RequestBodyError('O corpo da requisição está vazio.', 400);
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;

    totalBytes += value.byteLength;
    if (totalBytes > maxBytes) {
      await reader.cancel('Payload too large');
      throw new RequestBodyError('A requisição excede o tamanho permitido.', 413);
    }
    chunks.push(value);
  }

  const body = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    const decodedBody = new TextDecoder('utf-8', { fatal: true }).decode(body);
    return JSON.parse(decodedBody) as unknown;
  } catch {
    throw new RequestBodyError('O JSON enviado é inválido.', 400);
  }
}

export type RateLimitDecision = 'allowed' | 'denied' | 'unavailable';

type RateLimiterOptions = {
  limit: number;
  window: `${number} ${'s' | 'm' | 'h' | 'd'}`;
  prefix: string;
};

export function createRateLimitGuard({ limit, window, prefix }: RateLimiterOptions) {
  const localRecords = new Map<string, { count: number; resetAt: number }>();
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  const windowMs = parseWindow(window);
  const distributed = redisUrl && redisToken
    ? new Ratelimit({
        redis: new Redis({ url: redisUrl, token: redisToken }),
        limiter: Ratelimit.slidingWindow(limit, window),
        analytics: true,
        prefix,
      })
    : null;

  return async (identifier: string): Promise<RateLimitDecision> => {
    if (distributed) {
      try {
        const result = await distributed.limit(identifier);
        return result.success ? 'allowed' : 'denied';
      } catch (error) {
        console.error(`Falha no rate limit distribuído (${prefix}):`, getErrorMessage(error));
        if (process.env.NODE_ENV === 'production') return 'unavailable';
      }
    } else if (process.env.NODE_ENV === 'production') {
      console.error(`Rate limit distribuído não configurado em produção (${prefix}).`);
      return 'unavailable';
    }

    const now = Date.now();
    const record = localRecords.get(identifier);
    if (!record || now >= record.resetAt) {
      localRecords.set(identifier, { count: 1, resetAt: now + windowMs });
      return 'allowed';
    }
    if (record.count >= limit) return 'denied';
    record.count += 1;
    return 'allowed';
  };
}

export function getClientIp(request: Request) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')?.trim()
    || 'ip-desconhecido';
}

function parseWindow(window: RateLimiterOptions['window']) {
  const [amountText, unit] = window.split(' ');
  const amount = Number(amountText);
  const multipliers = { s: 1_000, m: 60_000, h: 3_600_000, d: 86_400_000 } as const;
  return amount * multipliers[unit as keyof typeof multipliers];
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
