import Conf from 'conf';
import { type Config, configSchema, defaultConfig } from './schema.js';

const store = new Conf<Config>({
  projectName: 'genfeed',
  defaults: defaultConfig,
  schema: {
    apiKey: { type: 'string' },
    apiUrl: { type: 'string' },
    activeBrand: { type: 'string' },
    defaults: {
      type: 'object',
      properties: {
        imageModel: { type: 'string' },
        videoModel: { type: 'string' },
      },
    },
  },
});

export function getConfig(): Config {
  const raw = store.store;
  return configSchema.parse(raw);
}

export function getApiKey(): string | undefined {
  return store.get('apiKey');
}

export function setApiKey(key: string): void {
  store.set('apiKey', key);
}

export function clearApiKey(): void {
  store.delete('apiKey');
}

export function getApiUrl(): string {
  return store.get('apiUrl') ?? defaultConfig.apiUrl!;
}

export function setApiUrl(url: string): void {
  store.set('apiUrl', url);
}

export function getActiveBrand(): string | undefined {
  return store.get('activeBrand');
}

export function setActiveBrand(brandId: string): void {
  store.set('activeBrand', brandId);
}

export function clearActiveBrand(): void {
  store.delete('activeBrand');
}

export function getDefaultImageModel(): string {
  return store.get('defaults')?.imageModel ?? defaultConfig.defaults!.imageModel!;
}

export function getDefaultVideoModel(): string {
  return store.get('defaults')?.videoModel ?? defaultConfig.defaults!.videoModel!;
}

export function setDefaults(defaults: Partial<Config['defaults']>): void {
  const current = store.get('defaults') ?? {};
  store.set('defaults', { ...current, ...defaults });
}

export function clearConfig(): void {
  store.clear();
}

export function getConfigPath(): string {
  return store.path;
}
