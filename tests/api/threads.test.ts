import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGet = vi.fn();
const mockPatch = vi.fn();
const mockPost = vi.fn();
const mockFlattenCollection = vi.fn();
const mockFlattenSingle = vi.fn();

vi.mock('../../src/api/client.js', () => ({
  get: (...args: unknown[]) => mockGet(...args),
  patch: (...args: unknown[]) => mockPatch(...args),
  post: (...args: unknown[]) => mockPost(...args),
}));

vi.mock('../../src/api/json-api.js', () => ({
  flattenCollection: (...args: unknown[]) => mockFlattenCollection(...args),
  flattenSingle: (...args: unknown[]) => mockFlattenSingle(...args),
}));

describe('api/threads', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts stream chat with threadId as the canonical field', async () => {
    mockPost.mockResolvedValue({
      runId: 'run-1',
      startedAt: '2026-03-12T00:00:00.000Z',
      threadId: 'thread-1',
    });

    const { startAgentChatStream } = await import('../../src/api/threads.js');
    await startAgentChatStream('hello', 'thread-1');

    expect(mockPost).toHaveBeenCalledWith('/agent/chat/stream', {
      content: 'hello',
      source: 'agent',
      threadId: 'thread-1',
    });
  });

  it('archives threads through the threads collection endpoint', async () => {
    mockPatch.mockResolvedValue({ data: { id: 'thread-1' } });
    mockFlattenSingle.mockReturnValue({ id: 'thread-1', status: 'archived' });

    const { archiveThread } = await import('../../src/api/threads.js');
    const result = await archiveThread('thread-1');

    expect(mockPatch).toHaveBeenCalledWith('/threads/thread-1', {
      status: 'archived',
    });
    expect(result).toEqual({ id: 'thread-1', status: 'archived' });
  });
});
