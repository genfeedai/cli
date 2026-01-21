import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createSpinner, poll } from '../../src/utils/polling.js';

// Mock ora
vi.mock('ora', () => ({
  default: (options: { text: string }) => ({
    text: options.text,
    start: vi.fn().mockReturnThis(),
    stop: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis(),
  }),
}));

describe('utils/polling', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('poll', () => {
    it('returns immediately when condition is met', async () => {
      const fn = vi.fn().mockResolvedValue({ status: 'complete' });
      const isComplete = (result: { status: string }) => result.status === 'complete';

      const pollPromise = poll({ fn, isComplete });
      await vi.runAllTimersAsync();

      const result = await pollPromise;
      expect(result.result).toEqual({ status: 'complete' });
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('polls until condition is met', async () => {
      let callCount = 0;
      const fn = vi.fn().mockImplementation(async () => {
        callCount++;
        return { status: callCount >= 3 ? 'complete' : 'pending' };
      });
      const isComplete = (result: { status: string }) => result.status === 'complete';

      const pollPromise = poll({ fn, isComplete, interval: 1000 });

      // First call
      await vi.advanceTimersByTimeAsync(0);

      // Second call after interval
      await vi.advanceTimersByTimeAsync(1000);

      // Third call after interval
      await vi.advanceTimersByTimeAsync(1000);

      const result = await pollPromise;
      expect(result.result.status).toBe('complete');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('throws on timeout', async () => {
      const fn = vi.fn().mockResolvedValue({ status: 'pending' });
      const isComplete = () => false;

      const pollPromise = poll({
        fn,
        isComplete,
        timeout: 5000,
        interval: 1000,
      });

      // Advance past timeout and expect rejection together
      const advancePromise = vi.advanceTimersByTimeAsync(6000);
      await expect(pollPromise).rejects.toThrow('Operation timed out');
      await advancePromise;
    });

    it('throws when isFailed returns true', async () => {
      const fn = vi.fn().mockResolvedValue({ status: 'error' });
      const isComplete = () => false;
      const isFailed = (result: { status: string }) => result.status === 'error';

      const pollPromise = poll({ fn, isComplete, isFailed });
      vi.runAllTimersAsync();

      await expect(pollPromise).rejects.toThrow('Operation failed');
    });

    it('throws custom error message from getError', async () => {
      const fn = vi.fn().mockResolvedValue({ status: 'error', message: 'Custom error' });
      const isComplete = () => false;
      const isFailed = (result: { status: string }) => result.status === 'error';
      const getError = (result: { message?: string }) => result.message;

      const pollPromise = poll({ fn, isComplete, isFailed, getError });
      vi.runAllTimersAsync();

      await expect(pollPromise).rejects.toThrow('Custom error');
    });

    it('calls onUpdate with result and elapsed time', async () => {
      let callCount = 0;
      const fn = vi.fn().mockImplementation(async () => {
        callCount++;
        return { status: callCount >= 2 ? 'complete' : 'pending', progress: callCount * 50 };
      });
      const isComplete = (result: { status: string }) => result.status === 'complete';
      const onUpdate = vi.fn();

      const pollPromise = poll({ fn, isComplete, onUpdate, interval: 1000 });

      await vi.advanceTimersByTimeAsync(0);
      expect(onUpdate).toHaveBeenCalledWith(
        { status: 'pending', progress: 50 },
        expect.any(Number)
      );

      await vi.advanceTimersByTimeAsync(1000);
      await pollPromise;

      expect(onUpdate).toHaveBeenCalledTimes(2);
    });

    it('updates spinner text during polling', async () => {
      let callCount = 0;
      const fn = vi.fn().mockImplementation(async () => {
        callCount++;
        return { status: callCount >= 3 ? 'complete' : 'pending' };
      });
      const isComplete = (result: { status: string }) => result.status === 'complete';
      const spinner = { text: 'Initial' };

      const pollPromise = poll({
        fn,
        isComplete,
        spinner: spinner as Parameters<typeof poll>[0]['spinner'],
        interval: 1000,
      });

      await vi.advanceTimersByTimeAsync(0);
      await vi.advanceTimersByTimeAsync(1000);

      expect(spinner.text).toContain('Generating');

      await vi.advanceTimersByTimeAsync(1000);
      await pollPromise;
    });

    it('uses default interval of 2000ms', async () => {
      let callCount = 0;
      const fn = vi.fn().mockImplementation(async () => {
        callCount++;
        return { status: callCount >= 2 ? 'complete' : 'pending' };
      });
      const isComplete = (result: { status: string }) => result.status === 'complete';

      const pollPromise = poll({ fn, isComplete });

      await vi.advanceTimersByTimeAsync(0);
      expect(fn).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(1000);
      expect(fn).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(1000);
      await pollPromise;
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('uses default timeout of 300000ms', async () => {
      const fn = vi.fn().mockResolvedValue({ status: 'pending' });
      const isComplete = () => false;

      // Use a large interval to minimize iterations
      const pollPromise = poll({ fn, isComplete, interval: 150000 });

      // Advance to just before timeout (300000ms) - only 2 iterations
      await vi.advanceTimersByTimeAsync(290000);
      expect(fn).toHaveBeenCalled();

      // Advance past timeout
      const advancePromise = vi.advanceTimersByTimeAsync(20000);
      await expect(pollPromise).rejects.toThrow('Operation timed out');
      await advancePromise;
    });

    it('returns elapsed time in result', async () => {
      const fn = vi.fn().mockResolvedValue({ status: 'complete' });
      const isComplete = () => true;

      const pollPromise = poll({ fn, isComplete });
      const result = await pollPromise;

      expect(result.elapsed).toBeGreaterThanOrEqual(0);
    });
  });

  describe('createSpinner', () => {
    it('creates spinner with text', () => {
      const spinner = createSpinner('Loading...');
      expect(spinner.text).toBe('Loading...');
    });
  });
});
