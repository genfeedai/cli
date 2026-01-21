#!/usr/bin/env node
import chalk from 'chalk';
import { Command } from 'commander';
import { brandsCommand } from './commands/brands.js';
import { generateCommand } from './commands/generate/index.js';
import { loginCommand } from './commands/login.js';
import { logoutCommand } from './commands/logout.js';
import { statusCommand } from './commands/status.js';
import { whoamiCommand } from './commands/whoami.js';

const program = new Command();

program
  .name('genfeed')
  .description('CLI for Genfeed.ai - Generate AI images and videos from your terminal')
  .version('0.1.0')
  .addCommand(loginCommand)
  .addCommand(logoutCommand)
  .addCommand(whoamiCommand)
  .addCommand(brandsCommand)
  .addCommand(generateCommand)
  .addCommand(statusCommand);

// Show help by default if no command provided
if (process.argv.length === 2) {
  console.log(
    chalk.hex('#7C3AED').bold(`
   ____             __              _
  / ___| ___ _ __  / _| ___  ___  __| |
 | |  _ / _ \\ '_ \\| |_ / _ \\/ _ \\/ _\` |
 | |_| |  __/ | | |  _|  __/  __/ (_| |
  \\____|\\___|_| |_|_|  \\___|\\___|\\__,_|
`)
  );
  console.log(chalk.dim('  Generate AI images and videos from your terminal\n'));
  program.outputHelp();
} else {
  program.parse();
}
