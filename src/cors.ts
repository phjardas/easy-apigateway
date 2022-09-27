import type { APIGatewayProxyResult } from "aws-lambda";
import { createStatic } from "./lambda";
import type { HTTPLambdaHandler, LambdaFramework } from "./types";

export type CorsOptions = {
  allowHeaders?: Array<string>;
  allowMethods?: Array<string>;
  exposeHeaders?: Array<string>;
  allowCredentials?: boolean;
  maxAge?: number;
};

const defaultOptions: CorsOptions = {
  allowHeaders: ["authorization", "baggage", "content-type", "sentry-trace"],
  exposeHeaders: ["baggage", "sentry-trace", "location", "content-disposition"],
  allowMethods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
  allowCredentials: true,
  maxAge: 3600,
};

export function createOptionsLambda(
  framework: LambdaFramework,
  options?: CorsOptions
): HTTPLambdaHandler {
  return createStatic(framework, {
    statusCode: 204,
    headers: createHeaders(options),
    body: "",
  });
}

function createHeaders(
  options?: CorsOptions
): APIGatewayProxyResult["headers"] {
  const {
    allowHeaders,
    allowMethods,
    exposeHeaders,
    allowCredentials,
    maxAge,
  } = { ...defaultOptions, ...options };

  const headers: APIGatewayProxyResult["headers"] = {};

  if (allowHeaders) {
    headers["access-control-allow-headers"] = allowHeaders.sort().join(",");
  }

  if (allowMethods) {
    headers["access-control-allow-methods"] = allowMethods.sort().join(",");
  }

  if (exposeHeaders) {
    headers["access-control-expose-headers"] = exposeHeaders.sort().join(",");
  }

  if (allowCredentials !== undefined) {
    headers["access-control-allow-credentials"] = allowCredentials.toString();
  }

  if (maxAge !== undefined) {
    headers["access-control-max-age"] = maxAge.toString();
  }

  return headers;
}
