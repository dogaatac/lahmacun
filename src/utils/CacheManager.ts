import AsyncStorage from "@react-native-async-storage/async-storage";

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  useMemoryCache?: boolean;
}

class CacheManager {
  private memoryCache: Map<string, CacheEntry<any>> = new Map();
  private defaultTTL: number = 5 * 60 * 1000; // 5 minutes

  async get<T>(key: string, options?: CacheOptions): Promise<T | null> {
    const useMemory = options?.useMemoryCache !== false;

    if (useMemory && this.memoryCache.has(key)) {
      const entry = this.memoryCache.get(key)!;
      if (Date.now() < entry.expiresAt) {
        return entry.data as T;
      }
      this.memoryCache.delete(key);
    }

    try {
      const stored = await AsyncStorage.getItem(key);
      if (!stored) {
        return null;
      }

      const entry: CacheEntry<T> = JSON.parse(stored);
      if (Date.now() < entry.expiresAt) {
        if (useMemory) {
          this.memoryCache.set(key, entry);
        }
        return entry.data;
      }

      await AsyncStorage.removeItem(key);
      return null;
    } catch (error) {
      console.error("[Cache] Error getting cache:", error);
      return null;
    }
  }

  async set<T>(key: string, data: T, options?: CacheOptions): Promise<void> {
    const ttl = options?.ttl || this.defaultTTL;
    const useMemory = options?.useMemoryCache !== false;
    const now = Date.now();

    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt: now + ttl,
    };

    if (useMemory) {
      this.memoryCache.set(key, entry);
    }

    try {
      await AsyncStorage.setItem(key, JSON.stringify(entry));
    } catch (error) {
      console.error("[Cache] Error setting cache:", error);
    }
  }

  async remove(key: string): Promise<void> {
    this.memoryCache.delete(key);
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error("[Cache] Error removing cache:", error);
    }
  }

  async clear(): Promise<void> {
    this.memoryCache.clear();
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter((k) => k.startsWith("cache:"));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error("[Cache] Error clearing cache:", error);
    }
  }

  clearMemoryCache(): void {
    this.memoryCache.clear();
  }

  async getOrFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    const cached = await this.get<T>(key, options);
    if (cached !== null) {
      return cached;
    }

    const data = await fetchFn();
    await this.set(key, data, options);
    return data;
  }

  getCacheKey(prefix: string, ...params: any[]): string {
    return `cache:${prefix}:${params
      .map((p) => (typeof p === "object" ? JSON.stringify(p) : String(p)))
      .join(":")}`;
  }

  setDefaultTTL(ttl: number): void {
    this.defaultTTL = ttl;
  }

  getMemoryCacheSize(): number {
    return this.memoryCache.size;
  }

  async getStorageCacheSize(): Promise<number> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      return keys.filter((k) => k.startsWith("cache:")).length;
    } catch (error) {
      console.error("[Cache] Error getting storage cache size:", error);
      return 0;
    }
  }
}

export default new CacheManager();
