import { Command } from 'commander';
import { clearActiveBrand, clearApiKey, getApiKey } from '../config/store.js';
import { formatSuccess, formatWarning } from '../ui/theme.js';
import { handleError } from '../utils/errors.js';

export const logoutCommand = new Command('logout')
  .description('Remove stored credentials')
  .action(async () => {
    try {
      const hasKey = getApiKey();

      if (!hasKey) {
        console.log(formatWarning('You are not logged in'));
        return;
      }

      clearApiKey();
      clearActiveBrand();

      console.log(formatSuccess('Logged out successfully'));
    } catch (error) {
      handleError(error);
    }
  });
