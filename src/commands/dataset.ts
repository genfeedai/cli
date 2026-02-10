import chalk from 'chalk';
import { Command } from 'commander';
import ora from 'ora';
import { deleteDataset, downloadDataset, getDataset, uploadDataset } from '../api/darkroom-api.js';
import { requireAdmin } from '../middleware/auth-guard.js';
import { formatLabel } from '../ui/theme.js';
import { handleError } from '../utils/errors.js';

export const datasetCommand = new Command('dataset').description(
  'Manage training datasets [admin]'
);

datasetCommand
  .command('info')
  .description('Show dataset info for a persona')
  .argument('<handle>', 'Persona handle')
  .option('--json', 'Output as JSON')
  .action(
    requireAdmin(async (handle: string, options: { json?: boolean }) => {
      try {
        const spinner = ora(`Fetching dataset for ${handle}...`).start();
        const dataset = await getDataset(handle);
        spinner.stop();

        if (options.json) {
          console.log(JSON.stringify(dataset, null, 2));
          return;
        }

        console.log(chalk.bold(`Dataset: ${handle}\n`));
        console.log(formatLabel('Path', dataset.path));
        console.log(formatLabel('Images', String(dataset.image_count)));
        console.log(formatLabel('Captions', String(dataset.caption_count)));

        if (dataset.images.length > 0) {
          console.log();
          console.log(chalk.dim('Files:'));
          for (const img of dataset.images.slice(0, 20)) {
            console.log(chalk.dim(`  ${img}`));
          }
          if (dataset.images.length > 20) {
            console.log(chalk.dim(`  ... and ${dataset.images.length - 20} more`));
          }
        }
      } catch (error) {
        handleError(error);
      }
    })
  );

datasetCommand
  .command('upload')
  .description('Upload training images to darkroom')
  .argument('<handle>', 'Persona handle')
  .argument('<path>', 'Local directory containing images')
  .action(
    requireAdmin(async (handle: string, localPath: string) => {
      try {
        const { readdirSync, statSync } = await import('node:fs');
        const { join, extname } = await import('node:path');
        const { resolve } = await import('node:path');

        const resolvedPath = resolve(localPath);
        const imageExts = new Set(['.jpg', '.jpeg', '.png', '.webp']);

        const allFiles = readdirSync(resolvedPath);
        const filePaths = allFiles
          .filter((f) => {
            const ext = extname(f).toLowerCase();
            return imageExts.has(ext) || ext === '.txt';
          })
          .map((f) => join(resolvedPath, f))
          .filter((f) => statSync(f).isFile());

        if (filePaths.length === 0) {
          console.log(chalk.red(`No image or caption files found in ${resolvedPath}`));
          return;
        }

        const spinner = ora(`Uploading ${filePaths.length} files for ${handle}...`).start();

        const result = await uploadDataset(handle, filePaths);

        spinner.succeed(`Uploaded ${result.uploaded_count} files to ${result.path}`);
      } catch (error) {
        handleError(error);
      }
    })
  );

datasetCommand
  .command('download')
  .description('Download dataset from darkroom')
  .argument('<handle>', 'Persona handle')
  .argument('[outDir]', 'Output directory', '.')
  .action(
    requireAdmin(async (handle: string, outDir: string) => {
      try {
        const { resolve } = await import('node:path');
        const resolvedOut = resolve(outDir);
        const spinner = ora(`Downloading dataset for ${handle}...`).start();

        await downloadDataset(handle, resolvedOut);

        spinner.succeed(`Dataset downloaded to ${resolvedOut}`);
      } catch (error) {
        handleError(error);
      }
    })
  );

datasetCommand
  .command('delete')
  .description('Delete dataset from darkroom')
  .argument('<handle>', 'Persona handle')
  .action(
    requireAdmin(async (handle: string) => {
      try {
        const spinner = ora(`Deleting dataset for ${handle}...`).start();

        await deleteDataset(handle);

        spinner.succeed(`Dataset ${handle} deleted`);
      } catch (error) {
        handleError(error);
      }
    })
  );
