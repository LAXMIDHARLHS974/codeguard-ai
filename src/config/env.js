require("dotenv").config();
const { z } = require("zod");

const envSchema = z.object({
  PORT: z.coerce.number().default(8787),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default("gemini-2.5-flash"),
  GITHUB_TOKEN: z.string().optional(),
  DATABASE_URL: z.string().optional(),
  JWT_SECRET: z.string().default("codeguard-super-secret-jwt-key-production-ready"),
  ENCRYPTION_KEY: z.string().default("0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"),
  CORS_ORIGINS: z.string().default("http://localhost:5173,http://localhost:8787,https://codeguard-lhs.onrender.com"),
  API_TIMEOUT_MS: z.coerce.number().default(60000),
  MAX_DIFF_CHARS: z.coerce.number().default(60000),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:", parsed.error.format());
  process.exit(1);
}

const config = {
  ...parsed.data,
  isProduction: parsed.data.NODE_ENV === "production",
  isTest: parsed.data.NODE_ENV === "test",
  allowedOrigins: parsed.data.CORS_ORIGINS.split(",").map((s) => s.trim()).filter(Boolean),
};

module.exports = config;
