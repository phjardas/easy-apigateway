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

export function optionsParser<TOptions extends Record<string, unknown>>(
  factory: (get: Get) => TOptions
): (env?: Record<string, string | undefined>) => TOptions {
  return (env = process.env) => factory(createGet(env));
}

/**
 * Read the configuration for the lambda framework from the process
 * environment. Applies sensible defaults. If any of the required
 * options is missing, this function will throw.
 */
export const parseLambdaFrameworkOptionsFromEnv =
  optionsParser<LambdaFrameworkOptions>((get) => {
    return {
      includeStackTrace: get("NODE_ENV", "development") === "development",
    };
  });
