import type { LambdaFrameworkOptions } from "./types";

type Get = (key: string, defaultValue?: string) => string;

function createGet(env: Record<string, string | undefined>): Get {
  return (key, defaultValue) => {
    const value = env[key] ?? defaultValue;
    if (value === undefined) {
      throw new Error(`Missing environment variable: ${key}`);
    }
    return value;
  };
}

/**
 * Read the configuration for the lambda framework from the process
 * environment. Applies sensible defaults. If any of the required
 * options is missing, this function will throw.
 */
export function parseLambdaFrameworkOptionsFromEnv(
  env: Record<string, string | undefined> = process.env
): LambdaFrameworkOptions {
  const get = createGet(env);

  return {
    stage: get("STAGE", "development"),
    includeStackTrace: get("NODE_ENV", "development") === "development",
    sentry: parseSentry(get),
  };
}

function parseSentry(get: Get): LambdaFrameworkOptions["sentry"] {
  const dsn = get("SENTRY_DSN", "");
  if (!dsn) return;

  const enabled = Boolean(get("SENTRY_ENABLED", "true"));
  const tracesSampleRate = parseFloat(get("SENTRY_TRACES_SAMPLE_RATE", "0"));

  return { dsn, tracesSampleRate, enabled };
}
