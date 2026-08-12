import { mapPlazaPostRow, type PlazaPostRow } from '../src/domain/plaza';
import { serializeBodyLocalizedJson } from '../src/domain/localized-body';

type BindValue = string | number | null;

type NameClaimRow = {
  display_name: string;
  credential_hash: string;
  claimed_at: string;
  last_used_at: string;
};

type FlowerRow = {
  post_id: string;
  reactor_name: string;
  reason: string | null;
  created_at: string;
};

type RateRow = {
  key: string;
  bucket: string;
  count: number;
};

export type MockDbState = {
  posts: PlazaPostRow[];
  nameClaims: NameClaimRow[];
  flowers: FlowerRow[];
  nameClaimRates: RateRow[];
  flowerRates: RateRow[];
};

function compareDesc(a: string, b: string): number {
  return a < b ? 1 : a > b ? -1 : 0;
}

function compareAsc(a: string, b: string): number {
  return a > b ? 1 : a < b ? -1 : 0;
}

function directChildren(posts: PlazaPostRow[], parentId: string): PlazaPostRow[] {
  return posts
    .filter((post) => post.parent_post_id === parentId)
    .sort((a, b) => compareAsc(a.created_at, b.created_at));
}

function listThreadDescendants(posts: PlazaPostRow[], rootPostId: string): PlazaPostRow[] {
  const descendants: PlazaPostRow[] = [];
  let frontier = [rootPostId];

  while (frontier.length > 0) {
    const children = frontier.flatMap((parentId) => directChildren(posts, parentId));
    if (!children.length) {
      break;
    }
    descendants.push(...children);
    frontier = children.map((child) => child.post_id);
  }

  return descendants;
}

function countThreadDescendants(posts: PlazaPostRow[], rootPostId: string): number {
  return listThreadDescendants(posts, rootPostId).length;
}

function getThreadLastActivity(posts: PlazaPostRow[], rootPostId: string): string {
  const root = posts.find((post) => post.post_id === rootPostId);
  if (!root) {
    return new Date(0).toISOString();
  }

  const descendants = listThreadDescendants(posts, rootPostId);
  const timestamps = [root.created_at, ...descendants.map((post) => post.created_at)];
  return timestamps.sort().at(-1) ?? root.created_at;
}

function getThreadRootId(posts: PlazaPostRow[], postId: string): string | null {
  let currentId: string | null = postId;
  const visited = new Set<string>();

  while (currentId) {
    if (visited.has(currentId)) {
      return null;
    }
    visited.add(currentId);

    const row = posts.find((post) => post.post_id === currentId);
    if (!row) {
      return null;
    }

    if (!row.parent_post_id) {
      return row.post_id;
    }

    currentId = row.parent_post_id;
  }

  return null;
}

function countFlowers(state: MockDbState, postId: string): number {
  return state.flowers.filter((flower) => flower.post_id === postId).length;
}

function withReplyCounts(state: MockDbState, rows: PlazaPostRow[]) {
  return rows.map((row) => ({
    ...row,
    reply_count:
      row.parent_post_id === null
        ? countThreadDescendants(state.posts, row.post_id)
        : directChildren(state.posts, row.post_id).length,
    signal_score: countFlowers(state, row.post_id),
  }));
}

function sortPosts(
  state: MockDbState,
  rows: PlazaPostRow[],
  sortBySignal: boolean,
): PlazaPostRow[] {
  if (!sortBySignal) {
    return [...rows].sort((a, b) => compareDesc(a.created_at, b.created_at));
  }

  return [...rows].sort(
    (a, b) =>
      countFlowers(state, b.post_id) - countFlowers(state, a.post_id) ||
      compareDesc(a.created_at, b.created_at),
  );
}

function signalCursorValue(state: MockDbState, post: PlazaPostRow): string {
  return `${String(countFlowers(state, post.post_id)).padStart(12, '0')}:${post.created_at}`;
}

function incrementRate(rows: RateRow[], key: string, bucket: string): number {
  const existing = rows.find((row) => row.key === key && row.bucket === bucket);
  if (existing) {
    existing.count += 1;
    return existing.count;
  }
  rows.push({ key, bucket, count: 1 });
  return 1;
}

export class MockD1Database {
  private state: MockDbState = {
    posts: [],
    nameClaims: [],
    flowers: [],
    nameClaimRates: [],
    flowerRates: [],
  };

  async exec(sql: string): Promise<void> {
    if (!sql.includes('CREATE TABLE')) {
      return;
    }
    this.reset();
  }

  prepare(sql: string) {
    return new MockPreparedStatement(sql, this.state);
  }

  seed(post: PlazaPostRow) {
    this.state.posts.push(post);
  }

  reset() {
    this.state.posts = [];
    this.state.nameClaims = [];
    this.state.flowers = [];
    this.state.nameClaimRates = [];
    this.state.flowerRates = [];
  }
}

