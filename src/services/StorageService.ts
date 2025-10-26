import AsyncStorage from '@react-native-async-storage/async-storage';

export interface StorageItem<T> {
  key: string;
  value: T;
  timestamp: number;
}

export class StorageService {
  private prefix: string = '@rn_testing_app:';

  async set<T>(key: string, value: T): Promise<void> {
    try {
      const item: StorageItem<T> = {
        key,
        value,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(
        this.getKey(key),
        JSON.stringify(item)
      );
    } catch (error) {
      throw new Error(`Storage set failed: ${error.message}`);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await AsyncStorage.getItem(this.getKey(key));
      if (!data) return null;

      const item: StorageItem<T> = JSON.parse(data);
      return item.value;
    } catch (error) {
      throw new Error(`Storage get failed: ${error.message}`);
    }
  }

  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.getKey(key));
    } catch (error) {
      throw new Error(`Storage remove failed: ${error.message}`);
    }
  }

  async clear(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const appKeys = keys.filter(key => key.startsWith(this.prefix));
      await AsyncStorage.multiRemove(appKeys);
    } catch (error) {
      throw new Error(`Storage clear failed: ${error.message}`);
    }
  }

  async getAllKeys(): Promise<string[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      return keys
        .filter(key => key.startsWith(this.prefix))
        .map(key => key.replace(this.prefix, ''));
    } catch (error) {
      throw new Error(`Get all keys failed: ${error.message}`);
    }
  }

  async has(key: string): Promise<boolean> {
    try {
      const value = await this.get(key);
      return value !== null;
    } catch (error) {
      return false;
    }
  }

  async setMultiple(items: Record<string, any>): Promise<void> {
    try {
      const pairs: [string, string][] = Object.entries(items).map(([key, value]) => [
        this.getKey(key),
        JSON.stringify({
          key,
          value,
          timestamp: Date.now(),
        }),
      ]);
      await AsyncStorage.multiSet(pairs);
    } catch (error) {
      throw new Error(`Storage setMultiple failed: ${error.message}`);
    }
  }

  async getMultiple<T>(keys: string[]): Promise<Record<string, T>> {
    try {
      const prefixedKeys = keys.map(key => this.getKey(key));
      const pairs = await AsyncStorage.multiGet(prefixedKeys);
      
      const result: Record<string, T> = {};
      pairs.forEach(([key, value]) => {
        if (value) {
          const item: StorageItem<T> = JSON.parse(value);
          const originalKey = key.replace(this.prefix, '');
          result[originalKey] = item.value;
        }
      });

      return result;
    } catch (error) {
      throw new Error(`Storage getMultiple failed: ${error.message}`);
    }
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  setPrefix(prefix: string): void {
    this.prefix = prefix;
  }
}

export default new StorageService();
