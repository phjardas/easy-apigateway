/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  APIGatewayAuthorizerResult,
  APIGatewayTokenAuthorizerHandler,
} from "aws-lambda";
import type { RequestHandler } from "express";
import { Request } from "express-serve-static-core";
import { unauthorizedError } from "../errors";
import { createEvent } from "./express-lambda";
import type {
  AuthorizerRegistration,
  RequestAuthorizerRegistration,
} from "./types";

export function createAuthorizers(
  authorizers: Array<AuthorizerRegistration>
): Record<string, RequestHandler> {
  return Object.fromEntries(
    authorizers.map((spec) => [spec.id, createAuthorizer(spec)])
  );
}

function createAuthorizer(spec: AuthorizerRegistration): RequestHandler {
  switch (spec.type) {
    case "token":
      return createTokenAuthorizer(spec.authorizer);
    case "request":
      return createRequestAuthorizer(spec);
    default:
      throw new Error(`Invalid authorizer type: ${(spec as any).type}`);
  }
}

function createTokenAuthorizer(
  authorizer: APIGatewayTokenAuthorizerHandler
): RequestHandler {
  return createAuthorizerInternal(async (req) => {
    const authorizationToken = req.headers.authorization;
    if (!authorizationToken) throw unauthorizedError();
    return authorizer(
      { type: "TOKEN", authorizationToken, methodArn: "local" },
      null as any,
      null as any
    );
  });
}

function createRequestAuthorizer({
  authorizer,
  queryParameters,
  headers,
}: RequestAuthorizerRegistration): RequestHandler {
  return createAuthorizerInternal(async (req) => {
    const token = findToken(req, { queryParameters, headers });
    if (!token) throw unauthorizedError();

    return authorizer(
      { type: "REQUEST", methodArn: "local", ...createEvent<undefined>(req) },
      null as any,
      null as any
    );
  });
}

function findToken(
  req: Request,
  {
    queryParameters = [],
    headers = [],
  }: Pick<RequestAuthorizerRegistration, "queryParameters" | "headers">
): string | undefined {
  return (
    queryParameters.find((param) => req.query[param]) ??
    headers.find((h) => req.headers[h])
  );
}

function createAuthorizerInternal(
  handler: (req: Request) => Promise<APIGatewayAuthorizerResult | null | void>
): RequestHandler {
  return async (req, res, next) => {
    try {
      if (req.method === "OPTIONS") return next();

      const policy = await handler(req);
      if (!policy) throw new Error("Authorizer did not produce a policy");

      const effect = policy.policyDocument.Statement[0].Effect;

      if (effect === "Allow") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (req as any).authContext = {
          principalId: policy.principalId,
          ...policy.context,
        };
        return next();
      }
    } catch (error) {
      // ignored
    }

    return res.status(401).end();
  };
}
