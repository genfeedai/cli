import chalk from 'chalk';
import { Command } from 'commander';
import ora from 'ora';
import { comfyAction, getDarkroomHealth, listLoras } from '../api/darkroom-api.js';
import { requireAdmin } from '../middleware/auth-guard.js';
import { formatLabel } from '../ui/theme.js';
import { handleError } from '../utils/errors.js';

export const darkroomCommand = new Command('darkroom')
  .description('Darkroom infrastructure management [admin]')
  .addCommand(
    new Command('health')
      .description('Show darkroom status (VRAM, temp, disk, ComfyUI)')
      .option('--json', 'Output as JSON')
      .action(
        requireAdmin(async (options: { json?: boolean }) => {
          try {
            const spinner = ora('Fetching darkroom health...').start();
            const health = await getDarkroomHealth();
            spinner.stop();

            if (options.json) {
              console.log(JSON.stringify(health, null, 2));
              return;
            }

            const gpu = health.gpu;
            const vramUsedGb = (gpu.memory_used / 1024).toFixed(1);
            const vramTotalGb = (gpu.memory_total / 1024).toFixed(1);
            const vramPercent = ((gpu.memory_used / gpu.memory_total) * 100).toFixed(0);

            console.log(chalk.bold('Darkroom Status\n'));
            console.log(formatLabel('GPU', gpu.name));
            console.log(formatLabel('VRAM', `${vramUsedGb}/${vramTotalGb} GB (${vramPercent}%)`));
            console.log(formatLabel('Utilization', `${gpu.utilization}%`));
            console.log(formatLabel('Temperature', `${gpu.temperature}°C`));

            console.log();
            console.log(chalk.bold('Disk\n'));
            const root = health.disk.root;
            console.log(formatLabel('Root', `${root.used}/${root.total} (${root.percent})`));
            if (health.disk.comfyui) {
              const comfy = health.disk.comfyui;
              console.log(
                formatLabel('ComfyUI', `${comfy.used}/${comfy.total} (${comfy.percent})`)
              );
            }
          } catch (error) {
            handleError(error);
          }
        })
      )
  )
  .addCommand(
    new Command('comfy')
      .description('Manage ComfyUI service')
      .argument('<action>', 'Action: start, stop, restart, status')
      .option('--json', 'Output as JSON')
      .action(
        requireAdmin(async (action: string, options: { json?: boolean }) => {
          try {
            const validActions = ['start', 'stop', 'restart', 'status'] as const;
            if (!validActions.includes(action as (typeof validActions)[number])) {
              console.error(
                chalk.red(`Invalid action: ${action}. Use: ${validActions.join(', ')}`)
              );
              process.exit(1);
            }

            const spinner = ora(
              `${action === 'status' ? 'Checking' : action.charAt(0).toUpperCase() + action.slice(1) + 'ing'} ComfyUI...`
            ).start();
            const result = await comfyAction(action as 'start' | 'stop' | 'restart' | 'status');
            spinner.stop();

            if (options.json) {
              console.log(JSON.stringify(result, null, 2));
              return;
            }

            if (result.returncode === 0) {
              console.log(chalk.green(`ComfyUI ${action}: success`));
            } else {
              console.log(chalk.red(`ComfyUI ${action}: failed (exit code ${result.returncode})`));
            }

            if (result.stdout) {
              console.log(chalk.dim(result.stdout));
            }
            if (result.stderr) {
              console.log(chalk.yellow(result.stderr));
            }
          } catch (error) {
            handleError(error);
          }
        })
      )
  )
  .addCommand(
    new Command('loras')
      .description('List available LoRA models')
      .option('--json', 'Output as JSON')
      .action(
        requireAdmin(async (options: { json?: boolean }) => {
          try {
            const spinner = ora('Fetching LoRAs...').start();
            const result = await listLoras();
            spinner.stop();

            if (options.json) {
              console.log(JSON.stringify(result, null, 2));
              return;
            }

            if (result.loras.length === 0) {
              console.log(chalk.yellow('No LoRA models found.'));
              return;
            }

            console.log(chalk.bold(`LoRA Models (${result.loras.length})\n`));

            for (const lora of result.loras) {
              const date = new Date(lora.modified).toLocaleDateString();
              console.log(`  ${chalk.bold(lora.name)}`);
              console.log(`    ${chalk.dim(`${lora.size_mb.toFixed(1)} MB | ${date}`)}`);
            }
          } catch (error) {
            handleError(error);
          }
        })
      )
  );
