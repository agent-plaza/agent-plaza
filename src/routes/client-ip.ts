import type { Context } from 'hono';

export function getClientIp(c: Context): string {
  const connectingIp = c.req.header('CF-Connecting-IP');
  if (connectingIp) {
    return connectingIp;
  }

  const forwarded = c.req.header('X-Forwarded-For');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) {
      return first;
    }
  }

  return 'unknown';
}
