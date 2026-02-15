import chalk from 'chalk';
import { Command } from 'commander';
import ora from 'ora';
import { get, post, requireAuth } from '@/api/client.js';
import { formatHeader, print, printJson } from '@/ui/theme.js';
import { handleError } from '@/utils/errors.js';

interface Workflow {
  _id: string;
  name: string;
  label?: string;
  description?: string;
}

interface WorkflowListResponse {
  data: Workflow[];
}

interface WorkflowExecution {
  _id: string;
  id?: string;
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
            const response = await get<WorkflowListResponse>('/v1/workflows');
            spinner.stop();

            const workflows = response.data ?? [];
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
              print(`  ${chalk.cyan(wf.label ?? wf.name)} ${chalk.dim(`(${wf._id})`)}`);
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
      .action(async (id) => {
        try {
          await requireAuth();

          const spinner = ora('Executing workflow...').start();
          try {
            const response = await post<WorkflowExecution>('/v1/workflow-executions', {
              workflowId: id,
            });
            spinner.succeed('Workflow execution started');
            print(chalk.dim(`Execution ID: ${response._id ?? response.id}`));
          } catch (error) {
            spinner.fail('Failed to execute workflow');
            throw error;
          }
        } catch (error) {
          handleError(error);
        }
      })
  );
