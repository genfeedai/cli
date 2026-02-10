#!/usr/bin/env node
import { createInterface } from 'node:readline/promises';
import chalk from 'chalk';
import { Command } from 'commander';
import { brandsCommand } from './commands/brands.js';
import { captionCommand } from './commands/caption.js';
import { chatCommand } from './commands/chat.js';
import { darkroomCommand } from './commands/darkroom.js';
import { datasetCommand } from './commands/dataset.js';
import { generateCommand } from './commands/generate/index.js';
import { libraryCommand } from './commands/library.js';
import { loginCommand } from './commands/login.js';
import { logoutCommand } from './commands/logout.js';
import { personasCommand } from './commands/personas.js';
import { profileCommand } from './commands/profile.js';
import { publishCommand } from './commands/publish.js';
import { statusCommand } from './commands/status.js';
import { trainCommand } from './commands/train.js';
import { whoamiCommand } from './commands/whoami.js';
import { workflowCommand } from './commands/workflow.js';
import { getRole } from './config/store.js';

const BANNER = chalk.hex('#7C3AED').bold(`
     ██████  ███████
    ██       ██
    ██   ███ █████
    ██    ██ ██
     ██████  ██
`);

const program = new Command();

// --- User commands (visible to all) ---
program
  .name('gf')
  .description('Unified CLI for Genfeed.ai')
  .version('0.2.0')
  .addCommand(loginCommand)
  .addCommand(logoutCommand)
  .addCommand(whoamiCommand)
  .addCommand(brandsCommand)
  .addCommand(generateCommand)
  .addCommand(statusCommand)
  .addCommand(chatCommand)
  .addCommand(workflowCommand)
  .addCommand(publishCommand)
  .addCommand(libraryCommand)
  .addCommand(profileCommand);

// --- Admin commands (hidden from --help for regular users) ---
program
  .addCommand(darkroomCommand)
  .addCommand(trainCommand)
  .addCommand(personasCommand)
  .addCommand(captionCommand)
  .addCommand(datasetCommand);

// Prevent Commander from calling process.exit() — we handle exits ourselves
program.exitOverride();

async function printBanner(): Promise<void> {
  console.log(BANNER);
  console.log(chalk.dim('  Unified CLI for Genfeed.ai'));

  const role = await getRole();
  if (role === 'admin') {
    console.log(chalk.dim('  Mode: ') + chalk.green('admin'));
  }
  console.log();
}

async function printHelp(): Promise<void> {
  const role = await getRole();

  console.log(chalk.bold('User Commands:\n'));
  console.log('  login          Authenticate with your Genfeed API key');
  console.log('  logout         Remove stored credentials');
  console.log('  whoami         Show current user and organization');
  console.log('  brands         Manage brands');
  console.log('  generate       Generate AI content (image, video)');
  console.log('  status         Check the status of a generation job');
  console.log('  chat           Start an interactive agent chat session');
  console.log('  workflow       Manage and execute workflows');
  console.log('  publish        Publish content to social media');
  console.log('  library        Browse content library');
  console.log('  profile        Manage CLI profiles');

  if (role === 'admin') {
    console.log();
    console.log(chalk.bold('Admin Commands:\n'));
    console.log('  darkroom       Darkroom infrastructure (health, comfy, loras)');
    console.log('  train          LoRA training (start, status)');
    console.log('  personas       List and manage personas');
    console.log('  caption        Run Florence-2 auto-captioning');
    console.log('  dataset        Manage training datasets');
  }

  console.log();
  console.log(chalk.dim('  Run `gf <command> --help` for command details'));
  console.log(chalk.dim('  Run `gf` with no args for interactive mode'));
}

// --- Interactive REPL ---
async function startRepl(): Promise<void> {
  await printBanner();
  await printHelp();
  console.log();

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const prompt = chalk.hex('#7C3AED')('gf') + chalk.dim(' > ');

  while (true) {
    let line: string;
    try {
      line = await rl.question(prompt);
    } catch {
      // EOF or Ctrl+C
      break;
    }

    const trimmed = line.trim();
    if (!trimmed) continue;

    // Exit commands
    if (trimmed === 'exit' || trimmed === 'quit' || trimmed === 'q') {
      console.log(chalk.dim('Goodbye!'));
      break;
    }

    // Help
    if (trimmed === 'help' || trimmed === '?') {
      await printHelp();
      continue;
    }

    // Strip leading / for REPL slash-command style
    const input = trimmed.startsWith('/') ? trimmed.slice(1) : trimmed;

    // Parse and execute as a gf command
    const args = parseReplInput(input);

    try {
      await program.parseAsync(args, { from: 'user' });
    } catch (error) {
      if (error instanceof Error) {
        const code = 'code' in error ? (error as { code: string }).code : '';
        // Swallow Commander's help/version exits — they already printed output
        if (code === 'commander.helpDisplayed' || code === 'commander.version') {
          continue;
        }
        if (error.message.includes('unknown command') || code === 'commander.unknownCommand') {
          console.log(chalk.red(`Unknown command: ${args[0]}`));
          console.log(chalk.dim('Type `help` to see available commands'));
        } else {
          console.error(chalk.red(`Error: ${error.message}`));
        }
      }
    }

    console.log(); // Spacing between commands
  }

  rl.close();
  process.exit(0);
}

/**
 * Parse REPL input into argv-style array.
 * Handles quoted strings: /generate image "a beach photo of quincy"
 */
function parseReplInput(input: string): string[] {
  const args: string[] = [];
  let current = '';
  let inQuote = false;
  let quoteChar = '';

  for (const char of input) {
    if (inQuote) {
      if (char === quoteChar) {
        inQuote = false;
        if (current) {
          args.push(current);
          current = '';
        }
      } else {
        current += char;
      }
    } else if (char === '"' || char === "'") {
      inQuote = true;
      quoteChar = char;
    } else if (char === ' ' || char === '\t') {
      if (current) {
        args.push(current);
        current = '';
      }
    } else {
      current += char;
    }
  }

  if (current) args.push(current);
  return args;
}

// --- Main ---
if (process.argv.length <= 2) {
  // No command provided — launch interactive REPL
  startRepl().catch((error) => {
    console.error(chalk.red(`Fatal: ${error instanceof Error ? error.message : String(error)}`));
    process.exit(1);
  });
} else {
  // Direct command execution: gf <command> [args]
  program.parseAsync().catch((error) => {
    if (error instanceof Error && 'code' in error) {
      // Commander error (help, version, unknown command)
      const code = (error as { code: string }).code;
      if (code === 'commander.helpDisplayed' || code === 'commander.version') {
        process.exit(0);
      }
    }
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
    process.exit(1);
  });
}
