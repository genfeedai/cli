import chalk from 'chalk';
import { Command } from 'commander';
import ora from 'ora';
import { get, post, requireAuth } from '@/api/client.js';
import {
  flattenCollection,
  flattenSingle,
  type JsonApiCollectionResponse,
  type JsonApiSingleResponse,
} from '@/api/json-api.js';
import { formatHeader, print, printJson } from '@/ui/theme.js';
import { handleError } from '@/utils/errors.js';

interface Workflow {
  id: string;
  label?: string;
  description?: string;
  key?: string;
  status?: string;
}

interface WorkflowExecution {
  id: string;
}

export const workflowCommand = new Command('workflow')
  .description('Manage and execute workflows')
  .addCommand(
    new Command('list')
      .description('List available workflows')
      .option('--json', 'Output as JSON')
      .action(async (options) => {
        try {
          await requireAuth();

          const spinner = ora('Fetching workflows...').start();
          try {
            const response = await get<JsonApiCollectionResponse>('/workflows');
            const workflows = flattenCollection<Workflow>(response);
            spinner.stop();

            if (workflows.length === 0) {
              print(chalk.dim('No workflows found.'));
              return;
            }

            if (options.json) {
              printJson(workflows);
              return;
            }

            print(formatHeader('\nWorkflows:\n'));
            for (const wf of workflows) {
              print(`  ${chalk.cyan(wf.label ?? wf.key ?? wf.id)} ${chalk.dim(`(${wf.id})`)}`);
              if (wf.description) {
                print(`  ${chalk.dim(wf.description)}`);
              }
              print();
            }
          } catch (error) {
            spinner.fail('Failed to fetch workflows');
            throw error;
          }
        } catch (error) {
          handleError(error);
        }
      })
  )
  .addCommand(
    new Command('run')
      .description('Execute a workflow')
      .argument('<id>', 'Workflow ID to execute')
      .option('-t, --trigger <trigger>', 'Execution trigger', 'manual')
      .action(async (id, options) => {
        try {
          await requireAuth();

          const spinner = ora('Executing workflow...').start();
          try {
            const response = await post<JsonApiSingleResponse>('/workflow-executions', {
              trigger: options.trigger,
              workflow: id,
            });
            const execution = flattenSingle<WorkflowExecution>(response);
            spinner.succeed('Workflow execution started');
            print(chalk.dim(`Execution ID: ${execution.id}`));
          } catch (error) {
            spinner.fail('Failed to execute workflow');
            throw error;
          }
        } catch (error) {
          handleError(error);
        }
      })
  );
