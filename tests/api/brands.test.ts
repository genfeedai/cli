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
    it('flattens JSON:API collection response', async () => {
      mockGet.mockResolvedValue({
        data: [
          {
            attributes: {
              createdAt: '2024-01-01T00:00:00Z',
              description: 'First brand',
              label: 'Brand One',
              updatedAt: '2024-01-01T00:00:00Z',
            },
            id: 'brand-1',
            type: 'brand',
          },
          {
            attributes: {
              createdAt: '2024-01-02T00:00:00Z',
              label: 'Brand Two',
              updatedAt: '2024-01-02T00:00:00Z',
            },
            id: 'brand-2',
            type: 'brand',
          },
        ],
      });

      const result = await listBrands('org-123');

      expect(mockGet).toHaveBeenCalledWith('/organizations/org-123/brands');
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('brand-1');
      expect(result[0].label).toBe('Brand One');
      expect(result[1].label).toBe('Brand Two');
    });

    it('returns empty array when no brands', async () => {
      mockGet.mockResolvedValue({ data: [] });

      const result = await listBrands('org-123');

      expect(result).toHaveLength(0);
    });
  });

  describe('getBrand', () => {
    it('flattens JSON:API single response', async () => {
      mockGet.mockResolvedValue({
        data: {
          attributes: {
            createdAt: '2024-01-01T00:00:00Z',
            description: 'Test description',
            label: 'Brand One',
            updatedAt: '2024-01-01T00:00:00Z',
          },
          id: 'brand-1',
          type: 'brand',
        },
      });

      const result = await getBrand('brand-1');

      expect(mockGet).toHaveBeenCalledWith('/brands/brand-1');
      expect(result.id).toBe('brand-1');
      expect(result.label).toBe('Brand One');
    });

    it('propagates errors for invalid brand id', async () => {
      mockGet.mockRejectedValue(new Error('Not found'));

      await expect(getBrand('invalid-id')).rejects.toThrow('Not found');
    });
  });
});
