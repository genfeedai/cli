import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createImage, getImage } from '../../src/api/images.js';

const mockGet = vi.fn();
const mockPost = vi.fn();

vi.mock('../../src/api/client.js', () => ({
  get: (path: string) => mockGet(path),
  post: (path: string, body: Record<string, unknown>) => mockPost(path, body),
}));

describe('api/images', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createImage', () => {
    it('creates an image with required fields', async () => {
      const mockResponse = {
        data: {
          id: 'img-1',
          status: 'pending',
          prompt: 'A sunset over mountains',
          model: 'flux',
          brandId: 'brand-1',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      };
      mockPost.mockResolvedValue(mockResponse);

      const result = await createImage({
        text: 'A sunset over mountains',
        brand: 'brand-1',
      });

      expect(mockPost).toHaveBeenCalledWith('/images', {
        text: 'A sunset over mountains',
        brand: 'brand-1',
      });
      expect(result.id).toBe('img-1');
      expect(result.status).toBe('pending');
    });

    it('creates an image with optional dimensions', async () => {
      const mockResponse = {
        data: {
          id: 'img-2',
          status: 'pending',
          prompt: 'A cat',
          model: 'flux',
          width: 1024,
          height: 768,
          brandId: 'brand-1',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      };
      mockPost.mockResolvedValue(mockResponse);

      const result = await createImage({
        text: 'A cat',
        brand: 'brand-1',
        width: 1024,
        height: 768,
      });

      expect(mockPost).toHaveBeenCalledWith('/images', {
        text: 'A cat',
        brand: 'brand-1',
        width: 1024,
        height: 768,
      });
      expect(result.width).toBe(1024);
      expect(result.height).toBe(768);
    });

    it('creates an image with custom model', async () => {
      const mockResponse = {
        data: {
          id: 'img-3',
          status: 'pending',
          prompt: 'A dog',
          model: 'dall-e-3',
          brandId: 'brand-1',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      };
      mockPost.mockResolvedValue(mockResponse);

      const result = await createImage({
        text: 'A dog',
        brand: 'brand-1',
        model: 'dall-e-3',
      });

      expect(result.model).toBe('dall-e-3');
    });
  });

  describe('getImage', () => {
    it('returns image by id with pending status', async () => {
      const mockResponse = {
        data: {
          id: 'img-1',
          status: 'pending',
          prompt: 'A sunset',
          model: 'flux',
          brandId: 'brand-1',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      };
      mockGet.mockResolvedValue(mockResponse);

      const result = await getImage('img-1');

      expect(mockGet).toHaveBeenCalledWith('/images/img-1');
      expect(result.id).toBe('img-1');
      expect(result.status).toBe('pending');
    });

    it('returns completed image with url', async () => {
      const mockResponse = {
        data: {
          id: 'img-1',
          status: 'completed',
          prompt: 'A sunset',
          model: 'flux',
          url: 'https://cdn.genfeed.ai/images/img-1.png',
          brandId: 'brand-1',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          completedAt: '2024-01-01T00:01:00Z',
        },
      };
      mockGet.mockResolvedValue(mockResponse);

      const result = await getImage('img-1');

      expect(result.status).toBe('completed');
      expect(result.url).toBe('https://cdn.genfeed.ai/images/img-1.png');
      expect(result.completedAt).toBeDefined();
    });

    it('returns failed image with error', async () => {
      const mockResponse = {
        data: {
          id: 'img-1',
          status: 'failed',
          prompt: 'Invalid prompt',
          model: 'flux',
          error: 'Content policy violation',
          brandId: 'brand-1',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      };
      mockGet.mockResolvedValue(mockResponse);

      const result = await getImage('img-1');

      expect(result.status).toBe('failed');
      expect(result.error).toBe('Content policy violation');
    });
  });
});
