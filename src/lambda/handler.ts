import type { Handler } from "aws-lambda";
import type { LambdaFramework } from "../types";

/**
 * Create a non-http lambda handler that uses the framework features like error logging.
 *
 * Usage:
 * ```
 * export const convertNumberToDate: EventBridgeHandler<string, number, Date> =
 *   wrapped(async ({ detail }) => new Date(detail))
 * ```
 */
export function createHandler<TEvent, TResult>(
  framework: LambdaFramework,
  handler: Handler<TEvent, TResult>
): Handler<TEvent, TResult> {
  return applyMiddlewares(framework, handler);
}

function applyMiddlewares<TEvent, TResult>(
  framework: LambdaFramework,
  handler: Handler<TEvent, TResult>
): Handler<TEvent, TResult> {
  const middlewares = framework.options.handlerMiddleware ?? [];
  return middlewares.reduce(
    (h, middleware) => middleware.wrapHandler(framework, h),
    handler
  );
}
