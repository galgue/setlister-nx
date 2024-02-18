import { z } from 'zod';

export const envValidation = z.object({
  DATABASE_URL: z.string(),
  SETLIST_FM_API_KEY: z.string(),
  MUSICAPI_API_KEY: z.string(),
  REDIS_URL: z.string(),
  REDIS_PORT: z.coerce.number().transform((val) => val.toString()),
  JWT_SECRET: z.string(),
  JAMBASE_API_KEY: z.string(),
});

export type EnvConfigZod = z.infer<typeof envValidation>;

declare global {
  interface EnvConfig extends EnvConfigZod {}
}
