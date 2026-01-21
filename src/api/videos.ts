import { get, post } from './client.js';

export type VideoStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Video {
  id: string;
  status: VideoStatus;
  prompt: string;
  model: string;
  duration?: number;
  resolution?: string;
  url?: string;
  error?: string;
  brandId: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface CreateVideoRequest {
  text: string;
  brand: string;
  model?: string;
  duration?: number;
  resolution?: string;
}

export async function createVideo(request: CreateVideoRequest): Promise<Video> {
  const response = await post<{ data: Video }>(
    '/videos',
    request as unknown as Record<string, unknown>
  );
  return response.data;
}

export async function getVideo(id: string): Promise<Video> {
  const response = await get<{ data: Video }>(`/videos/${id}`);
  return response.data;
}
