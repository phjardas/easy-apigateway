import type { APIGatewayProxyResult } from "aws-lambda";

export function created(location?: string): APIGatewayProxyResult {
  const headers = location
    ? { location, "access-control-expose-headers": "location" }
    : undefined;
  return { statusCode: 201, headers, body: "" };
}
