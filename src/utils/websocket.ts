import type { Ora } from 'ora';
import { io, type Socket } from 'socket.io-client';
import { getApiKey, getApiUrl } from '../config/store.js';

export interface BackgroundTaskUpdate {
  taskId: string;
  activityId?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  resultId?: string;
  resultType?: 'IMAGE' | 'VIDEO' | 'MUSIC';
  error?: string;
  label?: string;
  timestamp?: string;
}

export interface WaitForCompletionOptions<T> {
  taskId: string;
  taskType: 'IMAGE' | 'VIDEO';
  getResult: () => Promise<T>;
  spinner?: Ora;
  timeout?: number;
}

export interface WaitResult<T> {
  result: T;
  elapsed: number;
}

function getWebSocketUrl(): string {
  const apiUrl = getApiUrl();
  // Convert API URL to WebSocket URL
  // https://api.genfeed.ai/v1 -> https://api.genfeed.ai
  return apiUrl.replace(/\/v\d+$/, '');
}

export async function waitForCompletion<T>(
  options: WaitForCompletionOptions<T>
): Promise<WaitResult<T>> {
  const { taskId, taskType, getResult, spinner, timeout = 600000 } = options;

  const startTime = Date.now();
  const apiKey = getApiKey();
  const wsUrl = getWebSocketUrl();

  return new Promise((resolve, reject) => {
    let socket: Socket | null = null;
    let timeoutId: NodeJS.Timeout | null = null;
    let resolved = false;

    const cleanup = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      if (socket) {
        socket.disconnect();
        socket = null;
      }
    };

    const handleCompletion = async (status: 'completed' | 'failed', error?: string) => {
      if (resolved) return;
      resolved = true;
      cleanup();

      const elapsed = Date.now() - startTime;

      if (status === 'failed') {
        reject(new Error(error ?? 'Generation failed'));
        return;
      }

      try {
        const result = await getResult();
        resolve({ result, elapsed });
      } catch (err) {
        reject(err);
      }
    };

    // Set up timeout
    timeoutId = setTimeout(() => {
      if (resolved) return;
      resolved = true;
      cleanup();
      reject(new Error('Operation timed out'));
    }, timeout);

    // Connect to WebSocket
    socket = io(wsUrl, {
      auth: {
        token: apiKey,
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      if (spinner) {
        spinner.text = 'Connected, waiting for generation...';
      }
    });

    socket.on('connect_error', (err) => {
      // If WebSocket fails, we could fall back to polling
      // For now, just reject
      if (!resolved) {
        resolved = true;
        cleanup();
        reject(new Error(`WebSocket connection failed: ${err.message}`));
      }
    });

    // Listen for background task updates
    socket.on('background-task-update', (data: BackgroundTaskUpdate) => {
      // Filter for our specific task
      if (data.resultId !== taskId && data.taskId !== taskId) {
        return;
      }

      // Check if it's the right type
      if (data.resultType && data.resultType !== taskType) {
        return;
      }

      // Update spinner with progress
      if (spinner && data.progress !== undefined) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        spinner.text = `Generating... ${data.progress}% (${elapsed}s)`;
      }

      // Handle completion
      if (data.status === 'completed') {
        handleCompletion('completed');
      } else if (data.status === 'failed') {
        handleCompletion('failed', data.error);
      }
    });

    // Also listen for ingredient-status updates (alternative event)
    socket.on(`/ingredients/${taskId}/status`, (data: { status: string; error?: string }) => {
      if (data.status === 'completed' || data.status === 'generated') {
        handleCompletion('completed');
      } else if (data.status === 'failed') {
        handleCompletion('failed', data.error);
      }
    });

    socket.on('disconnect', (reason) => {
      if (!resolved && reason !== 'io client disconnect') {
        // Unexpected disconnect - could implement reconnection logic here
        if (spinner) {
          spinner.text = 'Reconnecting...';
        }
      }
    });
  });
}

export function createWebSocketConnection(): Socket {
  const apiKey = getApiKey();
  const wsUrl = getWebSocketUrl();

  return io(wsUrl, {
    auth: {
      token: apiKey,
    },
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });
}
