import chalk from 'chalk';

export const colors = {
  primary: chalk.hex('#7C3AED'),
  success: chalk.green,
  error: chalk.red,
  warning: chalk.yellow,
  info: chalk.blue,
  dim: chalk.dim,
  bold: chalk.bold,
};

export const symbols = {
  success: chalk.green('✓'),
  error: chalk.red('✖'),
  warning: chalk.yellow('⚠'),
  info: chalk.blue('ℹ'),
  arrow: chalk.dim('→'),
  bullet: chalk.dim('•'),
};

export function formatSuccess(message: string): string {
  return `${symbols.success} ${message}`;
}

export function formatError(message: string): string {
  return `${symbols.error} ${message}`;
}

export function formatWarning(message: string): string {
  return `${symbols.warning} ${message}`;
}

export function formatInfo(message: string): string {
  return `${symbols.info} ${message}`;
}

export function formatLabel(label: string, value: string): string {
  return `  ${colors.dim(`${label}:`)} ${value}`;
}

export function formatHeader(text: string): string {
  return colors.bold(text);
}
