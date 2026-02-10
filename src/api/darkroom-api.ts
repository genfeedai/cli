import { getActiveProfile } from '../config/store.js';
import { DarkroomApiError } from '../utils/errors.js';

interface DarkroomHealthResponse {
  status: string;
  gpu: {
    name: string;
    memory_used: number;
    memory_total: number;
    utilization: number;
    temperature: number;
  };
  disk: {
    root: { used: string; total: string; percent: string };
    comfyui?: { used: string; total: string; percent: string };
  };
}

interface DatasetResponse {
  persona: string;
  path: string;
  image_count: number;
  caption_count: number;
  images: string[];
}

interface TrainRequest {
  persona_slug: string;
  trigger_word: string;
  lora_name: string;
  steps?: number;
  lora_rank?: number;
  learning_rate?: number;
  batch_size?: number;
  s3_bucket?: string;
}

interface TrainResponse {
  job_id: string;
  image_count: number;
}

interface TrainStatusResponse {
  job_id: string;
  status: 'running' | 'completed' | 'failed';
  stage: 'training' | 'postprocessing' | 'uploading' | 'completed' | 'failed';
  progress: number;
  started_at: string;
  completed_at?: string;
  persona_slug: string;
  lora_name: string;
  image_count: number;
  error: string | null;
}

interface CaptionRequest {
  persona_slug: string;
  trigger_word: string;
}

interface CaptionResponse {
  status: string;
  output: string;
}

interface LoraInfo {
  name: string;
  filename: string;
  size_mb: number;
  modified: string;
}

interface LorasResponse {
  loras: LoraInfo[];
}

interface ComfyActionResponse {
  action: string;
  returncode: number;
  stdout: string;
  stderr: string;
}

interface DatasetUploadResponse {
  persona: string;
  path: string;
  uploaded_count: number;
  files: string[];
}

interface DatasetDeleteResponse {
  persona: string;
  deleted: boolean;
}

async function getDarkroomBaseUrl(): Promise<string> {
  const { profile } = await getActiveProfile();
  return `http://${profile.darkroomHost}:${profile.darkroomApiPort}`;
}

async function darkroomRequest<T>(method: string, path: string, body?: unknown): Promise<T> {
  const baseUrl = await getDarkroomBaseUrl();
  const url = `${baseUrl}${path}`;

  try {
    const response = await fetch(url, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new DarkroomApiError(
        `Darkroom API ${method} ${path} failed: ${response.status} ${text}`
      );
    }

    const raw = await response.text();
    if (!raw) return undefined as T;
    return JSON.parse(raw) as T;
  } catch (error) {
    if (error instanceof DarkroomApiError) throw error;

    const message = error instanceof Error ? error.message : String(error);
    throw new DarkroomApiError(
      `Cannot reach Darkroom API at ${baseUrl}: ${message}`,
      'Ensure the darkroom instance is running and darkroom-api service is active'
    );
  }
}

export async function getDarkroomHealth(): Promise<DarkroomHealthResponse> {
  return darkroomRequest<DarkroomHealthResponse>('GET', '/health');
}

export async function getDataset(persona: string): Promise<DatasetResponse> {
  return darkroomRequest<DatasetResponse>('GET', `/datasets/${persona}`);
}

export async function startTraining(request: TrainRequest): Promise<TrainResponse> {
  return darkroomRequest<TrainResponse>('POST', '/train', request);
}

export async function getTrainingStatus(jobId: string): Promise<TrainStatusResponse> {
  return darkroomRequest<TrainStatusResponse>('GET', `/train/${jobId}`);
}

export async function runCaption(request: CaptionRequest): Promise<CaptionResponse> {
  return darkroomRequest<CaptionResponse>('POST', '/caption', request);
}

export async function listLoras(): Promise<LorasResponse> {
  return darkroomRequest<LorasResponse>('GET', '/loras');
}

export async function comfyAction(
  action: 'start' | 'stop' | 'restart' | 'status'
): Promise<ComfyActionResponse> {
  return darkroomRequest<ComfyActionResponse>('POST', `/comfyui/${action}`);
}

export async function uploadDataset(
  persona: string,
  filePaths: string[]
): Promise<DatasetUploadResponse> {
  const { readFile } = await import('node:fs/promises');
  const { basename } = await import('node:path');
  const baseUrl = await getDarkroomBaseUrl();
  const url = `${baseUrl}/datasets/${persona}/upload`;

  const formData = new FormData();
  for (const filePath of filePaths) {
    const content = await readFile(filePath);
    const blob = new Blob([content]);
    formData.append('files', blob, basename(filePath));
  }

  try {
    const response = await fetch(url, { method: 'POST', body: formData });

    if (!response.ok) {
      const text = await response.text();
      throw new DarkroomApiError(
        `Darkroom API POST /datasets/${persona}/upload failed: ${response.status} ${text}`
      );
    }

    return (await response.json()) as DatasetUploadResponse;
  } catch (error) {
    if (error instanceof DarkroomApiError) throw error;
    const message = error instanceof Error ? error.message : String(error);
    throw new DarkroomApiError(
      `Cannot reach Darkroom API at ${baseUrl}: ${message}`,
      'Ensure the darkroom instance is running and darkroom-api service is active'
    );
  }
}

export async function downloadDataset(persona: string, outDir: string): Promise<void> {
  const { mkdir, writeFile, unlink } = await import('node:fs/promises');
  const { execFile } = await import('node:child_process');
  const { promisify } = await import('node:util');
  const { join } = await import('node:path');
  const execFileAsync = promisify(execFile);

  const baseUrl = await getDarkroomBaseUrl();
  const url = `${baseUrl}/datasets/${persona}/download`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      const text = await response.text();
      throw new DarkroomApiError(
        `Darkroom API GET /datasets/${persona}/download failed: ${response.status} ${text}`
      );
    }

    await mkdir(outDir, { recursive: true });
    const tarPath = join(outDir, `${persona}-dataset.tar.gz`);
    const buffer = Buffer.from(await response.arrayBuffer());
    await writeFile(tarPath, buffer);

    await execFileAsync('tar', ['xzf', tarPath, '-C', outDir]);
    await unlink(tarPath);
  } catch (error) {
    if (error instanceof DarkroomApiError) throw error;
    const message = error instanceof Error ? error.message : String(error);
    throw new DarkroomApiError(
      `Cannot reach Darkroom API at ${baseUrl}: ${message}`,
      'Ensure the darkroom instance is running and darkroom-api service is active'
    );
  }
}

export async function deleteDataset(persona: string): Promise<DatasetDeleteResponse> {
  return darkroomRequest<DatasetDeleteResponse>('DELETE', `/datasets/${persona}`);
}

export type {
  DarkroomHealthResponse,
  DatasetResponse,
  TrainRequest,
  TrainResponse,
  TrainStatusResponse,
  CaptionRequest,
  CaptionResponse,
  LoraInfo,
  LorasResponse,
  ComfyActionResponse,
  DatasetUploadResponse,
  DatasetDeleteResponse,
};
