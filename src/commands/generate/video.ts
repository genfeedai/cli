import { writeFile } from 'node:fs/promises';
import chalk from 'chalk';
import { Command } from 'commander';
import ora from 'ora';
import { requireAuth } from '../../api/client.js';
import { createVideo, getVideo, type Video } from '../../api/videos.js';
import { getActiveBrand, getDefaultVideoModel } from '../../config/store.js';
import { formatLabel } from '../../ui/theme.js';
import { handleError, NoBrandError } from '../../utils/errors.js';
import { poll } from '../../utils/polling.js';

export const videoCommand = new Command('video')
  .description('Generate an AI video')
  .argument('<prompt>', 'The prompt describing the video to generate')
  .option('-m, --model <model>', 'Model to use for generation')
  .option('-d, --duration <seconds>', 'Video duration in seconds', Number.parseInt)
  .option('-r, --resolution <res>', 'Video resolution (720p, 1080p, 4k)')
  .option('-b, --brand <id>', 'Brand ID (overrides active brand)')
  .option('-o, --output <path>', 'Download video to file')
  .option('--no-wait', 'Do not wait for generation to complete')
  .option('--json', 'Output as JSON')
  .action(async (prompt, options) => {
    try {
      await requireAuth();

      const brandId = options.brand ?? getActiveBrand();
      if (!brandId) {
        throw new NoBrandError();
      }

      const model = options.model ?? getDefaultVideoModel();

      // Create the video generation request
      const spinner = ora('Creating video...').start();

      const video = await createVideo({
        text: prompt,
        brand: brandId,
        model,
        duration: options.duration,
        resolution: options.resolution,
      });

      if (!options.wait) {
        spinner.succeed('Video generation started');

        if (options.json) {
          console.log(JSON.stringify({ id: video.id, status: video.status }, null, 2));
        } else {
          console.log(formatLabel('ID', video.id));
          console.log(formatLabel('Status', video.status));
          console.log();
          console.log(chalk.dim(`Check status with: genfeed status ${video.id}`));
        }
        return;
      }

      spinner.text = 'Generating video...';

      // Poll for completion (videos take longer, poll less frequently)
      const { result, elapsed } = await poll<Video>({
        fn: () => getVideo(video.id),
        isComplete: (v) => v.status === 'completed',
        isFailed: (v) => v.status === 'failed',
        getError: (v) => v.error,
        spinner,
        interval: 5000, // Poll every 5s for videos
        timeout: 600000, // 10 minute timeout for videos
      });

      const elapsedSec = (elapsed / 1000).toFixed(1);
      spinner.succeed(`Video generated (${elapsedSec}s)`);

      // Handle output
      if (options.json) {
        console.log(
          JSON.stringify(
            {
              id: result.id,
              status: result.status,
              url: result.url,
              duration: result.duration,
              resolution: result.resolution,
              model: result.model,
              elapsed: elapsed,
            },
            null,
            2
          )
        );
      } else {
        console.log(formatLabel('URL', result.url ?? 'N/A'));
        if (result.duration) {
          console.log(formatLabel('Duration', `${result.duration}s`));
        }
        if (result.resolution) {
          console.log(formatLabel('Resolution', result.resolution));
        }
        console.log(formatLabel('Model', result.model));
      }

      // Download if output path specified
      if (options.output && result.url) {
        const downloadSpinner = ora('Downloading video...').start();
        try {
          const response = await fetch(result.url);
          if (!response.ok) {
            throw new Error(`Failed to download: ${response.statusText}`);
          }
          const buffer = await response.arrayBuffer();
          await writeFile(options.output, Buffer.from(buffer));
          downloadSpinner.succeed(`Saved to ${options.output}`);
        } catch (err) {
          downloadSpinner.fail('Failed to download video');
          throw err;
        }
      }
    } catch (error) {
      handleError(error);
    }
  });
