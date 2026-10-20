const memoryStorage = new Map<string, string>();

/** Small cross-platform storage adapter. Web uses localStorage; native keeps a
 * session-scoped fallback so shared React Native screens never depend on DOM globals. */
export const appStorage = {
  getItem(key: string): string | null {
    try {
      const storage = globalThis.localStorage;
      if (storage) return storage.getItem(key);
    } catch {
      // Fall through to the in-memory store when browser storage is unavailable.
    }
    return memoryStorage.get(key) ?? null;
  },
  setItem(key: string, value: string): void {
    try {
      const storage = globalThis.localStorage;
      if (storage) {
        storage.setItem(key, value);
        return;
      }
    } catch {
      // Fall through to the in-memory store when browser storage is unavailable.
    }
    memoryStorage.set(key, value);
  },
  removeItem(key: string): void {
    try {
      const storage = globalThis.localStorage;
      if (storage) storage.removeItem(key);
    } catch {
      // The in-memory store still needs to be cleared below.
    }
    memoryStorage.delete(key);
  },
};
