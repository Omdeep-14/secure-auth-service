import { exit } from "node:process";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(["dev", "prod"]),
  DATABASE_URL: z.url({ message: "Database url must be a valid string" }),
  REDIS_URL: z.url({ message: "Please provide a valid redis url" }),
  SMTP_HOST: z.string(),
  SMTP_PORT: z.coerce.number(),
  SMTP_USER: z.email(),
  SMTP_PASS: z.string(),
  JWT_SECRET: z.string(),
  CSRF_SECRET: z.string(),
});

const envValid = envSchema.safeParse(process.env);

if (!envValid.success) {
  console.error("wrong environment variables provided");
  console.error(JSON.stringify(envValid.error.format(), null, 2));
  process.exit(1);
}

export const env = envValid.data;
