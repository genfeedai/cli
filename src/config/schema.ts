import { z } from 'zod';

export const profileSchema = z.object({
  apiUrl: z.string().url().default('https://api.genfeed.ai/v1'),
  apiKey: z.string().optional(),
  token: z.string().optional(),
  organizationId: z.string().optional(),
  userId: z.string().optional(),
  role: z.enum(['user', 'admin']).default('user'),
  darkroomHost: z.string().default('100.106.229.81'),
  darkroomApiPort: z.number().default(8189),
  activeBrand: z.string().optional(),
  activePersona: z.string().optional(),
  defaults: z
    .object({
      imageModel: z.string().default('imagen-4'),
      videoModel: z.string().default('google-veo-3'),
    })
    .default({}),
});

export type Profile = z.infer<typeof profileSchema>;

export const configSchema = z.object({
  activeProfile: z.string().default('default'),
  profiles: z.record(z.string(), profileSchema).default({
    default: {
      apiUrl: 'https://api.genfeed.ai/v1',
      role: 'user',
      darkroomHost: '100.106.229.81',
      darkroomApiPort: 8189,
      defaults: {
        imageModel: 'imagen-4',
        videoModel: 'google-veo-3',
      },
    },
  }),
});

export type Config = z.infer<typeof configSchema>;

export const defaultProfile: Profile = profileSchema.parse({});

export const defaultConfig: Config = configSchema.parse({});
