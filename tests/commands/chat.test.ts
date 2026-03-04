import { beforeEach, describe, expect, it, vi } from 'vitest';
import { runChatAction } from '../../src/commands/chat.js';

const mockInput = vi.fn<() => Promise<string>>();
const mockPost = vi.fn();
const mockRequireAuth = vi.fn();
const mockPrint = vi.fn();
const mockHandleError = vi.fn();

vi.mock('@inquirer/prompts', () => ({
  input: () => mockInput(),
}));

vi.mock('../../src/api/client.js', () => ({
  post: (...args: unknown[]) => mockPost(...args),
  requireAuth: () => mockRequireAuth(),
}));

vi.mock('../../src/ui/theme.js', () => ({
  print: (...args: unknown[]) => mockPrint(...args),
}));

vi.mock('../../src/utils/errors.js', () => ({
  handleError: (...args: unknown[]) => mockHandleError(...args),
}));

describe('commands/chat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockResolvedValue('test-key');
  });

  it('sends one-shot message with model and source', async () => {
    mockPost.mockResolvedValue({
      conversationId: 'conv-1',
      message: { content: 'Hello back' },
    });

    await runChatAction({
      message: 'hello',
      model: 'deepseek/deepseek-chat',
      source: 'agent',
    });

    expect(mockPost).toHaveBeenCalledWith('/agent/chat', {
      content: 'hello',
      conversationId: undefined,
      model: 'deepseek/deepseek-chat',
      source: 'agent',
    });
    expect(mockInput).not.toHaveBeenCalled();
  });

  it('reuses returned conversation id in interactive mode', async () => {
    mockInput
      .mockResolvedValueOnce('first message')
      .mockResolvedValueOnce('second message')
      .mockRejectedValueOnce(
        Object.assign(new Error('User force closed the prompt'), {
          name: 'ExitPromptError',
        })
      );

    mockPost
      .mockResolvedValueOnce({
        conversationId: 'conv-42',
        message: { content: 'First response' },
      })
      .mockResolvedValueOnce({
        conversationId: 'conv-42',
        message: { content: 'Second response' },
      });

    await runChatAction({});

    expect(mockPost).toHaveBeenNthCalledWith(1, '/agent/chat', {
      content: 'first message',
      conversationId: undefined,
      model: undefined,
      source: 'agent',
    });
    expect(mockPost).toHaveBeenNthCalledWith(2, '/agent/chat', {
      content: 'second message',
      conversationId: 'conv-42',
      model: undefined,
      source: 'agent',
    });
  });

  it('exits gracefully when prompt is closed', async () => {
    mockInput.mockRejectedValueOnce(
      Object.assign(new Error('User force closed the prompt'), {
        name: 'ExitPromptError',
      })
    );

    await runChatAction({});

    expect(mockHandleError).not.toHaveBeenCalled();
    expect(mockPost).not.toHaveBeenCalled();
  });
});
