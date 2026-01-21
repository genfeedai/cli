import ora, { type Ora } from 'ora';

export interface PollOptions<T> {
  fn: () => Promise<T>;
  isComplete: (result: T) => boolean;
  isFailed?: (result: T) => boolean;
  getError?: (result: T) => string | undefined;
  interval?: number;
  timeout?: number;
  spinner?: Ora;
  onUpdate?: (result: T, elapsed: number) => void;
}

export interface PollResult<T> {
  result: T;
  elapsed: number;
}

export async function poll<T>(options: PollOptions<T>): Promise<PollResult<T>> {
  const {
    fn,
    isComplete,
    isFailed = () => false,
    getError = () => undefined,
    interval = 2000,
    timeout = 300000,
    spinner,
    onUpdate,
  } = options;

  const startTime = Date.now();

  while (true) {
    const elapsed = Date.now() - startTime;

    if (elapsed > timeout) {
      throw new Error('Operation timed out');
    }

    const result = await fn();

    if (onUpdate) {
      onUpdate(result, elapsed);
    }

    if (isComplete(result)) {
      return { result, elapsed };
    }

    if (isFailed(result)) {
      const errorMessage = getError(result) ?? 'Operation failed';
      throw new Error(errorMessage);
    }

    if (spinner) {
      const elapsedSec = (elapsed / 1000).toFixed(1);
      spinner.text = `Generating... (${elapsedSec}s)`;
    }

    await sleep(interval);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createSpinner(text: string): Ora {
  return ora({
    text,
    spinner: 'dots',
  });
}
