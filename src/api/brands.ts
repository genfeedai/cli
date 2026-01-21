import { get } from './client.js';

export interface Brand {
  id: string;
  name: string;
  description?: string;
  logoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BrandsResponse {
  data: Brand[];
  meta?: {
    total: number;
    page: number;
    limit: number;
  };
}

export async function listBrands(): Promise<Brand[]> {
  const response = await get<BrandsResponse>('/brands');
  return response.data;
}

export async function getBrand(id: string): Promise<Brand> {
  const response = await get<{ data: Brand }>(`/brands/${id}`);
  return response.data;
}
