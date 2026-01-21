import { select } from '@inquirer/prompts';
import chalk from 'chalk';
import { Command } from 'commander';
import ora from 'ora';
import { getBrand, listBrands } from '../api/brands.js';
import { requireAuth } from '../api/client.js';
import { getActiveBrand, setActiveBrand } from '../config/store.js';
import { formatLabel, formatSuccess } from '../ui/theme.js';
import { GenfeedError, handleError } from '../utils/errors.js';

export const brandsCommand = new Command('brands')
  .description('Manage brands')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    try {
      await requireAuth();

      const spinner = ora('Fetching brands...').start();
      const brands = await listBrands();
      spinner.stop();

      const activeBrandId = getActiveBrand();

      if (options.json) {
        console.log(
          JSON.stringify(
            {
              brands: brands.map((b) => ({
                id: b.id,
                name: b.name,
                description: b.description,
                active: b.id === activeBrandId,
              })),
              activeBrandId,
            },
            null,
            2
          )
        );
        return;
      }

      if (brands.length === 0) {
        console.log(chalk.yellow('No brands found.'));
        console.log(chalk.dim('Create one at https://app.genfeed.ai'));
        return;
      }

      console.log(chalk.bold('Your brands:\n'));

      for (const brand of brands) {
        const isActive = brand.id === activeBrandId;
        const marker = isActive ? chalk.green('●') : chalk.dim('○');
        const name = isActive ? chalk.bold(brand.name) : brand.name;
        const activeLabel = isActive ? chalk.dim(' (active)') : '';

        console.log(`  ${marker} ${name}${activeLabel}`);
        if (brand.description) {
          console.log(`    ${chalk.dim(brand.description)}`);
        }
      }

      console.log();
      console.log(chalk.dim('Run `genfeed brands select` to change the active brand'));
    } catch (error) {
      handleError(error);
    }
  });

brandsCommand
  .command('select')
  .description('Select the active brand')
  .action(async () => {
    try {
      await requireAuth();

      const spinner = ora('Fetching brands...').start();
      const brands = await listBrands();
      spinner.stop();

      if (brands.length === 0) {
        throw new GenfeedError('No brands found', 'Create a brand at https://app.genfeed.ai');
      }

      const activeBrandId = getActiveBrand();

      const selected = await select({
        message: 'Select a brand:',
        choices: brands.map((brand) => ({
          name: brand.id === activeBrandId ? `${brand.name} (current)` : brand.name,
          value: brand.id,
          description: brand.description,
        })),
        default: activeBrandId,
      });

      setActiveBrand(selected);
      const selectedBrand = brands.find((b) => b.id === selected);

      console.log();
      console.log(formatSuccess(`Active brand: ${chalk.bold(selectedBrand?.name)}`));
    } catch (error) {
      handleError(error);
    }
  });

brandsCommand
  .command('current')
  .description('Show the current active brand')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    try {
      await requireAuth();

      const activeBrandId = getActiveBrand();

      if (!activeBrandId) {
        if (options.json) {
          console.log(JSON.stringify({ activeBrand: null }, null, 2));
          return;
        }
        console.log(chalk.yellow('No active brand selected'));
        console.log(chalk.dim('Run `genfeed brands select` to choose a brand'));
        return;
      }

      const spinner = ora('Fetching brand...').start();
      const brand = await getBrand(activeBrandId);
      spinner.stop();

      if (options.json) {
        console.log(
          JSON.stringify(
            {
              activeBrand: {
                id: brand.id,
                name: brand.name,
                description: brand.description,
              },
            },
            null,
            2
          )
        );
        return;
      }

      console.log(formatSuccess(`Active brand: ${chalk.bold(brand.name)}`));
      if (brand.description) {
        console.log(formatLabel('Description', brand.description));
      }
    } catch (error) {
      handleError(error);
    }
  });
