import { input } from '@inquirer/prompts';
import chalk from 'chalk';
import { Command } from 'commander';
import ora from 'ora';
import { post, requireAuth } from '@/api/client.js';
import { print } from '@/ui/theme.js';
import { handleError } from '@/utils/errors.js';

interface AgentChatResponse {
  conversationId: string;
  message?: {
    content?: string;
    role?: string;
  };
}

export const chatCommand = new Command('chat')
  .description('Start an interactive agent chat session')
  .option('-c, --conversation <id>', 'Resume an existing conversation')
  .action(async (options) => {
    try {
      await requireAuth();

      let conversationId: string = options.conversation ?? '';

      print(chalk.dim('Type your message (Ctrl+C to exit)\n'));

      // Chat loop
      while (true) {
        const message = await input({
          message: chalk.cyan('You:'),
        });

        if (!message.trim()) continue;

        const spinner = ora('Thinking...').start();

        try {
          const response = await post<AgentChatResponse>('/agent/chat', {
            content: message,
            conversationId: conversationId || undefined,
            source: 'agent',
          });

          spinner.stop();
          conversationId = response.conversationId || conversationId;

          const assistantMessage = response.message?.content?.trim();
          if (assistantMessage) {
            print(`${chalk.green('\nAssistant:')} ${assistantMessage}\n`);
          } else {
            print(chalk.dim('\nMessage sent.\n'));
          }
        } catch (error) {
          spinner.fail('Failed to send message');
          throw error;
        }
      }
    } catch (error) {
      handleError(error);
    }
  });
