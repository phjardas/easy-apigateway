/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  APIGatewayProxyEventBase,
  APIGatewayProxyResult,
} from "aws-lambda";
import createETag from "etag";

export type GetLastModifiedFn = (body: any) => number | undefined;

export type CacheOptions = {
  /**
   * A custom [`Cache-Control`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control) response header.
   */
  cacheControl?: string;

  /**
   * Get the timestamp of the last modification of the result data.
   *
   * The timestamp is expected to be a number with a UNIX timestamp in milliseconds. If
   * the property is `undefined` or zero, no modification time logic is applied at all.
   */
  getLastModified?: GetLastModifiedFn;

  /**
   * The maximum time in milliseconds a resource may be cached by a client. Setting this
   * option will add an [`Expires`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Expires) response header,
   * if the last modification timestamp extracted by `lastModifiedKey` produces a result.
   */
  maxAge?: number;
};

export function applyCacheConfig({
  result,
  body,
  options,
  requestHeaders,
}: {
  result: APIGatewayProxyResult;
  body: any;
  options: CacheOptions;
  requestHeaders: APIGatewayProxyEventBase<any>["headers"];
}): APIGatewayProxyResult {
  const etag = createETag(result.body, { weak: true });

  const headers: APIGatewayProxyResult["headers"] = {
    ...result.headers,
    etag,
  };

  if (options.cacheControl) headers["cache-control"] = options.cacheControl;

  const lastModified = options.getLastModified?.(body);
  const lastModifiedRounded =
    lastModified && Math.floor(lastModified / 1000) * 1000;

  if (lastModifiedRounded) {
    headers["last-modified"] = new Date(lastModifiedRounded).toUTCString();

    if (options.maxAge) {
      headers["expires"] = new Date(
        lastModifiedRounded + options.maxAge
      ).toUTCString();
    }
  }

  if (requestHeaders["if-none-match"] === etag) {
    return { statusCode: 304, headers, body: "" };
  }

  const ifModifiedSince = requestHeaders["if-modified-since"];
  if (
    ifModifiedSince &&
    lastModifiedRounded &&
    lastModifiedRounded <= new Date(ifModifiedSince).getTime()
  ) {
    return { statusCode: 304, headers, body: "" };
  }

  return { ...result, headers };
}

/**
 * Extract the last modification from a property of the response body.
 * If the body is an array, the extraction is applied to every element
 * in the array, and the largest value is returned.
 *
 * The value of the property is expected to be a `number` with a UNIX
 * timestamp in milliseconds.
 */
export function extractLastModifiedFromProperty(
  lastModifiedKey: string
): GetLastModifiedFn {
  return (body: any) => {
    if (Array.isArray(body)) {
      const values = body
        .map((e) => e[lastModifiedKey])
        .filter((e) => typeof e === "number");
      return values.length ? Math.max(...values) : undefined;
    }

    return body[lastModifiedKey];
  };
}
