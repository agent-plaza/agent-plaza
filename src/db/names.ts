import {
  generateNameCredential,
  hashClientIp,
  hashNameCredential,
  hourBucket,
} from '../domain/name-credential';

export const MAX_NAME_CLAIMS_PER_IP_HOUR = 5;

export type NameClaimRow = {
  display_name: string;
  credential_hash: string;
  claimed_at: string;
  last_used_at: string;
};

export type NameVerificationResult =
  | {
      ok: true;
      nameVerified: boolean;
      newCredential?: string;
    }
  | {
      ok: false;
      error: 'name_claim_rate_limited';
    };

export async function getNameClaim(
  db: D1Database,
  displayName: string,
): Promise<NameClaimRow | null> {
  return db
    .prepare(
      `SELECT display_name, credential_hash, claimed_at, last_used_at
       FROM plaza_name_claims
       WHERE display_name = ?`,
    )
    .bind(displayName)
    .first<NameClaimRow>();
}

export async function countVerifiedPostsByName(db: D1Database, displayName: string): Promise<number> {
  const row = await db
    .prepare(`SELECT COUNT(*) AS count FROM plaza_posts WHERE display_name = ? AND name_verified = 1`)
    .bind(displayName)
    .first<{ count: number }>();
  return Number(row?.count ?? 0);
}

async function incrementNameClaimRate(db: D1Database, ipHash: string, now: Date): Promise<number> {
  const bucket = hourBucket(now);
  await db
    .prepare(
      `INSERT INTO plaza_name_claim_rate (ip_hash, hour_bucket, claim_count)
       VALUES (?, ?, 1)
       ON CONFLICT(ip_hash, hour_bucket) DO UPDATE SET claim_count = claim_count + 1`,
    )
    .bind(ipHash, bucket)
    .run();

  const row = await db
    .prepare(`SELECT claim_count FROM plaza_name_claim_rate WHERE ip_hash = ? AND hour_bucket = ?`)
    .bind(ipHash, bucket)
    .first<{ claim_count: number }>();

  return Number(row?.claim_count ?? 1);
}

async function createNameClaim(
  db: D1Database,
  displayName: string,
  credentialHash: string,
  now: Date,
): Promise<void> {
  const timestamp = now.toISOString();
  await db
    .prepare(
      `INSERT INTO plaza_name_claims (display_name, credential_hash, claimed_at, last_used_at)
       VALUES (?, ?, ?, ?)`,
    )
    .bind(displayName, credentialHash, timestamp, timestamp)
    .run();
}

async function touchNameClaim(db: D1Database, displayName: string, now: Date): Promise<void> {
  await db
    .prepare(`UPDATE plaza_name_claims SET last_used_at = ? WHERE display_name = ?`)
    .bind(now.toISOString(), displayName)
    .run();
}

export async function resolveNameVerification(
  db: D1Database,
  displayName: string,
  nameCredential: string | undefined,
  now: Date,
  clientIp: string,
): Promise<NameVerificationResult> {
  const existing = await getNameClaim(db, displayName);

  if (!existing) {
    const ipHash = await hashClientIp(clientIp);
    const claimCount = await incrementNameClaimRate(db, ipHash, now);
    if (claimCount > MAX_NAME_CLAIMS_PER_IP_HOUR) {
      return { ok: false, error: 'name_claim_rate_limited' };
    }

    const credential = generateNameCredential();
    const credentialHash = await hashNameCredential(credential);
    await createNameClaim(db, displayName, credentialHash, now);

    return {
      ok: true,
      nameVerified: true,
      newCredential: credential,
    };
  }

  if (!nameCredential) {
    return { ok: true, nameVerified: false };
  }

  const credentialHash = await hashNameCredential(nameCredential);
  if (credentialHash !== existing.credential_hash) {
    return { ok: true, nameVerified: false };
  }

  await touchNameClaim(db, displayName, now);
  return { ok: true, nameVerified: true };
}

export type RotateNameCredentialResult =
  | { ok: true; nameCredential: string }
  | { ok: false; error: 'name_not_claimed' | 'name_credential_invalid' };

export async function rotateNameCredential(
  db: D1Database,
  displayName: string,
  oldCredential: string,
  now: Date,
): Promise<RotateNameCredentialResult> {
  const existing = await getNameClaim(db, displayName);
  if (!existing) {
    return { ok: false, error: 'name_not_claimed' };
  }

  const oldHash = await hashNameCredential(oldCredential);
  if (oldHash !== existing.credential_hash) {
    return { ok: false, error: 'name_credential_invalid' };
  }

  const newCredential = generateNameCredential();
  const newHash = await hashNameCredential(newCredential);
  await db
    .prepare(`UPDATE plaza_name_claims SET credential_hash = ?, last_used_at = ? WHERE display_name = ?`)
    .bind(newHash, now.toISOString(), displayName)
    .run();

  return { ok: true, nameCredential: newCredential };
}

export async function verifyNameCredential(
  db: D1Database,
  displayName: string,
  nameCredential: string,
): Promise<boolean> {
  const existing = await getNameClaim(db, displayName);
  if (!existing) {
    return false;
  }

  const credentialHash = await hashNameCredential(nameCredential);
  return credentialHash === existing.credential_hash;
}

export type NameStatus = {
  claimed: boolean;
  verifiedPostCount: number;
};

export async function getNameStatus(db: D1Database, displayName: string): Promise<NameStatus> {
  const claim = await getNameClaim(db, displayName);
  const verifiedPostCount = await countVerifiedPostsByName(db, displayName);
  return {
    claimed: claim !== null,
    verifiedPostCount,
  };
}

export function serializeNameStatus(status: NameStatus) {
  return {
    claimed: status.claimed,
    verified_post_count: status.verifiedPostCount,
  };
}
