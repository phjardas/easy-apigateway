/* eslint-disable @typescript-eslint/no-explicit-any */
import type { APIGatewayTokenAuthorizerHandler } from "aws-lambda";
import type { RequestHandler } from "express";
import type { AuthorizerRegistration } from "./types";

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
    default:
      throw new Error(`Invalid authorizer type: ${spec.type}`);
  }
}

function createTokenAuthorizer(
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
