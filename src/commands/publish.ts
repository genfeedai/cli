import { checkbox, input } from '@inquirer/prompts';
import chalk from 'chalk';
import { Command } from 'commander';
import ora from 'ora';
import { post, requireAuth } from '../api/client.js';
import { formatSuccess } from '../ui/theme.js';
import { handleError } from '../utils/errors.js';

interface PublishResponse {
  _id: string;
}

export const publishCommand = new Command('publish')
  .description('Publish content to social media platforms')
  .argument('<ingredientId>', 'ID of the content to publish')
  .option('-p, --platforms <platforms>', 'Comma-separated platforms (twitter,instagram,linkedin)')
  .option('-c, --caption <caption>', 'Post caption')
  .action(async (ingredientId, options) => {
    try {
      await requireAuth();

      let platforms: string[] = options.platforms?.split(',') ?? [];

      // Interactive platform selection if none provided
      if (platforms.length === 0) {
        platforms = await checkbox({
          choices: [
            { name: 'Twitter', value: 'twitter' },
            { name: 'Instagram', value: 'instagram' },
            { name: 'LinkedIn', value: 'linkedin' },
            { name: 'TikTok', value: 'tiktok' },
            { name: 'YouTube', value: 'youtube' },
            { name: 'Pinterest', value: 'pinterest' },
          ],
          message: 'Select platforms to publish to:',
        });
      }

      if (platforms.length === 0) {
        console.log(chalk.yellow('No platforms selected.'));
        return;
      }

      let caption: string = options.caption ?? '';
      if (!caption) {
        caption = await input({
          message: 'Post caption (optional):',
        });
      }

      const spinner = ora(`Publishing to ${platforms.join(', ')}...`).start();

      try {
        await post<PublishResponse>('/v1/posts', {
          caption,
          ingredientId,
          platforms,
        });
        spinner.stop();
        console.log(formatSuccess(`Published to ${platforms.join(', ')}`));
      } catch (error) {
        spinner.fail('Failed to publish');
        throw error;
      }
    } catch (error) {
      handleError(error);
    }
  });