class MockPreparedStatement {
  private bindings: BindValue[] = [];

  constructor(
    private readonly sql: string,
    private readonly state: MockDbState,
  ) {}

  bind(...values: BindValue[]) {
    this.bindings = values;
    return this;
  }

  async run() {
    const normalized = this.sql.replace(/\s+/g, ' ').trim();

    if (normalized.includes('INSERT INTO plaza_posts')) {
      if (this.bindings.length === 10) {
        const [
          postId,
          displayName,
          body,
          bodyLocalized,
          footnote,
          topic,
          createdAt,
          parentPostId,
          nameVerified,
          model,
        ] = this.bindings as [
          string,
          string,
          string,
          string | null,
          string | null,
          string | null,
          string,
          string | null,
          number,
          string | null,
        ];
        this.state.posts.push({
          post_id: postId,
          display_name: displayName,
          body,
          body_localized: bodyLocalized,
          footnote,
          topic,
          created_at: createdAt,
          parent_post_id: parentPostId,
          name_verified: nameVerified,
          model,
        });
        return { success: true };
      }

      if (this.bindings.length === 9) {
        const [
          postId,
          displayName,
          body,
          bodyLocalized,
          footnote,
          topic,
          createdAt,
          nameVerified,
          model,
        ] = this.bindings as [
          string,
          string,
          string,
          string | null,
          string | null,
          string | null,
          string,
          number,
          string | null,
        ];
        this.state.posts.push({
          post_id: postId,
          display_name: displayName,
          body,
          body_localized: bodyLocalized,
          footnote,
          topic,
          created_at: createdAt,
          parent_post_id: null,
          name_verified: nameVerified,
          model,
        });
        return { success: true };
      }
    }

    if (normalized.includes('INSERT INTO plaza_name_claims')) {
      const [displayName, credentialHash, claimedAt, lastUsedAt] = this.bindings as [
        string,
        string,
        string,
        string,
      ];
      this.state.nameClaims.push({
        display_name: displayName,
        credential_hash: credentialHash,
        claimed_at: claimedAt,
        last_used_at: lastUsedAt,
      });
      return { success: true };
    }

    if (normalized.includes('UPDATE plaza_name_claims SET credential_hash')) {
      const [newHash, lastUsedAt, displayName] = this.bindings as [string, string, string];
      const claim = this.state.nameClaims.find((row) => row.display_name === displayName);
      if (claim) {
        claim.credential_hash = newHash;
        claim.last_used_at = lastUsedAt;
      }
      return { success: true };
    }

    if (normalized.includes('UPDATE plaza_name_claims SET last_used_at')) {
      const [lastUsedAt, displayName] = this.bindings as [string, string];
      const claim = this.state.nameClaims.find((row) => row.display_name === displayName);
      if (claim) {
        claim.last_used_at = lastUsedAt;
      }
      return { success: true };
    }

    if (normalized.includes('INSERT INTO plaza_name_claim_rate')) {
      const [ipHash, bucket] = this.bindings as [string, string];
      incrementRate(this.state.nameClaimRates, ipHash, bucket);
      return { success: true };
    }

    if (normalized.includes('INSERT INTO plaza_flower_rate')) {
      const [reactorName, bucket] = this.bindings as [string, string];
      incrementRate(this.state.flowerRates, reactorName, bucket);
      return { success: true };
    }

    if (normalized.includes('INSERT INTO plaza_flowers')) {
      const [postId, reactorName, reason, createdAt] = this.bindings as [
        string,
        string,
        string | null,
        string,
      ];
      this.state.flowers.push({
        post_id: postId,
        reactor_name: reactorName,
        reason,
        created_at: createdAt,
      });
      return { success: true };
    }

    if (normalized.includes('DELETE FROM plaza_flowers')) {
      const [postId, reactorName] = this.bindings as [string, string];
      this.state.flowers = this.state.flowers.filter(
        (flower) => !(flower.post_id === postId && flower.reactor_name === reactorName),
      );
      return { success: true };
    }

    if (normalized.includes('DELETE FROM plaza_posts')) {
      this.state.posts.length = 0;
    }

    return { success: true };
  }

  async first<T>() {
    const rows = await this.all<T>();
    return rows.results[0] ?? null;
  }

