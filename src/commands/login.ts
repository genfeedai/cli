import { password, select } from '@inquirer/prompts';
import chalk from 'chalk';
import { Command } from 'commander';
import ora from 'ora';
import { validateApiKey } from '../api/auth.js';
import { listBrands } from '../api/brands.js';
import { setActiveBrand, setApiKey } from '../config/store.js';
import { formatLabel, formatSuccess } from '../ui/theme.js';
import { GenfeedError, handleError } from '../utils/errors.js';

export const loginCommand = new Command('login')
  .description('Authenticate with your Genfeed API key')
  .option('-k, --key <key>', 'API key (non-interactive)')
  .action(async (options) => {
    try {
      let apiKey: string;

      if (options.key) {
        apiKey = options.key;
      } else {
        console.log(chalk.dim('Get your API key at: https://app.genfeed.ai/settings/api-keys\n'));

        apiKey = await password({
          message: 'Enter your Genfeed API key:',
          mask: '*',
          validate: (value) => {
            if (!value) return 'API key is required';
            if (!value.startsWith('gf_')) return 'Invalid key format (should start with gf_)';
            return true;
          },
        });
      }

      // Validate the key format
      if (!apiKey.startsWith('gf_live_') && !apiKey.startsWith('gf_test_')) {
        throw new GenfeedError(
          'Invalid API key format',
          'API keys should start with gf_live_ or gf_test_'
        );
      }

      // Save the key first so API calls work
      setApiKey(apiKey);

      // Validate with the API
      const spinner = ora('Validating API key...').start();

      try {
        const whoami = await validateApiKey();
        spinner.succeed();

        console.log();
        console.log(formatSuccess(`Logged in as ${chalk.bold(whoami.organization.name)}`));
        console.log(formatLabel('Email', whoami.user.email));
        console.log(formatLabel('Scopes', whoami.scopes.join(', ')));

        // Fetch brands and prompt for selection
        console.log();
        const brands = await listBrands();

        if (brands.length === 0) {
          console.log(chalk.yellow('No brands found. Create one at https://app.genfeed.ai'));
        } else if (brands.length === 1) {
          setActiveBrand(brands[0].id);
          console.log(formatSuccess(`Active brand: ${chalk.bold(brands[0].name)}`));
        } else {
          const selected = await select({
            message: 'Select a brand:',
            choices: brands.map((brand) => ({
              name: brand.name,
              value: brand.id,
              description: brand.description,
            })),
          });

          setActiveBrand(selected);
          const selectedBrand = brands.find((b) => b.id === selected);
          console.log();
          console.log(formatSuccess(`Active brand: ${chalk.bold(selectedBrand?.name)}`));
        }
      } catch (error) {
        spinner.fail('Invalid API key');
        // Clear the invalid key
        setApiKey('');
        throw error;
      }
    } catch (error) {
      handleError(error);
    }
  });
