import chalk from 'chalk';
import { Command } from 'commander';
import ora from 'ora';
import { get } from '@/api/client.js';
import { requireAdmin } from '@/middleware/auth-guard.js';
import { formatHeader, formatLabel, formatWarning, print, printJson } from '@/ui/theme.js';
import { handleError } from '@/utils/errors.js';

interface Persona {
  id: string;
  handle: string;
  name: string;
  description?: string;
  triggerWord?: string;
  platform?: string;
  avatarUrl?: string;
  status?: string;
  createdAt: string;
}

interface PersonasResponse {
  data: Persona[];
  meta?: { total: number };
}

interface PersonaDetailResponse {
  data: Persona;
}

export const personasCommand = new Command('personas')
  .description('List and manage personas [admin]')
  .option('--json', 'Output as JSON')
  .action(
    requireAdmin(async (options: { json?: boolean }) => {
      try {
        const spinner = ora('Fetching personas...').start();
        const response = await get<PersonasResponse>('/personas');
        spinner.stop();

        const personas = response.data;

        if (options.json) {
          printJson(response);
          return;
        }

        if (personas.length === 0) {
          print(formatWarning('No personas found.'));
          return;
        }

        print(formatHeader(`Personas (${personas.length})\n`));

        for (const persona of personas) {
          const status = persona.status === 'active' ? chalk.green('●') : chalk.dim('○');

          print(`  ${status} ${chalk.bold(persona.handle)} ${chalk.dim(`(${persona.name})`)}`);
          if (persona.description) {
            print(`    ${chalk.dim(persona.description.slice(0, 80))}`);
          }
          if (persona.triggerWord) {
            print(`    ${chalk.dim(`trigger: ${persona.triggerWord}`)}`);
          }
        }
      } catch (error) {
        handleError(error);
      }
    })
  );

personasCommand
  .command('show')
  .description('Show persona details')
  .argument('<handle>', 'Persona handle')
  .option('--json', 'Output as JSON')
  .action(
    requireAdmin(async (handle: string, options: { json?: boolean }) => {
      try {
        const spinner = ora(`Fetching persona ${handle}...`).start();
        const response = await get<PersonaDetailResponse>(`/personas/${handle}`);
        spinner.stop();

        const persona = response.data;

        if (options.json) {
          printJson(persona);
          return;
        }

        print(formatHeader(`${persona.name} (@${persona.handle})\n`));
        print(formatLabel('ID', persona.id));
        if (persona.description) {
          print(formatLabel('Description', persona.description));
        }
        if (persona.triggerWord) {
          print(formatLabel('Trigger Word', persona.triggerWord));
        }
        if (persona.platform) {
          print(formatLabel('Platform', persona.platform));
        }
        if (persona.status) {
          print(formatLabel('Status', persona.status));
        }
        print(formatLabel('Created', new Date(persona.createdAt).toLocaleDateString()));
      } catch (error) {
        handleError(error);
      }
    })
  );
