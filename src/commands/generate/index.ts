import { Command } from 'commander';
import { imageCommand } from './image.js';
import { videoCommand } from './video.js';

export const generateCommand = new Command('generate')
  .description('Generate AI content')
  .addCommand(imageCommand)
  .addCommand(videoCommand);
