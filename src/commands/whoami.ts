import chalk from 'chalk';
import { Command } from 'commander';
import ora from 'ora';
import { whoami } from '../api/auth.js';
import { getBrand } from '../api/brands.js';
import { requireAuth } from '../api/client.js';
import { getActiveBrand } from '../config/store.js';
import { formatLabel, formatSuccess } from '../ui/theme.js';
import { handleError } from '../utils/errors.js';

export const whoamiCommand = new Command('whoami')
  .description('Show current user and organization')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    try {
      await requireAuth();

      const spinner = ora('Fetching user info...').start();
      const info = await whoami();
      spinner.stop();

      // Get active brand if set
      const activeBrandId = getActiveBrand();
      let activeBrand = null;
      if (activeBrandId) {
        try {
          activeBrand = await getBrand(activeBrandId);
        } catch {
          // Brand may have been deleted
        }
      }

      if (options.json) {
        console.log(
          JSON.stringify(
            {
              user: info.user,
              organization: info.organization,
              scopes: info.scopes,
              activeBrand: activeBrand ? { id: activeBrand.id, name: activeBrand.name } : null,
            },
            null,
            2
          )
        );
        return;
      }

      console.log(formatSuccess(`Logged in as ${chalk.bold(info.user.name)}`));
      console.log();
      console.log(formatLabel('Email', info.user.email));
      console.log(formatLabel('Organization', info.organization.name));
      console.log(formatLabel('Scopes', info.scopes.join(', ')));
      if (activeBrand) {
        console.log(formatLabel('Active Brand', activeBrand.name));
      } else if (activeBrandId) {
        console.log(
          formatLabel('Active Brand', chalk.dim('(not found - run genfeed brands select)'))
        );
      } else {
        console.log(formatLabel('Active Brand', chalk.dim('(none - run genfeed brands select)')));
      }
    } catch (error) {
      handleError(error);
    }
  });
