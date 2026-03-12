import chalk from 'chalk';
import { Command } from 'commander';
import { requireAuth } from '@/api/client.js';
import { listThreads } from '@/api/threads.js';
import { archiveThreadAndPrint, runAgentShell, showThreadSummary } from '@/shell/agent-shell.js';
import { formatHeader, formatLabel, print, printJson } from '@/ui/theme.js';
import { handleError } from '@/utils/errors.js';

export const threadsCommand = new Command('threads')
  .description('Inspect and resume agent threads')
  .addCommand(
    new Command('list')
      .description('List recent agent threads')
      .option('--status <status>', 'Filter by status (active, archived)')
      .option('--json', 'Output as JSON')
      .action(async (options) => {
        try {
          await requireAuth();
          const threads = await listThreads(options.status);

          if (options.json) {
            printJson(threads);
            return;
          }

          if (threads.length === 0) {
            print(chalk.dim('No threads found.'));
            return;
          }

          print(formatHeader('Threads\n'));
          for (const thread of threads) {
            const title = thread.title || thread.lastAssistantPreview || 'Untitled thread';
            print(`  ${chalk.cyan(title)} ${chalk.dim(`(${thread.id})`)}`);
            print(formatLabel('Status', thread.status ?? 'unknown'));
            if (thread.runStatus) {
              print(formatLabel('Run', thread.runStatus));
            }
            if (thread.lastAssistantPreview) {
              print(`  ${chalk.dim(thread.lastAssistantPreview)}`);
            }
            print(`  ${chalk.dim(`Resume: gf chat --thread ${thread.id}`)}`);
            print();
          }
        } catch (error) {
          handleError(error);
        }
      })
  )
  .addCommand(
    new Command('show')
      .description('Show thread details')
      .argument('<threadId>', 'Thread ID')
      .action(async (threadId) => {
        try {
          await requireAuth();
          await showThreadSummary(threadId);
        } catch (error) {
          handleError(error);
        }
      })
  )
  .addCommand(
    new Command('resume')
      .description('Resume a thread in the interactive agent shell')
      .argument('<threadId>', 'Thread ID')
      .action(async (threadId) => {
        try {
          await runAgentShell({ initialThreadId: threadId });
        } catch (error) {
          handleError(error);
        }
      })
  )
  .addCommand(
    new Command('archive')
      .description('Archive a thread')
      .argument('<threadId>', 'Thread ID')
      .action(async (threadId) => {
        try {
          await requireAuth();
          await archiveThreadAndPrint(threadId);
        } catch (error) {
          handleError(error);
        }
      })
  );
