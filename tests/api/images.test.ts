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
          brandId: 'brand-1',
          createdAt: '2024-01-01T00:00:00Z',
          id: 'img-1',
          model: 'flux',
          prompt: 'A sunset over mountains',
          status: 'pending',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      };
      mockPost.mockResolvedValue(mockResponse);

      const result = await createImage({
        brand: 'brand-1',
        text: 'A sunset over mountains',
      });

      expect(mockPost).toHaveBeenCalledWith('/images', {
        brand: 'brand-1',
        text: 'A sunset over mountains',
      });
      expect(result.id).toBe('img-1');
      expect(result.status).toBe('pending');
    });

    it('creates an image with optional dimensions', async () => {
      const mockResponse = {
        data: {
          brandId: 'brand-1',
          createdAt: '2024-01-01T00:00:00Z',
          height: 768,
          id: 'img-2',
          model: 'flux',
          prompt: 'A cat',
          status: 'pending',
          updatedAt: '2024-01-01T00:00:00Z',
          width: 1024,
        },
      };
      mockPost.mockResolvedValue(mockResponse);

      const result = await createImage({
        brand: 'brand-1',
        height: 768,
        text: 'A cat',
        width: 1024,
      });

      expect(mockPost).toHaveBeenCalledWith('/images', {
        brand: 'brand-1',
        height: 768,
        text: 'A cat',
        width: 1024,
      });
      expect(result.width).toBe(1024);
      expect(result.height).toBe(768);
    });

    it('creates an image with custom model', async () => {
      const mockResponse = {
        data: {
          brandId: 'brand-1',
          createdAt: '2024-01-01T00:00:00Z',
          id: 'img-3',
          model: 'dall-e-3',
          prompt: 'A dog',
          status: 'pending',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      };
      mockPost.mockResolvedValue(mockResponse);

      const result = await createImage({
        brand: 'brand-1',
        model: 'dall-e-3',
        text: 'A dog',
      });

      expect(result.model).toBe('dall-e-3');
    });
  });

  describe('getImage', () => {
    it('returns image by id with pending status', async () => {
      const mockResponse = {
        data: {
          brandId: 'brand-1',
          createdAt: '2024-01-01T00:00:00Z',
          id: 'img-1',
          model: 'flux',
          prompt: 'A sunset',
          status: 'pending',
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
          brandId: 'brand-1',
          completedAt: '2024-01-01T00:01:00Z',
          createdAt: '2024-01-01T00:00:00Z',
          id: 'img-1',
          model: 'flux',
          prompt: 'A sunset',
          status: 'completed',
          updatedAt: '2024-01-01T00:00:00Z',
          url: 'https://cdn.genfeed.ai/images/img-1.png',
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
          brandId: 'brand-1',
          createdAt: '2024-01-01T00:00:00Z',
          error: 'Content policy violation',
          id: 'img-1',
          model: 'flux',
          prompt: 'Invalid prompt',
          status: 'failed',
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
