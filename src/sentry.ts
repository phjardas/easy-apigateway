import { AWSLambda } from "@sentry/serverless";
import type { Handler } from "aws-lambda";
import { optionsParser } from "./options";
import type { HandlerMiddleware } from "./types";

export type SentryOptions = {
  environment: string;
  dsn: string;
  enabled: boolean;
  tracesSampleRate?: number;
};

export type SentryWrapper = <TEvent, TResult>(
  handler: Handler<TEvent, TResult>,
  wrapOptions?: Partial<AWSLambda.WrapperOptions>
) => Handler<TEvent, TResult>;

export function setSentryUser(userId?: string): void {
  AWSLambda.setUser(userId ? { id: userId } : null);
}

export function captureErrorWithSentry(err: unknown): void {
  AWSLambda.captureException(err);
}

export function withSentry(options: SentryOptions): HandlerMiddleware {
  const sentryWrapper = createSentryWrapper(options);
  return {
    id: "sentry",
    wrapHandler: (_framework, handler) => sentryWrapper(handler),
  };
}

function createSentryWrapper(options: SentryOptions): SentryWrapper {
  if (!options.dsn) return (handler) => handler;
  AWSLambda.init(options);
  return (handler, wrapOptions) => AWSLambda.wrapHandler(handler, wrapOptions);
}

export const parseSentryOptionsFromEnv = optionsParser<SentryOptions>((get) => {
  const dsn = get("SENTRY_DSN", "");
  const enabled = Boolean(get("SENTRY_ENABLED", "true"));
  const tracesSampleRate = parseFloat(get("SENTRY_TRACES_SAMPLE_RATE", "0"));
  const environment = get("SENTRY_ENVIRONMENT", get("STAGE", "development"));

  return { dsn, tracesSampleRate, enabled, environment };
});
