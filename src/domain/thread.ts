import type { PlazaPost } from './plaza';

export type ThreadPostMeta = {
  rootPostId: string;
  depth: number;
  directReplyCount: number;
};

export type FlatThreadPost = PlazaPost & ThreadPostMeta;

export type ThreadPostNode = PlazaPost & ThreadPostMeta & {
  children: ThreadPostNode[];
};

export function resolveRootPostId(
  postId: string,
  postsById: ReadonlyMap<string, Pick<PlazaPost, 'postId' | 'parentPostId'>>,
): string {
  let currentId = postId;
  const visited = new Set<string>();

  while (true) {
    if (visited.has(currentId)) {
      return postId;
    }
    visited.add(currentId);

    const current = postsById.get(currentId);
    if (!current?.parentPostId) {
      return currentId;
    }
    currentId = current.parentPostId;
  }
}

export function computeDepth(
  postId: string,
  postsById: ReadonlyMap<string, Pick<PlazaPost, 'postId' | 'parentPostId'>>,
): number {
  let depth = 0;
  let currentId: string | null = postId;
  const visited = new Set<string>();

  while (currentId) {
    const current = postsById.get(currentId);
    if (!current?.parentPostId) {
      return depth;
    }
    if (visited.has(currentId)) {
      return depth;
    }
    visited.add(currentId);
    depth += 1;
    currentId = current.parentPostId;
  }

  return depth;
}

export function countDirectChildren(
  postId: string,
  posts: readonly Pick<PlazaPost, 'parentPostId'>[],
): number {
  return posts.filter((post) => post.parentPostId === postId).length;
}

export function enrichThreadPosts(
  rootPostId: string,
  posts: PlazaPost[],
): FlatThreadPost[] {
  const postsById = new Map(posts.map((post) => [post.postId, post]));

  return posts.map((post) => ({
    ...post,
    rootPostId,
    depth: computeDepth(post.postId, postsById),
    directReplyCount: countDirectChildren(post.postId, posts),
    replyCount: countDirectChildren(post.postId, posts),
  }));
}

export function buildThreadTree(
  rootPostId: string,
  posts: FlatThreadPost[],
): ThreadPostNode[] {
  const nodes = new Map<string, ThreadPostNode>(
    posts.map((post) => [post.postId, { ...post, children: [] }]),
  );

  const roots: ThreadPostNode[] = [];

  for (const post of posts) {
    const node = nodes.get(post.postId);
    if (!node) continue;

    if (post.parentPostId && nodes.has(post.parentPostId)) {
      nodes.get(post.parentPostId)?.children.push(node);
      continue;
    }

    if (post.parentPostId === rootPostId || post.parentPostId === null) {
      roots.push(node);
    }
  }

  const sortByCreatedAt = (a: ThreadPostNode, b: ThreadPostNode) =>
    a.createdAt.localeCompare(b.createdAt);

  const sortTree = (items: ThreadPostNode[]) => {
    items.sort(sortByCreatedAt);
    for (const item of items) {
      sortTree(item.children);
    }
  };

  sortTree(roots);
  return roots;
}

export function flattenThreadTree(nodes: readonly ThreadPostNode[]): ThreadPostNode[] {
  const items: ThreadPostNode[] = [];

  const walk = (node: ThreadPostNode) => {
    items.push(node);
    for (const child of node.children) {
      walk(child);
    }
  };

  for (const node of nodes) {
    walk(node);
  }

  return items;
}
