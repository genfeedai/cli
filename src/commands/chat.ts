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

interface ChatCommandOptions {
  conversation?: string;
  message?: string;
  model?: string;
  source?: 'agent' | 'proactive' | 'onboarding';
}

function isPromptExitError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  return (
    error.name === 'ExitPromptError' ||
    error.message.includes('User force closed the prompt') ||
    error.message.includes('SIGINT')
  );
}

export async function runChatAction(options: ChatCommandOptions): Promise<void> {
  await requireAuth();

  let conversationId: string = options.conversation ?? '';
  const source = options.source ?? 'agent';

  async function sendMessage(message: string): Promise<void> {
    const response = await post<AgentChatResponse>('/agent/chat', {
      content: message,
      conversationId: conversationId || undefined,
      model: options.model,
      source,
    });

    conversationId = response.conversationId || conversationId;

    const assistantMessage = response.message?.content?.trim();
    if (assistantMessage) {
      print(`${chalk.green('\nAssistant:')} ${assistantMessage}\n`);
      return;
    }

    print(chalk.dim('\nMessage sent.\n'));
  }

  if (options.message?.trim()) {
    const spinner = ora('Thinking...').start();
    try {
      await sendMessage(options.message.trim());
      spinner.stop();
      return;
    } catch (error) {
      spinner.fail('Failed to send message');
      throw error;
    }
  }

  print(chalk.dim('Type your message (Ctrl+C to exit)\n'));

  while (true) {
    let message: string;
    try {
      message = await input({
        message: chalk.cyan('You:'),
      });
    } catch (error) {
      if (isPromptExitError(error)) {
        print(chalk.dim('\nChat ended.'));
        break;
      }
      throw error;
    }

    if (!message.trim()) continue;

    const spinner = ora('Thinking...').start();

    try {
      await sendMessage(message.trim());
      spinner.stop();
    } catch (error) {
      spinner.fail('Failed to send message');
      throw error;
    }
  }
}

export const chatCommand = new Command('chat')
  .description('Start an interactive agent chat session')
  .option('-c, --conversation <id>', 'Resume an existing conversation')
  .option('-m, --message <text>', 'Send a single message and exit')
  .option('--model <id>', 'Model ID (e.g. deepseek/deepseek-chat)')
  .option('--source <source>', 'Agent source: agent | proactive | onboarding', 'agent')
  .action(async (options) => {
    try {
      await runChatAction(options);
    } catch (error) {
      handleError(error);
    }
  });
