import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { type BackgroundTaskUpdate, waitForCompletion } from '../../src/utils/websocket.js';

// Mock socket.io-client
const mockSocket = {
  on: vi.fn(),
  disconnect: vi.fn(),
  connected: true,
};

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockSocket),
}));

// Mock config store
vi.mock('../../src/config/store.js', () => ({
  getApiKey: vi.fn(() => 'test-api-key'),
  getApiUrl: vi.fn(() => 'https://api.genfeed.ai/v1'),
}));

describe('utils/websocket', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    mockSocket.on.mockReset();
    mockSocket.disconnect.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('waitForCompletion', () => {
    it('resolves when receiving completed status', async () => {
      const mockResult = {
        id: 'test-123',
        status: 'completed',
        url: 'https://example.com/video.mp4',
      };
      const getResult = vi.fn().mockResolvedValue(mockResult);

      // Capture the event handlers
      const eventHandlers: Record<string, (data: unknown) => void> = {};
      mockSocket.on.mockImplementation((event: string, handler: (data: unknown) => void) => {
        eventHandlers[event] = handler;
        return mockSocket;
      });

      const promise = waitForCompletion({
        taskId: 'test-123',
        taskType: 'VIDEO',
        getResult,
        timeout: 5000,
      });

      // Simulate connection
      await vi.advanceTimersByTimeAsync(0);
      eventHandlers.connect?.({});

      // Simulate completion event
      const updateEvent: BackgroundTaskUpdate = {
        taskId: 'task-abc',
        resultId: 'test-123',
        resultType: 'VIDEO',
        status: 'completed',
        progress: 100,
      };
      eventHandlers['background-task-update']?.(updateEvent);

      const result = await promise;
      expect(result.result).toEqual(mockResult);
      expect(getResult).toHaveBeenCalledTimes(1);
      expect(mockSocket.disconnect).toHaveBeenCalled();
    });

    it('rejects when receiving failed status', async () => {
      const getResult = vi.fn();

      const eventHandlers: Record<string, (data: unknown) => void> = {};
      mockSocket.on.mockImplementation((event: string, handler: (data: unknown) => void) => {
        eventHandlers[event] = handler;
        return mockSocket;
      });

      const promise = waitForCompletion({
        taskId: 'test-456',
        taskType: 'IMAGE',
        getResult,
        timeout: 5000,
      });

      await vi.advanceTimersByTimeAsync(0);
      eventHandlers.connect?.({});

      // Simulate failure event
      const updateEvent: BackgroundTaskUpdate = {
        taskId: 'test-456',
        resultType: 'IMAGE',
        status: 'failed',
        error: 'Generation failed: invalid prompt',
      };
      eventHandlers['background-task-update']?.(updateEvent);

      await expect(promise).rejects.toThrow('Generation failed: invalid prompt');
      expect(getResult).not.toHaveBeenCalled();
      expect(mockSocket.disconnect).toHaveBeenCalled();
    });

    it('ignores events for different task IDs', async () => {
      const mockResult = { id: 'test-123', status: 'completed' };
      const getResult = vi.fn().mockResolvedValue(mockResult);

      const eventHandlers: Record<string, (data: unknown) => void> = {};
      mockSocket.on.mockImplementation((event: string, handler: (data: unknown) => void) => {
        eventHandlers[event] = handler;
        return mockSocket;
      });

      const promise = waitForCompletion({
        taskId: 'test-123',
        taskType: 'VIDEO',
        getResult,
        timeout: 5000,
      });

      await vi.advanceTimersByTimeAsync(0);
      eventHandlers.connect?.({});

      // Send event for different task - should be ignored
      const wrongTaskEvent: BackgroundTaskUpdate = {
        taskId: 'other-task',
        resultId: 'other-task',
        resultType: 'VIDEO',
        status: 'completed',
      };
      eventHandlers['background-task-update']?.(wrongTaskEvent);

      // getResult should not have been called
      expect(getResult).not.toHaveBeenCalled();

      // Now send correct event
      const correctEvent: BackgroundTaskUpdate = {
        taskId: 'test-123',
        resultType: 'VIDEO',
        status: 'completed',
      };
      eventHandlers['background-task-update']?.(correctEvent);

      const result = await promise;
      expect(result.result).toEqual(mockResult);
    });

    it('ignores events for different task types', async () => {
      const mockResult = { id: 'test-123', status: 'completed' };
      const getResult = vi.fn().mockResolvedValue(mockResult);

      const eventHandlers: Record<string, (data: unknown) => void> = {};
      mockSocket.on.mockImplementation((event: string, handler: (data: unknown) => void) => {
        eventHandlers[event] = handler;
        return mockSocket;
      });

      const promise = waitForCompletion({
        taskId: 'test-123',
        taskType: 'VIDEO',
        getResult,
        timeout: 5000,
      });

      await vi.advanceTimersByTimeAsync(0);
      eventHandlers.connect?.({});

      // Send IMAGE event for same ID - should be ignored
      const wrongTypeEvent: BackgroundTaskUpdate = {
        taskId: 'test-123',
        resultType: 'IMAGE',
        status: 'completed',
      };
      eventHandlers['background-task-update']?.(wrongTypeEvent);

      expect(getResult).not.toHaveBeenCalled();

      // Now send correct type
      const correctEvent: BackgroundTaskUpdate = {
        taskId: 'test-123',
        resultType: 'VIDEO',
        status: 'completed',
      };
      eventHandlers['background-task-update']?.(correctEvent);

      const result = await promise;
      expect(result.result).toEqual(mockResult);
    });

    it('times out after specified duration', async () => {
      const getResult = vi.fn();

      const eventHandlers: Record<string, (data: unknown) => void> = {};
      mockSocket.on.mockImplementation((event: string, handler: (data: unknown) => void) => {
        eventHandlers[event] = handler;
        return mockSocket;
      });

      const promise = waitForCompletion({
        taskId: 'test-timeout',
        taskType: 'VIDEO',
        getResult,
        timeout: 5000,
      });

      await vi.advanceTimersByTimeAsync(0);
      eventHandlers.connect?.({});

      // Advance past timeout
      vi.advanceTimersByTimeAsync(6000);

      await expect(promise).rejects.toThrow('Operation timed out');
      expect(mockSocket.disconnect).toHaveBeenCalled();
    });

    it('rejects on connection error', async () => {
      const getResult = vi.fn();

      const eventHandlers: Record<string, (data: unknown) => void> = {};
      mockSocket.on.mockImplementation((event: string, handler: (data: unknown) => void) => {
        eventHandlers[event] = handler;
        return mockSocket;
      });

      const promise = waitForCompletion({
        taskId: 'test-conn-error',
        taskType: 'IMAGE',
        getResult,
        timeout: 5000,
      });

      await vi.advanceTimersByTimeAsync(0);

      // Simulate connection error
      eventHandlers.connect_error?.({ message: 'Connection refused' });

      await expect(promise).rejects.toThrow('WebSocket connection failed: Connection refused');
      expect(mockSocket.disconnect).toHaveBeenCalled();
    });

    it('updates spinner with progress', async () => {
      const mockResult = { id: 'test-progress', status: 'completed' };
      const getResult = vi.fn().mockResolvedValue(mockResult);
      const spinner = { text: '' };

      const eventHandlers: Record<string, (data: unknown) => void> = {};
      mockSocket.on.mockImplementation((event: string, handler: (data: unknown) => void) => {
        eventHandlers[event] = handler;
        return mockSocket;
      });

      const promise = waitForCompletion({
        taskId: 'test-progress',
        taskType: 'VIDEO',
        getResult,
        spinner: spinner as Parameters<typeof waitForCompletion>[0]['spinner'],
        timeout: 10000,
      });

      await vi.advanceTimersByTimeAsync(0);
      eventHandlers.connect?.({});

      // Send progress update
      const progressEvent: BackgroundTaskUpdate = {
        taskId: 'test-progress',
        resultType: 'VIDEO',
        status: 'processing',
        progress: 50,
      };
      eventHandlers['background-task-update']?.(progressEvent);

      expect(spinner.text).toContain('50%');

      // Complete
      const completeEvent: BackgroundTaskUpdate = {
        taskId: 'test-progress',
        resultType: 'VIDEO',
        status: 'completed',
        progress: 100,
      };
      eventHandlers['background-task-update']?.(completeEvent);

      await promise;
    });

    it('handles ingredient-status events', async () => {
      const mockResult = { id: 'test-ingredient', status: 'completed' };
      const getResult = vi.fn().mockResolvedValue(mockResult);

      const eventHandlers: Record<string, (data: unknown) => void> = {};
      mockSocket.on.mockImplementation((event: string, handler: (data: unknown) => void) => {
        eventHandlers[event] = handler;
        return mockSocket;
      });

      const promise = waitForCompletion({
        taskId: 'test-ingredient',
        taskType: 'IMAGE',
        getResult,
        timeout: 5000,
      });

      await vi.advanceTimersByTimeAsync(0);
      eventHandlers.connect?.({});

      // Simulate ingredient-status event
      eventHandlers['/ingredients/test-ingredient/status']?.({ status: 'generated' });

      const result = await promise;
      expect(result.result).toEqual(mockResult);
    });
  });
});
