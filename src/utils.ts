import type { APIGatewayProxyEventBase } from "aws-lambda";
import { badRequestError, notFoundError } from "./errors";

/**
 * Parse the body of an incoming HTTP request. Throws if there is no body.
 */
export function parseBody<T>(event: APIGatewayProxyEventBase<unknown>): T {
  const body = parseBodyMaybe<T>(event);
  if (!body) throw badRequestError("Missing request body");
  return body;
}

/**
 * Parse the body of an incoming HTTP request, if present.
 */
export function parseBodyMaybe<T>(
  event: APIGatewayProxyEventBase<unknown>
): T | undefined {
  if (!event.body) return;

  const body = event.isBase64Encoded
    ? Buffer.from(event.body, "base64").toString("utf8")
    : event.body;

  try {
    return JSON.parse(body);
  } catch (error) {
    throw badRequestError(
      error instanceof Error ? error.message : "Can't parse request body"
    );
  }
}

function pathParam(
  event: APIGatewayProxyEventBase<unknown>,
  key: string
): string {
  const value = event.pathParameters?.[key];
  if (value === undefined) {
    throw badRequestError(`Missing path parameter: ${key}`);
  }
  return value;
}

/**
 * Get the path parameters of an incoming HTTP request.
 *
 * Usage:
 * ```
 * const { a, b } = pathParams(event, ["a", "b"]);
 * ```
 */
// TODO: the API of this method is clumsy, can we do better?
export function pathParams<T>(
  event: APIGatewayProxyEventBase<unknown>,
  keys: Array<keyof T>
): T {
  return keys.reduce(
    (params, key) => ({ ...params, [key]: pathParam(event, key.toString()) }),
    {} as T
  );
}

/**
 * Make sure that a value is present. Throws a `404 - Not Found` exception if
 * the value is _falsy_.
 */
export function required<T>(value: T | undefined): T {
  if (!value) throw notFoundError();
  return value;
}

export function lookupCache<K, T>(
  lookupFn: (key: K) => T,
  keyFn: (key: K) => string
): (key: K) => T {
  const values: Record<string, T> = {};

  return (key) => {
    const keyString = keyFn(key);
    if (keyString in values) return values[keyString];
    const value = lookupFn(key);
    values[keyString] = value;
    return value;
  };
}