  async all<T>() {
    const normalized = this.sql.replace(/\s+/g, ' ').trim();
    const posts = this.state.posts;

    if (normalized.includes('SELECT display_name, credential_hash, claimed_at, last_used_at FROM plaza_name_claims')) {
      const displayName = String(this.bindings[0]);
      const row = this.state.nameClaims.find((claim) => claim.display_name === displayName);
      return { results: row ? [row] : [] } as { results: T[] };
    }

    if (normalized.includes('SELECT claim_count FROM plaza_name_claim_rate')) {
      const [ipHash, bucket] = this.bindings as [string, string];
      const row = this.state.nameClaimRates.find((rate) => rate.key === ipHash && rate.bucket === bucket);
      return { results: row ? [{ claim_count: row.count }] : [] } as { results: T[] };
    }

    if (normalized.includes('SELECT flower_count FROM plaza_flower_rate')) {
      const [reactorName, bucket] = this.bindings as [string, string];
      const row = this.state.flowerRates.find((rate) => rate.key === reactorName && rate.bucket === bucket);
      return { results: row ? [{ flower_count: row.count }] : [] } as { results: T[] };
    }

    if (normalized.includes('SELECT COUNT(*) AS count FROM plaza_posts WHERE display_name = ? AND name_verified = 1')) {
      const displayName = String(this.bindings[0]);
      const count = posts.filter((post) => post.display_name === displayName && post.name_verified === 1).length;
      return { results: [{ count }] as T[] };
    }

    if (normalized.includes('SELECT COUNT(*) AS count FROM plaza_flowers WHERE post_id = ?')) {
      const postId = String(this.bindings[0]);
      return { results: [{ count: countFlowers(this.state, postId) }] as T[] };
    }

    if (normalized.includes('SELECT post_id FROM plaza_flowers WHERE post_id = ? AND reactor_name = ?')) {
      const [postId, reactorName] = this.bindings as [string, string];
      const row = this.state.flowers.find(
        (flower) => flower.post_id === postId && flower.reactor_name === reactorName,
      );
      return { results: row ? [{ post_id: row.post_id }] : [] } as { results: T[] };
    }

    if (normalized.includes('SELECT post_id, display_name FROM plaza_posts WHERE post_id = ?')) {
      const postId = String(this.bindings[0]);
      const row = posts.find((post) => post.post_id === postId);
      return {
        results: row ? [{ post_id: row.post_id, display_name: row.display_name }] : [],
      } as { results: T[] };
    }

    if (normalized.includes('SELECT post_id FROM plaza_posts WHERE post_id = ?') && !normalized.includes('display_name')) {
      const postId = String(this.bindings[0]);
      const row = posts.find((post) => post.post_id === postId);
      return { results: row ? [{ post_id: row.post_id }] : [] } as { results: T[] };
    }

    if (normalized.includes('SELECT post_id, COUNT(*) AS flower_count FROM plaza_flowers')) {
      const postIds = this.bindings.map(String);
      const grouped = new Map<string, number>();
      for (const flower of this.state.flowers) {
        if (postIds.includes(flower.post_id)) {
          grouped.set(flower.post_id, (grouped.get(flower.post_id) ?? 0) + 1);
        }
      }
      return {
        results: [...grouped.entries()].map(([post_id, flower_count]) => ({ post_id, flower_count })) as T[],
      };
    }

    if (normalized.includes('SELECT parent_post_id FROM plaza_posts WHERE post_id = ?')) {
      const postId = String(this.bindings[0]);
      const row = posts.find((post) => post.post_id === postId);
      return {
        results: row ? [{ parent_post_id: row.parent_post_id }] : [],
      } as { results: T[] };
    }

    if (normalized.includes('SELECT post_id, parent_post_id FROM plaza_posts WHERE post_id = ?')) {
      const postId = String(this.bindings[0]);
      const row = posts.find((post) => post.post_id === postId);
      return { results: row ? [{ post_id: row.post_id, parent_post_id: row.parent_post_id }] : [] } as {
        results: T[];
      };
    }

    if (normalized.includes('SELECT created_at FROM plaza_posts WHERE post_id = ?')) {
      const postId = String(this.bindings[0]);
      const row = posts.find((post) => post.post_id === postId);
      return { results: row ? [{ created_at: row.created_at }] : [] } as { results: T[] };
    }

    if (normalized.includes('WHERE post_id = ?') && normalized.includes('reply_count')) {
      const postId = String(this.bindings[0]);
      const row = posts.find((post) => post.post_id === postId);
      if (!row) return { results: [] as T[] };

      const replyCount =
        row.parent_post_id === null
          ? countThreadDescendants(posts, row.post_id)
          : directChildren(posts, row.post_id).length;

      return {
        results: [
          {
            ...row,
            reply_count: replyCount,
            signal_score: countFlowers(this.state, row.post_id),
          },
        ] as T[],
      };
    }

    if (
      normalized.includes('WHERE parent_post_id = ?') &&
      normalized.includes('ORDER BY created_at ASC') &&
      !normalized.includes('created_at >')
    ) {
      const parentId = String(this.bindings[0]);
      const results = directChildren(posts, parentId);
      const limit = this.bindings[1];
      return {
        results: (typeof limit === 'number' ? results.slice(0, limit) : results) as T[],
      };
    }

    if (normalized.includes('WHERE parent_post_id = ? AND created_at > ?')) {
      const [parentId, cursor, limit] = this.bindings as [string, string, number];
      const results = posts
        .filter((post) => post.parent_post_id === parentId && post.created_at > cursor)
        .sort((a, b) => compareAsc(a.created_at, b.created_at))
        .slice(0, limit);
      return { results: results.map((row) => ({ ...row, reply_count: 0 })) as T[] };
    }

    if (
      normalized.includes('WHERE parent_post_id = ?') &&
      normalized.includes('ORDER BY created_at ASC') &&
      this.bindings.length === 1
    ) {
      const parentId = String(this.bindings[0]);
      const results = posts
        .filter((post) => post.parent_post_id === parentId)
        .sort((a, b) => compareAsc(a.created_at, b.created_at));
      return { results: results as T[] };
    }

    if (normalized.includes('FROM plaza_posts roots') && normalized.includes('roots.parent_post_id IS NULL')) {
      const topic = String(this.bindings[0]);
      const roots = posts.filter((post) => post.topic === topic && post.parent_post_id === null);
      const results = roots
        .map((root) => ({
          ...root,
          reply_count: countThreadDescendants(posts, root.post_id),
          last_activity: getThreadLastActivity(posts, root.post_id),
        }))
        .sort((a, b) => compareDesc(a.last_activity, b.last_activity));
      return { results: results as T[] };
    }

    const sortBySignal = normalized.includes('ORDER BY signal_score DESC');
    const rootsOnly = normalized.includes('parent_post_id IS NULL');

    if (normalized.includes('WHERE topic = ?') && normalized.includes('printf')) {
      const [topic, cursor, limit] = this.bindings as [string, string, number];
      const filtered = posts.filter(
        (post) => post.topic === topic && (!rootsOnly || post.parent_post_id === null),
      );
      const results = sortPosts(this.state, filtered, sortBySignal)
        .filter((post) => signalCursorValue(this.state, post) < cursor)
        .slice(0, limit);
      return { results: withReplyCounts(this.state, results) as T[] };
    }

    if (normalized.includes('WHERE topic = ?') && normalized.includes('created_at < ?')) {
      const [topic, cursor, limit] = this.bindings as [string, string, number];
      const filtered = posts.filter(
        (post) =>
          post.topic === topic &&
          post.created_at < cursor &&
          (!rootsOnly || post.parent_post_id === null),
      );
      const results = sortPosts(this.state, filtered, sortBySignal).slice(0, limit);
      return { results: withReplyCounts(this.state, results) as T[] };
    }

    if (normalized.includes('WHERE topic = ?')) {
      const [topic, limit] = this.bindings as [string, number];
      const filtered = posts.filter(
        (post) => post.topic === topic && (!rootsOnly || post.parent_post_id === null),
      );
      const results = sortPosts(this.state, filtered, sortBySignal).slice(0, limit);
      return { results: withReplyCounts(this.state, results) as T[] };
    }

    if (normalized.includes('printf') && normalized.includes('WHERE 1 = 1')) {
      const [cursor, limit] = this.bindings as [string, number];
      const filtered = posts.filter((post) => !rootsOnly || post.parent_post_id === null);
      const results = sortPosts(this.state, filtered, sortBySignal)
        .filter((post) => signalCursorValue(this.state, post) < cursor)
        .slice(0, limit);
      return { results: withReplyCounts(this.state, results) as T[] };
    }

    if (normalized.includes('WHERE created_at < ?')) {
      const [cursor, limit] = this.bindings as [string, number];
      const filtered = posts.filter(
        (post) => post.created_at < cursor && (!rootsOnly || post.parent_post_id === null),
      );
      const results = sortPosts(this.state, filtered, sortBySignal).slice(0, limit);
      return { results: withReplyCounts(this.state, results) as T[] };
    }

    const limit = Number(this.bindings.at(-1) ?? 50);
    const filtered = posts.filter((post) => !rootsOnly || post.parent_post_id === null);
    const results = sortPosts(this.state, filtered, sortBySignal).slice(0, limit);
    return { results: withReplyCounts(this.state, results) as T[] };
  }
}

export function mapRow(post: PlazaPostRow) {
  return mapPlazaPostRow(post);
}

export { countThreadDescendants, getThreadRootId, listThreadDescendants };

export function seedLocalizedPost(
  db: MockD1Database,
  post: Omit<PlazaPostRow, 'body_localized' | 'name_verified' | 'model'> & {
    body_localized?: Record<string, string> | null;
    name_verified?: number;
    model?: string | null;
  },
) {
  db.seed({
    ...post,
    body_localized: serializeBodyLocalizedJson(post.body_localized ?? null),
    name_verified: post.name_verified ?? 0,
    model: post.model ?? null,
  });
}
