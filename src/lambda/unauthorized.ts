import type {
  HTTPLambdaHandler,
  LambdaFramework,
  LambdaOptions,
} from "../types";
import { createHandler } from "./handler";
import { createErrorResponse, createResponse } from "./response";

/**
 * Create a lambda handler that does not require authorization.
 *
 * You can return a multitude of things from this handler:
 * * A full API Gateway response, like `{ statusCode: 200, headers: {}, body: '...' }`
 * * Any object, which will be serialized as JSON and returned with a `200` response code.
 * * Nothing (`undefined` or `null`), which will result in a `204 - No Content` response with no body.
 *
 * Usage:
 * ```
 * export const handler = lambda.authorized(async (event) => {
 *   ...
 * });
 * ```
 */
export function unauthorized(
  framework: LambdaFramework,
  handler: HTTPLambdaHandler,
  lambdaOptions?: LambdaOptions
): HTTPLambdaHandler {
  const h: HTTPLambdaHandler = async (event, ...args) => {
    try {
      const result = await handler(event, ...args);

      // Guess the API Gateway result from the return type
      const resultObject = result
        ? "statusCode" in result
          ? result
          : { statusCode: 200, body: result }
        : { statusCode: 204, body: "" };

      return createResponse(framework, resultObject, event, lambdaOptions);
    } catch (error) {
      return createErrorResponse(framework, error, event);
    }
  };

  return createHandler(framework, h);
}
