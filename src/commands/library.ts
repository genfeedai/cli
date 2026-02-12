import chalk from 'chalk';
import { Command } from 'commander';
import ora from 'ora';
import { get, requireAuth } from '../api/client.js';
import { handleError } from '../utils/errors.js';

interface Ingredient {
  _id: string;
  category: string;
  status: string;
  prompt?: {
    text?: string;
  };
}

interface IngredientListResponse {
  data: Ingredient[];
}

export const libraryCommand = new Command('library')
  .description('Browse content library')
  .option('-t, --type <type>', 'Filter by type (image, video, music, avatar)')
  .option('-l, --limit <limit>', 'Max items to show', '20')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    try {
      await requireAuth();

      const spinner = ora('Fetching library...').start();

      try {
        const params = new URLSearchParams();
        if (options.type) params.set('category', options.type);
        params.set('limit', options.limit);

        const response = await get<IngredientListResponse>(`/v1/ingredients?${params.toString()}`);
        spinner.stop();

        const items = response.data ?? [];
        if (items.length === 0) {
          console.log(chalk.dim('No items found.'));
          return;
        }

        if (options.json) {
          console.log(JSON.stringify(items, null, 2));
          return;
        }

        console.log(chalk.bold(`\nLibrary (${items.length} items):\n`));

        for (const item of items) {
          const category = chalk.blue(`[${item.category}]`);
          const status =
            item.status === 'generated' ? chalk.green(item.status) : chalk.dim(item.status);
          const id = chalk.dim(`(${item._id})`);

          console.log(`  ${category} ${status} ${id}`);
          if (item.prompt?.text) {
            console.log(`  ${chalk.dim(item.prompt.text.slice(0, 80))}...`);
          }
          console.log();
        }
      } catch (error) {
        spinner.fail('Failed to fetch library');
        throw error;
      }
    } catch (error) {
      handleError(error);
    }
  });
