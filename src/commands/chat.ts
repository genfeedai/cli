import { input } from '@inquirer/prompts';
import chalk from 'chalk';
import { Command } from 'commander';
import ora from 'ora';
import { post, requireAuth } from '../api/client.js';
import { handleError } from '../utils/errors.js';

interface AgentConversation {
  _id: string;
  title: string;
  source: string;
}

interface AgentMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface AgentMessageResponse {
  messages: AgentMessage[];
}

export const chatCommand = new Command('chat')
  .description('Start an interactive agent chat session')
  .option('-c, --conversation <id>', 'Resume an existing conversation')
  .action(async (options) => {
    try {
      await requireAuth();

      let conversationId: string = options.conversation ?? '';

      // Create new conversation if none provided
      if (!conversationId) {
        const spinner = ora('Starting new conversation...').start();
        try {
          const conversation = await post<AgentConversation>('/v1/agent-conversations', {
            source: 'cli',
            title: 'CLI Chat',
          });
          conversationId = conversation._id;
          spinner.succeed('Conversation started');
        } catch (error) {
          spinner.fail('Failed to start conversation');
          throw error;
        }
      }

      console.log(chalk.dim('Type your message (Ctrl+C to exit)\n'));

      // Chat loop
      while (true) {
        const message = await input({
          message: chalk.cyan('You:'),
        });

        if (!message.trim()) continue;

        const spinner = ora('Thinking...').start();

        try {
          const response = await post<AgentMessageResponse>(
            `/v1/agent-conversations/${conversationId}/messages`,
            { content: message, role: 'user' }
          );

          spinner.stop();

          // Display the latest assistant message
          const messages = response.messages ?? [];
          const lastMessage = messages[messages.length - 1];
          if (lastMessage && lastMessage.role === 'assistant') {
            console.log(chalk.green('\nAssistant:'), lastMessage.content, '\n');
          } else {
            console.log(chalk.dim('\nMessage sent.\n'));
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
