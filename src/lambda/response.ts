/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  APIGatewayProxyEventBase,
  APIGatewayProxyResult,
} from "aws-lambda";
import { ValidationError } from "yup";
import { applyCacheConfig } from "../caching";
import { InternationalizableError, StatusError } from "../error";
import { captureErrorWithSentry } from "../sentry";
import type { LambdaFramework, LambdaOptions } from "../types";
import { createYupValidationErrorResponse } from "./yup";

export function createResponse(
  // framework not needed for now, but adding it as first argument for future compatibility.
  _framework: LambdaFramework,
  response: Omit<APIGatewayProxyResult, "body"> & { body: any },
  event: APIGatewayProxyEventBase<any>,
  lambdaOptions?: LambdaOptions
): APIGatewayProxyResult {
  const headers: APIGatewayProxyResult["headers"] = {
    "content-type": "application/json;charset=utf-8",
    "cache-control": "no-cache",
    vary: "authorization,origin",
    ...response.headers,
  };

  // TODO: allow fine-grained CORS control with allowed origins.
  const origin = event.headers.origin || event.headers.Origin;
  if (origin) headers["access-control-allow-origin"] = origin;

  let result: APIGatewayProxyResult = {
    ...response,
    // if the body already is a string, send it as it is, otherwise serialize
    body:
      typeof response.body === "string"
        ? response.body
        : JSON.stringify(response.body),
    headers,
  };

  if (lambdaOptions?.caching) {
    result = applyCacheConfig({
      result,
      body: response.body,
      options: lambdaOptions?.caching,
      requestHeaders: event.headers,
    });
  }

  return result;
}

// public for tests
export function createErrorResponse(
  framework: LambdaFramework,
  error: unknown,
  event: APIGatewayProxyEventBase<any>
): APIGatewayProxyResult {
  // special handling for `yup` validation errors
  if (error instanceof ValidationError) {
    return createResponse(
      framework,
      createYupValidationErrorResponse(error),
      event
    );
  }

  const statusCode = getErrorStatusCode(error);

  if (statusCode >= 500) {
    console.error(error);
    captureErrorWithSentry(error);
  }

  // TODO: can we somehow elegantly propagate properties from the error?
  const body: any = {};

  if (error instanceof Error) {
    body.message = error.message;
    if (framework.options.includeStackTrace) body.stack = error.stack;
  }

  if (error instanceof InternationalizableError) {
    body.messageKey = error.messageKey;
    body.messageArgs = error.messageArgs;
  }

  return createResponse(framework, { statusCode, body }, event);
}

function getErrorStatusCode(error: any): number {
  try {
    if (error instanceof StatusError) return error.code;

    return parseInt(
      (error.code ?? error.status ?? error.StatusCode ?? 500).toString(),
      10
    );
  } catch (e) {
    console.error("Error getting status code from error:", e);
    return 500;
  }
}
