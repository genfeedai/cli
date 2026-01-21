import chalk from 'chalk';
import { Command } from 'commander';
import ora from 'ora';
import { requireAuth } from '../api/client.js';
import { getImage } from '../api/images.js';
import { getVideo } from '../api/videos.js';
import { formatError, formatLabel } from '../ui/theme.js';
import { ApiError, handleError } from '../utils/errors.js';

type ContentType = 'image' | 'video';
type Status = 'pending' | 'processing' | 'completed' | 'failed';

interface StatusResult {
  id: string;
  type: ContentType;
  status: Status;
  url?: string;
  error?: string;
  model: string;
  createdAt: string;
  completedAt?: string;
  dimensions?: { width: number; height: number };
  duration?: number;
  resolution?: string;
}

function formatStatus(status: Status): string {
  switch (status) {
    case 'pending':
      return chalk.yellow('● Pending');
    case 'processing':
      return chalk.blue('● Processing');
    case 'completed':
      return chalk.green('● Completed');
    case 'failed':
      return chalk.red('● Failed');
  }
}

export const statusCommand = new Command('status')
  .description('Check the status of a generation job')
  .argument('<id>', 'The ID of the image or video')
  .option('-t, --type <type>', 'Content type (image or video)', 'image')
  .option('--json', 'Output as JSON')
  .action(async (id, options) => {
    try {
      await requireAuth();

      const spinner = ora('Fetching status...').start();

      let result: StatusResult;

      try {
        if (options.type === 'video') {
          const video = await getVideo(id);
          result = {
            id: video.id,
            type: 'video',
            status: video.status,
            url: video.url,
            error: video.error,
            model: video.model,
            createdAt: video.createdAt,
            completedAt: video.completedAt,
            duration: video.duration,
            resolution: video.resolution,
          };
        } else {
          const image = await getImage(id);
          result = {
            id: image.id,
            type: 'image',
            status: image.status,
            url: image.url,
            error: image.error,
            model: image.model,
            createdAt: image.createdAt,
            completedAt: image.completedAt,
            dimensions:
              image.width && image.height
                ? { width: image.width, height: image.height }
                : undefined,
          };
        }
      } catch (err) {
        // If image lookup fails, try video (auto-detect type)
        if (options.type === 'image' && err instanceof ApiError && err.statusCode === 404) {
          try {
            const video = await getVideo(id);
            result = {
              id: video.id,
              type: 'video',
              status: video.status,
              url: video.url,
              error: video.error,
              model: video.model,
              createdAt: video.createdAt,
              completedAt: video.completedAt,
              duration: video.duration,
              resolution: video.resolution,
            };
          } catch {
            throw err; // Re-throw original error
          }
        } else {
          throw err;
        }
      }

      spinner.stop();

      if (options.json) {
        console.log(JSON.stringify(result, null, 2));
        return;
      }

      console.log(formatLabel('ID', result.id));
      console.log(formatLabel('Type', result.type));
      console.log(formatLabel('Status', formatStatus(result.status)));
      console.log(formatLabel('Model', result.model));

      if (result.status === 'completed' && result.url) {
        console.log(formatLabel('URL', result.url));

        if (result.dimensions) {
          console.log(
            formatLabel('Dimensions', `${result.dimensions.width} × ${result.dimensions.height}`)
          );
        }

        if (result.duration) {
          console.log(formatLabel('Duration', `${result.duration}s`));
        }

        if (result.resolution) {
          console.log(formatLabel('Resolution', result.resolution));
        }

        if (result.completedAt) {
          const completedDate = new Date(result.completedAt);
          console.log(formatLabel('Completed', completedDate.toLocaleString()));
        }
      }

      if (result.status === 'failed' && result.error) {
        console.log();
        console.log(formatError(`Error: ${result.error}`));
      }

      if (result.status === 'pending' || result.status === 'processing') {
        console.log();
        console.log(chalk.dim('Generation is still in progress. Check again later.'));
      }
    } catch (error) {
      handleError(error);
    }
  });
