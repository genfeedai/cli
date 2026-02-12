import { vi } from 'vitest';

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
