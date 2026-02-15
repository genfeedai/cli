import { beforeEach, describe, expect, it, vi } from 'vitest';
import { validateApiKey, whoami } from '../../src/api/auth.js';

const mockGet = vi.fn();

vi.mock('../../src/api/client.js', () => ({
  get: (path: string) => mockGet(path),
}));

describe('api/auth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('whoami', () => {
    it('returns user and organization data', async () => {
      const mockResponse = {
        data: {
          organization: { id: 'org-1', name: 'Test Org' },
          scopes: ['read', 'write'],
          user: { email: 'test@example.com', id: 'user-1', name: 'Test User' },
        },
      };
      mockGet.mockResolvedValue(mockResponse);

      const result = await whoami();

      expect(mockGet).toHaveBeenCalledWith('/auth/whoami');
      expect(result.user.email).toBe('test@example.com');
      expect(result.organization.name).toBe('Test Org');
      expect(result.scopes).toContain('read');
    });

    it('returns scopes array', async () => {
      const mockResponse = {
        data: {
          organization: { id: 'org-1', name: 'Test Org' },
          scopes: ['admin', 'read', 'write'],
          user: { email: 'test@example.com', id: 'user-1', name: 'Test User' },
        },
      };
      mockGet.mockResolvedValue(mockResponse);

      const result = await whoami();

      expect(result.scopes).toHaveLength(3);
      expect(result.scopes).toContain('admin');
    });
  });

  describe('validateApiKey', () => {
    it('calls whoami to validate the API key', async () => {
      const mockResponse = {
        data: {
          organization: { id: 'org-1', name: 'Test Org' },
          scopes: ['read'],
          user: { email: 'test@example.com', id: 'user-1', name: 'Test User' },
        },
      };
      mockGet.mockResolvedValue(mockResponse);

      const result = await validateApiKey();

      expect(mockGet).toHaveBeenCalledWith('/auth/whoami');
      expect(result.user.id).toBe('user-1');
    });

    it('propagates errors from whoami', async () => {
      mockGet.mockRejectedValue(new Error('Unauthorized'));

      await expect(validateApiKey()).rejects.toThrow('Unauthorized');
    });
  });
});
