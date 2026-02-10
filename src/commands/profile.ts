import chalk from 'chalk';
import { Command } from 'commander';
import {
  createProfile,
  getConfigPath,
  listProfiles,
  setActiveProfileName,
  setProfileField,
} from '../config/store.js';
import { formatLabel, formatSuccess } from '../ui/theme.js';
import { handleError } from '../utils/errors.js';

export const profileCommand = new Command('profile').description('Manage CLI profiles');

profileCommand
  .command('list')
  .description('List all profiles')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    try {
      const profiles = await listProfiles();

      if (options.json) {
        console.log(JSON.stringify(profiles, null, 2));
        return;
      }

      console.log(chalk.bold('Profiles\n'));

      for (const { name, active, profile } of profiles) {
        const marker = active ? chalk.green('●') : chalk.dim('○');
        const label = active ? chalk.bold(name) : name;
        const activeLabel = active ? chalk.dim(' (active)') : '';
        const apiUrl = chalk.dim(profile.apiUrl);

        console.log(`  ${marker} ${label}${activeLabel} ${apiUrl}`);
        if (profile.darkroomHost !== '100.106.229.81') {
          console.log(`    ${chalk.dim(`darkroom: ${profile.darkroomHost}`)}`);
        }
      }

      console.log();
      console.log(chalk.dim(`Config: ${getConfigPath()}`));
    } catch (error) {
      handleError(error);
    }
  });

profileCommand
  .command('use')
  .description('Set the active profile')
  .argument('<name>', 'Profile name')
  .action(async (name) => {
    try {
      await setActiveProfileName(name);
      console.log(formatSuccess(`Active profile: ${chalk.bold(name)}`));
    } catch (error) {
      handleError(error);
    }
  });

profileCommand
  .command('create')
  .description('Create a new profile')
  .argument('<name>', 'Profile name')
  .option('--api-url <url>', 'API URL')
  .option('--api-key <key>', 'API key')
  .option('--darkroom-host <host>', 'Darkroom host address')
  .option('--role <role>', 'User role (user or admin)')
  .action(async (name, options) => {
    try {
      await createProfile(name, {
        apiUrl: options.apiUrl,
        apiKey: options.apiKey,
        darkroomHost: options.darkroomHost,
        role: options.role as 'user' | 'admin',
      });
      console.log(formatSuccess(`Profile "${name}" created`));
      console.log(chalk.dim(`Switch to it with: gf profile use ${name}`));
    } catch (error) {
      handleError(error);
    }
  });

profileCommand
  .command('set')
  .description('Update a profile field')
  .argument('<field>', 'Field name (api-url, api-key, darkroom-host, role, active-persona)')
  .argument('<value>', 'Field value')
  .option('-p, --profile <name>', 'Profile name (defaults to active)')
  .action(async (field, value, options) => {
    try {
      const fieldMap: Record<string, keyof import('../config/schema.js').Profile> = {
        'api-url': 'apiUrl',
        'api-key': 'apiKey',
        'darkroom-host': 'darkroomHost',
        'darkroom-port': 'darkroomApiPort',
        role: 'role',
        'active-persona': 'activePersona',
        'active-brand': 'activeBrand',
      };

      const mappedField = fieldMap[field];
      if (!mappedField) {
        console.error(chalk.red(`Unknown field: ${field}`));
        console.log(chalk.dim(`Valid fields: ${Object.keys(fieldMap).join(', ')}`));
        process.exit(1);
      }

      const finalValue = mappedField === 'darkroomApiPort' ? Number.parseInt(value) : value;
      await setProfileField(mappedField, finalValue, options.profile);

      console.log(formatSuccess(`Set ${field} = ${value}`));
      if (options.profile) {
        console.log(formatLabel('Profile', options.profile));
      }
    } catch (error) {
      handleError(error);
    }
  });
