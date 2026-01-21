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
          id: 'vid-1',
          status: 'pending',
          prompt: 'A flying bird',
          model: 'runway',
          brandId: 'brand-1',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      };
      mockPost.mockResolvedValue(mockResponse);

      const result = await createVideo({
        text: 'A flying bird',
        brand: 'brand-1',
      });

      expect(mockPost).toHaveBeenCalledWith('/videos', {
        text: 'A flying bird',
        brand: 'brand-1',
      });
      expect(result.id).toBe('vid-1');
      expect(result.status).toBe('pending');
    });

    it('creates a video with optional duration', async () => {
      const mockResponse = {
        data: {
          id: 'vid-2',
          status: 'pending',
          prompt: 'Ocean waves',
          model: 'runway',
          duration: 10,
          brandId: 'brand-1',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      };
      mockPost.mockResolvedValue(mockResponse);

      const result = await createVideo({
        text: 'Ocean waves',
        brand: 'brand-1',
        duration: 10,
      });

      expect(mockPost).toHaveBeenCalledWith('/videos', {
        text: 'Ocean waves',
        brand: 'brand-1',
        duration: 10,
      });
      expect(result.duration).toBe(10);
    });

    it('creates a video with resolution', async () => {
      const mockResponse = {
        data: {
          id: 'vid-3',
          status: 'pending',
          prompt: 'City timelapse',
          model: 'runway',
          resolution: '1080p',
          brandId: 'brand-1',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      };
      mockPost.mockResolvedValue(mockResponse);

      const result = await createVideo({
        text: 'City timelapse',
        brand: 'brand-1',
        resolution: '1080p',
      });

      expect(result.resolution).toBe('1080p');
    });

    it('creates a video with custom model', async () => {
      const mockResponse = {
        data: {
          id: 'vid-4',
          status: 'pending',
          prompt: 'Dancing robot',
          model: 'sora',
          brandId: 'brand-1',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      };
      mockPost.mockResolvedValue(mockResponse);

      const result = await createVideo({
        text: 'Dancing robot',
        brand: 'brand-1',
        model: 'sora',
      });

      expect(result.model).toBe('sora');
    });
  });

  describe('getVideo', () => {
    it('returns video by id with pending status', async () => {
      const mockResponse = {
        data: {
          id: 'vid-1',
          status: 'pending',
          prompt: 'A flying bird',
          model: 'runway',
          brandId: 'brand-1',
          createdAt: '2024-01-01T00:00:00Z',
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
          id: 'vid-1',
          status: 'processing',
          prompt: 'A flying bird',
          model: 'runway',
          brandId: 'brand-1',
          createdAt: '2024-01-01T00:00:00Z',
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
          id: 'vid-1',
          status: 'completed',
          prompt: 'A flying bird',
          model: 'runway',
          url: 'https://cdn.genfeed.ai/videos/vid-1.mp4',
          brandId: 'brand-1',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:02:00Z',
          completedAt: '2024-01-01T00:02:00Z',
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
          id: 'vid-1',
          status: 'failed',
          prompt: 'Invalid prompt',
          model: 'runway',
          error: 'Generation failed',
          brandId: 'brand-1',
          createdAt: '2024-01-01T00:00:00Z',
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
