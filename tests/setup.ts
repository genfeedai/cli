import { vi } from 'vitest';

// Mock the Conf library for config store tests
vi.mock('conf', () => {
  const store = new Map<string, unknown>();

  return {
    default: class MockConf<T> {
      private defaults: T;

      constructor(options: { defaults?: T }) {
        this.defaults = options?.defaults ?? ({} as T);
        // Initialize with defaults
        if (this.defaults && typeof this.defaults === 'object') {
          for (const [key, value] of Object.entries(this.defaults)) {
            if (!store.has(key)) {
              store.set(key, value);
            }
          }
        }
      }

      get store(): T {
        const result: Record<string, unknown> = {};
        for (const [key, value] of store.entries()) {
          result[key] = value;
        }
        return { ...this.defaults, ...result } as T;
      }

      get<K extends keyof T>(key: K): T[K] | undefined {
        if (store.has(key as string)) {
          return store.get(key as string) as T[K];
        }
        return (this.defaults as Record<string, unknown>)?.[key as string] as T[K];
      }

      set<K extends keyof T>(key: K, value: T[K]): void {
        store.set(key as string, value);
      }

      delete<K extends keyof T>(key: K): void {
        store.delete(key as string);
      }

      clear(): void {
        store.clear();
      }

      get path(): string {
        return '/mock/config/path';
      }
    },
  };
});

// Helper to reset the mock store between tests
export function resetMockStore(): void {
  vi.resetModules();
}

// Mock chalk to return plain strings in tests
vi.mock('chalk', () => ({
  default: {
    red: (s: string) => s,
    green: (s: string) => s,
    blue: (s: string) => s,
    yellow: (s: string) => s,
    dim: (s: string) => s,
    bold: (s: string) => s,
    cyan: (s: string) => s,
  },
}));

// Mock ora spinner
vi.mock('ora', () => ({
  default: (options: { text: string }) => ({
    text: options.text,
    start: vi.fn().mockReturnThis(),
    stop: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis(),
  }),
}));
