export type CacheStats = {
  hits: number;
  misses: number;
  sets: number;
};

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export interface Cache {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T, ttlSeconds?: number): void;
  del(key: string): void;
  has(key: string): boolean;
  stats(): CacheStats;
}

function createInMemoryCache(): Cache {
  const store = new Map<string, CacheEntry<unknown>>();
  let hits = 0;
  let misses = 0;
  let sets = 0;

  function cleanStale() {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (entry.expiresAt <= now) store.delete(key);
    }
  }

  return {
    get<T>(key: string): T | null {
      cleanStale();
      const entry = store.get(key);
      if (!entry) { misses++; return null; }
      if (entry.expiresAt <= Date.now()) { store.delete(key); misses++; return null; }
      hits++;
      return entry.value as T;
    },

    set<T>(key: string, value: T, ttlSeconds = 3600): void {
      sets++;
      store.set(key, {
        value,
        expiresAt: Date.now() + ttlSeconds * 1000,
      });
    },

    del(key: string): void {
      store.delete(key);
    },

    has(key: string): boolean {
      cleanStale();
      return store.has(key);
    },

    stats(): CacheStats {
      return { hits, misses, sets };
    },
  };
}

// Singleton GitHub data cache instance
export const cache = createInMemoryCache();

// Singleton rendered image cache instance (separate stats, used by render.ts)
export const renderCache = createInMemoryCache();

export interface RenderedCacheEntry {
  svg: string;
  png?: Buffer;
}