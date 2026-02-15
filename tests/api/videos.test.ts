import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createVideo, getVideo } from '../../src/api/videos.js';

const mockGet = vi.fn();
const mockPost = vi.fn();

vi.mock('../../src/api/client.js', () => ({
  get: (path: string) => mockGet(path),
  post: (path: string, body: Record<string, unknown>) => mockPost(path, body),
}));

describe('api/videos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createVideo', () => {
    it('creates a video with required fields', async () => {
      const mockResponse = {
        data: {
          brandId: 'brand-1',
          createdAt: '2024-01-01T00:00:00Z',
          id: 'vid-1',
          model: 'runway',
          prompt: 'A flying bird',
          status: 'pending',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      };
      mockPost.mockResolvedValue(mockResponse);

      const result = await createVideo({
        brand: 'brand-1',
        text: 'A flying bird',
      });

      expect(mockPost).toHaveBeenCalledWith('/videos', {
        brand: 'brand-1',
        text: 'A flying bird',
      });
      expect(result.id).toBe('vid-1');
      expect(result.status).toBe('pending');
    });

    it('creates a video with optional duration', async () => {
      const mockResponse = {
        data: {
          brandId: 'brand-1',
          createdAt: '2024-01-01T00:00:00Z',
          duration: 10,
          id: 'vid-2',
          model: 'runway',
          prompt: 'Ocean waves',
          status: 'pending',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      };
      mockPost.mockResolvedValue(mockResponse);

      const result = await createVideo({
        brand: 'brand-1',
        duration: 10,
        text: 'Ocean waves',
      });

      expect(mockPost).toHaveBeenCalledWith('/videos', {
        brand: 'brand-1',
        duration: 10,
        text: 'Ocean waves',
      });
      expect(result.duration).toBe(10);
    });

    it('creates a video with resolution', async () => {
      const mockResponse = {
        data: {
          brandId: 'brand-1',
          createdAt: '2024-01-01T00:00:00Z',
          id: 'vid-3',
          model: 'runway',
          prompt: 'City timelapse',
          resolution: '1080p',
          status: 'pending',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      };
      mockPost.mockResolvedValue(mockResponse);

      const result = await createVideo({
        brand: 'brand-1',
        resolution: '1080p',
        text: 'City timelapse',
      });

      expect(result.resolution).toBe('1080p');
    });

    it('creates a video with custom model', async () => {
      const mockResponse = {
        data: {
          brandId: 'brand-1',
          createdAt: '2024-01-01T00:00:00Z',
          id: 'vid-4',
          model: 'sora',
          prompt: 'Dancing robot',
          status: 'pending',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      };
      mockPost.mockResolvedValue(mockResponse);

      const result = await createVideo({
        brand: 'brand-1',
        model: 'sora',
        text: 'Dancing robot',
      });

      expect(result.model).toBe('sora');
    });
  });

  describe('getVideo', () => {
    it('returns video by id with pending status', async () => {
      const mockResponse = {
        data: {
          brandId: 'brand-1',
          createdAt: '2024-01-01T00:00:00Z',
          id: 'vid-1',
          model: 'runway',
          prompt: 'A flying bird',
          status: 'pending',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      };
      mockGet.mockResolvedValue(mockResponse);

      const result = await getVideo('vid-1');

      expect(mockGet).toHaveBeenCalledWith('/videos/vid-1');
      expect(result.id).toBe('vid-1');
      expect(result.status).toBe('pending');
    });

    it('returns processing video', async () => {
      const mockResponse = {
        data: {
          brandId: 'brand-1',
          createdAt: '2024-01-01T00:00:00Z',
          id: 'vid-1',
          model: 'runway',
          prompt: 'A flying bird',
          status: 'processing',
          updatedAt: '2024-01-01T00:00:30Z',
        },
      };
      mockGet.mockResolvedValue(mockResponse);

      const result = await getVideo('vid-1');

      expect(result.status).toBe('processing');
    });

    it('returns completed video with url', async () => {
      const mockResponse = {
        data: {
          brandId: 'brand-1',
          completedAt: '2024-01-01T00:02:00Z',
          createdAt: '2024-01-01T00:00:00Z',
          id: 'vid-1',
          model: 'runway',
          prompt: 'A flying bird',
          status: 'completed',
          updatedAt: '2024-01-01T00:02:00Z',
          url: 'https://cdn.genfeed.ai/videos/vid-1.mp4',
        },
      };
      mockGet.mockResolvedValue(mockResponse);

      const result = await getVideo('vid-1');

      expect(result.status).toBe('completed');
      expect(result.url).toBe('https://cdn.genfeed.ai/videos/vid-1.mp4');
      expect(result.completedAt).toBeDefined();
    });

    it('returns failed video with error', async () => {
      const mockResponse = {
        data: {
          brandId: 'brand-1',
          createdAt: '2024-01-01T00:00:00Z',
          error: 'Generation failed',
          id: 'vid-1',
          model: 'runway',
          prompt: 'Invalid prompt',
          status: 'failed',
          updatedAt: '2024-01-01T00:00:30Z',
        },
      };
      mockGet.mockResolvedValue(mockResponse);

      const result = await getVideo('vid-1');

      expect(result.status).toBe('failed');
      expect(result.error).toBe('Generation failed');
    });
  });
});
