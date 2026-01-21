import chalk from 'chalk';

export class GenfeedError extends Error {
  constructor(
    message: string,
    public suggestion?: string
  ) {
    super(message);
    this.name = 'GenfeedError';
  }
}

export class AuthError extends GenfeedError {
  constructor(message = 'Not authenticated') {
    super(message, 'Run `genfeed login` to authenticate');
    this.name = 'AuthError';
  }
}

export class ApiError extends GenfeedError {
  constructor(
    message: string,
    public statusCode?: number,
    suggestion?: string
  ) {
    super(message, suggestion);
    this.name = 'ApiError';
  }
}

export class NoBrandError extends GenfeedError {
  constructor() {
    super('No brand selected', 'Run `genfeed brands select` to choose a brand');
    this.name = 'NoBrandError';
  }
}

export function formatError(error: unknown): string {
  if (error instanceof GenfeedError) {
    let output = chalk.red(`✖ ${error.message}`);
    if (error.suggestion) {
      output += `\n  ${chalk.dim(error.suggestion)}`;
    }
    return output;
  }

  if (error instanceof Error) {
    return chalk.red(`✖ ${error.message}`);
  }

  return chalk.red('✖ An unknown error occurred');
}

export function handleError(error: unknown): never {
  console.error(formatError(error));
  process.exit(1);
}
