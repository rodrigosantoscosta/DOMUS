export interface StorageDriver {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
}

export class MemoryStorageDriver implements StorageDriver {
  private memoryMap = new Map<string, string>();

  async getItem(key: string): Promise<string | null> {
    return this.memoryMap.has(key) ? this.memoryMap.get(key)! : null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.memoryMap.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    this.memoryMap.delete(key);
  }

  async clear(): Promise<void> {
    this.memoryMap.clear();
  }
}

function resolveStorageDriver(): StorageDriver {
  const memoryFallback = new MemoryStorageDriver();

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('@react-native-async-storage/async-storage');
    const native = mod?.default || mod;

    if (native && typeof native.getItem === 'function') {
      return {
        getItem: async (key: string) => {
          try {
            return await native.getItem(key);
          } catch {
            return memoryFallback.getItem(key);
          }
        },
        setItem: async (key: string, value: string) => {
          try {
            await native.setItem(key, value);
          } catch {
            await memoryFallback.setItem(key, value);
          }
        },
        removeItem: async (key: string) => {
          try {
            await native.removeItem(key);
          } catch {
            await memoryFallback.removeItem(key);
          }
        },
        clear: async () => {
          try {
            await native.clear();
          } catch {
            await memoryFallback.clear();
          }
        },
      };
    }
  } catch {
    // Ambiente sem suporte nativo / Node.js
  }

  return memoryFallback;
}

export class DomusStorage {
  private driver: StorageDriver;

  constructor(customDriver?: StorageDriver) {
    this.driver = customDriver || resolveStorageDriver();
  }

  async getItem<T>(key: string): Promise<T | null> {
    try {
      const raw = await this.driver.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  async setItem<T>(key: string, value: T): Promise<void> {
    const raw = JSON.stringify(value);
    await this.driver.setItem(key, raw);
  }

  async removeItem(key: string): Promise<void> {
    await this.driver.removeItem(key);
  }

  async clear(): Promise<void> {
    await this.driver.clear();
  }
}

export const domusStorage = new DomusStorage();
