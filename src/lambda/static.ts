import type { APIGatewayProxyResult } from "aws-lambda";
import type { HTTPLambdaHandler, LambdaFramework } from "../types";
import { unauthorized } from "./unauthorized";

/**
 * Create a lambda handler that always returns the exact same response.
 */
export function createStatic(
  framework: LambdaFramework,
  response: APIGatewayProxyResult
): HTTPLambdaHandler {
  return unauthorized(framework, async () => response);
}
