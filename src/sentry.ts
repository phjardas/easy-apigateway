import { AWSLambda, type User } from "@sentry/serverless";
import type { Handler } from "aws-lambda";

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

export function createSentryWrapper(options?: SentryOptions): SentryWrapper {
  console.log("Sentry DSN:", options?.dsn);
  if (!options?.dsn) return (handler) => handler;

  AWSLambda.init(options);

  return (handler, wrapOptions) => AWSLambda.wrapHandler(handler, wrapOptions);
}

export function setSentryUser(user?: User): void {
  AWSLambda.setUser(user ?? null);
}

export function captureErrorWithSentry(err: unknown): void {
  AWSLambda.captureException(err);
}
