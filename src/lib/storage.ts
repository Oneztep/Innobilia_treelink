/**
 * Versioned, in-memory-cached localStorage helper.
 *
 * Implements two Vercel React best practices:
 * - `js-cache-storage`: Cache localStorage/sessionStorage reads in memory
 *   to avoid repeated serialization/deserialization on every access.
 * - `client-localstorage-schema`: Version and minimize localStorage data
 *   to safely migrate between schema versions.
 *
 * `advanced-init-once`: migrateSchema() is called once at module load time,
 * NOT inside a component, so it runs exactly once per app lifetime regardless
 * of React's Strict Mode double-invocation behavior.
 */

const SCHEMA_VERSION = 1;
const VERSION_KEY = 'innobilia_schema_version';

// In-memory cache: avoids repeated JSON.parse on every read (js-cache-storage)
const memCache = new Map<string, unknown>();

/** Read from localStorage with in-memory caching */
export function lsGet<T>(key: string): T | null {
  // Return cached value if present (js-cache-storage)
  if (memCache.has(key)) {
    return memCache.get(key) as T;
  }
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return null;
    const value = JSON.parse(raw) as T;
    memCache.set(key, value);
    return value;
  } catch {
    return null;
  }
}

/** Write to localStorage and update in-memory cache */
export function lsSet<T>(key: string, value: T): void {
  try {
    const serialized = JSON.stringify(value);
    localStorage.setItem(key, serialized);
    memCache.set(key, value);
  } catch {
    // localStorage may be full or unavailable (private mode)
    console.warn(`[innobilia] Failed to persist ${key} to localStorage`);
  }
}

/** Remove from localStorage and cache */
export function lsRemove(key: string): void {
  localStorage.removeItem(key);
  memCache.delete(key);
}

/** Invalidate in-memory cache for a key (force re-read from storage) */
export function lsInvalidate(key: string): void {
  memCache.delete(key);
}

/**
 * Run schema migration — called ONCE at module level (advanced-init-once).
 * Clears old incompatible data when the schema version changes.
 * (client-localstorage-schema)
 */
function runMigration(): void {
  try {
    const storedVersion = Number(localStorage.getItem(VERSION_KEY) ?? '0');
    if (storedVersion < SCHEMA_VERSION) {
      // Clear all innobilia_ keys on schema version bump
      const toDelete: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k?.startsWith('innobilia_')) {
          toDelete.push(k!);
        }
      }
      toDelete.forEach(k => {
        localStorage.removeItem(k);
        memCache.delete(k);
      });
      localStorage.setItem(VERSION_KEY, String(SCHEMA_VERSION));
    }
  } catch {
    // Ignore migration errors in restricted environments (SSR, private mode)
  }
}

// advanced-init-once: execute once when module is first imported,
// before any component mounts. React Strict Mode won't double-run this.
runMigration();
