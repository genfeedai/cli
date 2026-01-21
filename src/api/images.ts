import { get, post } from './client.js';

export type ImageStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Image {
  id: string;
  status: ImageStatus;
  prompt: string;
  model: string;
  width?: number;
  height?: number;
  url?: string;
  error?: string;
  brandId: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface CreateImageRequest {
  text: string;
  brand: string;
  model?: string;
  width?: number;
  height?: number;
}

export async function createImage(request: CreateImageRequest): Promise<Image> {
  const response = await post<{ data: Image }>(
    '/images',
    request as unknown as Record<string, unknown>
  );
  return response.data;
}

export async function getImage(id: string): Promise<Image> {
  const response = await get<{ data: Image }>(`/images/${id}`);
  return response.data;
}
