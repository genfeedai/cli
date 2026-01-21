import { z } from 'zod';

export const configSchema = z.object({
  apiKey: z.string().optional(),
  apiUrl: z.string().url().default('https://api.genfeed.ai/v1'),
  activeBrand: z.string().optional(),
  defaults: z
    .object({
      imageModel: z.string().default('imagen-4'),
      videoModel: z.string().default('google-veo-3'),
    })
    .default({}),
});

export type Config = z.infer<typeof configSchema>;

export const defaultConfig: Config = {
  apiUrl: 'https://api.genfeed.ai/v1',
  defaults: {
    imageModel: 'imagen-4',
    videoModel: 'google-veo-3',
  },
};
