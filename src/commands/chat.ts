import { Command } from 'commander';
import { runAgentShell } from '@/shell/agent-shell.js';
import { handleError } from '@/utils/errors.js';

export const chatCommand = new Command('chat')
  .description('Start the interactive agent shell')
  .option('-t, --thread <id>', 'Resume an existing thread')
  .action(async (options) => {
    try {
      await runAgentShell({ initialThreadId: options.thread });
    } catch (error) {
      handleError(error);
    }
  });
