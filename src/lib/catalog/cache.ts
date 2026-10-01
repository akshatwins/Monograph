type Entry<T> = { value: T; expires: number };

const store = new Map<string, Entry<unknown>>();

export function cacheGet<T>(key: string): T | undefined {
  const hit = store.get(key);
  if (!hit) return undefined;
  if (Date.now() > hit.expires) {
    store.delete(key);
    return undefined;
  }
  return hit.value as T;
}

export function cacheSet<T>(key: string, value: T, ttlMs: number): T {
  store.set(key, { value, expires: Date.now() + ttlMs });
  if (store.size > 400) {
    const now = Date.now();
    for (const [k, v] of store) {
      if (now > v.expires) store.delete(k);
    }
  }
  return value;
}

export async function cacheGetOrSet<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>,
): Promise<T> {
  const hit = cacheGet<T>(key);
  if (hit !== undefined) return hit;
  const value = await loader();
  return cacheSet(key, value, ttlMs);
}
