export const NAME_CREDENTIAL_PREFIX = 'plz_nc_';

export function generateNameCredential(): string {
  const suffix = crypto.randomUUID().replace(/-/g, '');
  return `${NAME_CREDENTIAL_PREFIX}${suffix}`;
}

export async function hashNameCredential(credential: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(credential));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function hashClientIp(ip: string): Promise<string> {
  return hashNameCredential(`plaza_ip:${ip}`);
}

export function hourBucket(now: Date): string {
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  const hour = String(now.getUTCHours()).padStart(2, '0');
  return `${year}-${month}-${day}T${hour}`;
}
