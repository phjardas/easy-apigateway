/* eslint-disable @typescript-eslint/no-explicit-any */
import type { APIGatewayTokenAuthorizerHandler } from "aws-lambda";
import type { RequestHandler } from "express";

export function createAuthorizers(
  authorizers: Record<string, APIGatewayTokenAuthorizerHandler>
): Record<string, RequestHandler> {
  return Object.fromEntries(
    Object.entries(authorizers).map(([name, authorizer]) => [
      name,
      createAuthorizer(authorizer),
    ])
  );
}

function createAuthorizer(
  authorizer: APIGatewayTokenAuthorizerHandler
): RequestHandler {
  return async (req, res, next) => {
    try {
      if (req.method === "OPTIONS") return next();

      const authorizationToken = req.headers.authorization;
      if (!authorizationToken) throw new Error("Unauthorized");
      const policy = await authorizer(
        { authorizationToken, methodArn: "local" } as any,
        null as any,
        null as any
      );

      if (!policy) throw new Error("Authorizer did not produce a policy");

      const effect = policy.policyDocument.Statement[0].Effect;

      if (effect === "Allow") {
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
