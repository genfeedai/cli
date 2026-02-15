import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getBrand, listBrands } from '../../src/api/brands.js';

const mockGet = vi.fn();

vi.mock('../../src/api/client.js', () => ({
  get: (path: string) => mockGet(path),
}));

describe('api/brands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listBrands', () => {
    it('returns array of brands', async () => {
      const mockResponse = {
        data: [
          {
            createdAt: '2024-01-01T00:00:00Z',
            description: 'First brand',
            id: 'brand-1',
            name: 'Brand One',
            updatedAt: '2024-01-01T00:00:00Z',
          },
          {
            createdAt: '2024-01-02T00:00:00Z',
            id: 'brand-2',
            name: 'Brand Two',
            updatedAt: '2024-01-02T00:00:00Z',
          },
        ],
      };
      mockGet.mockResolvedValue(mockResponse);

      const result = await listBrands();

      expect(mockGet).toHaveBeenCalledWith('/brands');
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Brand One');
      expect(result[1].name).toBe('Brand Two');
    });

    it('returns empty array when no brands', async () => {
      mockGet.mockResolvedValue({ data: [] });

      const result = await listBrands();

      expect(result).toHaveLength(0);
    });

    it('handles brands with optional fields', async () => {
      const mockResponse = {
        data: [
          {
            createdAt: '2024-01-01T00:00:00Z',
            id: 'brand-1',
            logoUrl: 'https://example.com/logo.png',
            name: 'Brand One',
            updatedAt: '2024-01-01T00:00:00Z',
          },
        ],
      };
      mockGet.mockResolvedValue(mockResponse);

      const result = await listBrands();

      expect(result[0].logoUrl).toBe('https://example.com/logo.png');
    });
  });

  describe('getBrand', () => {
    it('returns a single brand by id', async () => {
      const mockResponse = {
        data: {
          createdAt: '2024-01-01T00:00:00Z',
          description: 'Test description',
          id: 'brand-1',
          name: 'Brand One',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      };
      mockGet.mockResolvedValue(mockResponse);

      const result = await getBrand('brand-1');

      expect(mockGet).toHaveBeenCalledWith('/brands/brand-1');
      expect(result.id).toBe('brand-1');
      expect(result.name).toBe('Brand One');
    });

    it('propagates errors for invalid brand id', async () => {
      mockGet.mockRejectedValue(new Error('Not found'));

      await expect(getBrand('invalid-id')).rejects.toThrow('Not found');
    });
  });
});
