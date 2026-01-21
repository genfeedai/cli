import { beforeEach, describe, expect, it, vi } from 'vitest';

// Create isolated mock store for each test
const createMockStore = () => {
  const data = new Map<string, unknown>();
  const defaults = {
    apiUrl: 'https://api.genfeed.ai/v1',
    defaults: {
      imageModel: 'imagen-4',
      videoModel: 'google-veo-3',
    },
  };

  return {
    data,
    defaults,
    get store() {
      const result: Record<string, unknown> = { ...defaults };
      for (const [key, value] of data.entries()) {
        result[key] = value;
      }
      return result;
    },
    get(key: string) {
      return data.has(key) ? data.get(key) : (defaults as Record<string, unknown>)[key];
    },
    set(key: string, value: unknown) {
      data.set(key, value);
    },
    delete(key: string) {
      data.delete(key);
    },
    clear() {
      data.clear();
    },
    path: '/mock/config/path',
  };
};

let mockStore: ReturnType<typeof createMockStore>;

vi.mock('conf', () => {
  return {
    default: class MockConf {
      get store() {
        return mockStore.store;
      }
      get(key: string) {
        return mockStore.get(key);
      }
      set(key: string, value: unknown) {
        mockStore.set(key, value);
      }
      delete(key: string) {
        mockStore.delete(key);
      }
      clear() {
        mockStore.clear();
      }
      get path() {
        return mockStore.path;
      }
    },
  };
});

describe('config/store', () => {
  beforeEach(async () => {
    mockStore = createMockStore();
    vi.resetModules();
  });

  describe('getApiKey', () => {
    it('returns undefined when no API key is set', async () => {
      const { getApiKey } = await import('../../src/config/store.js');
      expect(getApiKey()).toBeUndefined();
    });

    it('returns API key when set', async () => {
      mockStore.set('apiKey', 'test-api-key');
      const { getApiKey } = await import('../../src/config/store.js');
      expect(getApiKey()).toBe('test-api-key');
    });
  });

  describe('setApiKey', () => {
    it('stores the API key', async () => {
      const { setApiKey, getApiKey } = await import('../../src/config/store.js');
      setApiKey('new-api-key');
      expect(getApiKey()).toBe('new-api-key');
    });
  });

  describe('clearApiKey', () => {
    it('removes the API key', async () => {
      mockStore.set('apiKey', 'test-api-key');
      const { clearApiKey, getApiKey } = await import('../../src/config/store.js');
      clearApiKey();
      expect(getApiKey()).toBeUndefined();
    });
  });

  describe('getApiUrl', () => {
    it('returns default API URL when not set', async () => {
      const { getApiUrl } = await import('../../src/config/store.js');
      expect(getApiUrl()).toBe('https://api.genfeed.ai/v1');
    });

    it('returns custom API URL when set', async () => {
      mockStore.set('apiUrl', 'https://custom.api.com/v1');
      const { getApiUrl } = await import('../../src/config/store.js');
      expect(getApiUrl()).toBe('https://custom.api.com/v1');
    });
  });

  describe('setApiUrl', () => {
    it('stores the API URL', async () => {
      const { setApiUrl, getApiUrl } = await import('../../src/config/store.js');
      setApiUrl('https://new.api.com/v1');
      expect(getApiUrl()).toBe('https://new.api.com/v1');
    });
  });

  describe('getActiveBrand', () => {
    it('returns undefined when no brand is set', async () => {
      const { getActiveBrand } = await import('../../src/config/store.js');
      expect(getActiveBrand()).toBeUndefined();
    });

    it('returns brand ID when set', async () => {
      mockStore.set('activeBrand', 'brand-123');
      const { getActiveBrand } = await import('../../src/config/store.js');
      expect(getActiveBrand()).toBe('brand-123');
    });
  });

  describe('setActiveBrand', () => {
    it('stores the active brand', async () => {
      const { setActiveBrand, getActiveBrand } = await import('../../src/config/store.js');
      setActiveBrand('brand-456');
      expect(getActiveBrand()).toBe('brand-456');
    });
  });

  describe('clearActiveBrand', () => {
    it('removes the active brand', async () => {
      mockStore.set('activeBrand', 'brand-123');
      const { clearActiveBrand, getActiveBrand } = await import('../../src/config/store.js');
      clearActiveBrand();
      expect(getActiveBrand()).toBeUndefined();
    });
  });

  describe('getDefaultImageModel', () => {
    it('returns default image model', async () => {
      const { getDefaultImageModel } = await import('../../src/config/store.js');
      expect(getDefaultImageModel()).toBe('imagen-4');
    });

    it('returns custom image model when set', async () => {
      mockStore.set('defaults', { imageModel: 'custom-model', videoModel: 'google-veo-3' });
      const { getDefaultImageModel } = await import('../../src/config/store.js');
      expect(getDefaultImageModel()).toBe('custom-model');
    });
  });

  describe('getDefaultVideoModel', () => {
    it('returns default video model', async () => {
      const { getDefaultVideoModel } = await import('../../src/config/store.js');
      expect(getDefaultVideoModel()).toBe('google-veo-3');
    });

    it('returns custom video model when set', async () => {
      mockStore.set('defaults', { imageModel: 'imagen-4', videoModel: 'custom-video' });
      const { getDefaultVideoModel } = await import('../../src/config/store.js');
      expect(getDefaultVideoModel()).toBe('custom-video');
    });
  });

  describe('setDefaults', () => {
    it('updates image model default', async () => {
      const { setDefaults, getDefaultImageModel } = await import('../../src/config/store.js');
      setDefaults({ imageModel: 'new-image-model' });
      expect(getDefaultImageModel()).toBe('new-image-model');
    });

    it('updates video model default', async () => {
      const { setDefaults, getDefaultVideoModel } = await import('../../src/config/store.js');
      setDefaults({ videoModel: 'new-video-model' });
      expect(getDefaultVideoModel()).toBe('new-video-model');
    });

    it('preserves existing defaults when updating partial', async () => {
      mockStore.set('defaults', { imageModel: 'imagen-4', videoModel: 'google-veo-3' });
      const { setDefaults, getDefaultImageModel, getDefaultVideoModel } = await import(
        '../../src/config/store.js'
      );
      setDefaults({ imageModel: 'new-image' });
      expect(getDefaultImageModel()).toBe('new-image');
      expect(getDefaultVideoModel()).toBe('google-veo-3');
    });
  });

  describe('clearConfig', () => {
    it('clears all config values', async () => {
      mockStore.set('apiKey', 'test-key');
      mockStore.set('activeBrand', 'brand-123');
      const { clearConfig, getApiKey, getActiveBrand } = await import('../../src/config/store.js');
      clearConfig();
      expect(getApiKey()).toBeUndefined();
      expect(getActiveBrand()).toBeUndefined();
    });
  });

  describe('getConfigPath', () => {
    it('returns config file path', async () => {
      const { getConfigPath } = await import('../../src/config/store.js');
      expect(getConfigPath()).toBe('/mock/config/path');
    });
  });

  describe('getConfig', () => {
    it('returns full config object', async () => {
      mockStore.set('apiKey', 'test-key');
      mockStore.set('activeBrand', 'brand-123');
      const { getConfig } = await import('../../src/config/store.js');
      const config = getConfig();
      expect(config.apiKey).toBe('test-key');
      expect(config.activeBrand).toBe('brand-123');
      expect(config.apiUrl).toBe('https://api.genfeed.ai/v1');
    });
  });
});
