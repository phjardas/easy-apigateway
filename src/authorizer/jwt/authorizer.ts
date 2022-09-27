import type { APIGatewayTokenAuthorizerHandler } from "aws-lambda";
import { createHandler } from "../../lambda";
import type { AuthorizerContext, LambdaFramework } from "../../types";
import { createAuthorizerResponse } from "../utils";
import { createJwtVerifyer } from "./jwt";
import type { JwtOptions, JwtPayload } from "./types";
import { scrubUrl } from "./utils";

/**
 * Create a lambda handler that acts as an API Gateway authorizer.
 *
 * Usage:
 * ```
 * export const handler = createJwtAuthorizer(framework, { ... });
 * ```
 */
export function createJwtAuthorizer(
  framework: LambdaFramework,
  options: JwtOptions
): APIGatewayTokenAuthorizerHandler {
  const verifyer = createJwtVerifyer(options);

  return createHandler(framework, async ({ authorizationToken, methodArn }) => {
    try {
      if (!authorizationToken.startsWith("Bearer ")) {
        throw new Error("Authorization token is not a bearer token");
      }

      const authToken = authorizationToken.substring(7).trim();
      const payload = await verifyer(authToken);
      const context = createAuthorizerContext(payload, authToken, options);
      return createAuthorizerResponse(context, methodArn);
    } catch (error) {
      console.error("Error:", error);
      // TODO really?
      throw "Unauthorized";
    }
  });
}

function createAuthorizerContext(
  payload: JwtPayload,
  authToken: string,
  options: JwtOptions
): AuthorizerContext {
  const principalId = (options.getPrincipalId ?? defaultGetPrincipalId)(
    payload
  );
  const permissions = (options.getPermissions ?? defaultGetPermissions)(
    payload
  );

  return {
    authToken,
    principalId,
    // We need to serialize the permissions, because the AWS authorizer
    // context only supports scalar types.
    permissions: JSON.stringify(permissions),
  };
}

const defaultGetPrincipalId: NonNullable<JwtOptions["getPrincipalId"]> = (
  payload
) => {
  if (!payload.iss) throw new Error("JWT has no issuer");
  const claimPrefix = scrubUrl(payload.iss);
  const principalId = payload[`${claimPrefix}/userId`] ?? payload.sub;

  if (typeof principalId !== "string") {
    throw new Error("JWT has no userId claim and no subject");
  }

  return principalId;
};

const defaultGetPermissions: NonNullable<JwtOptions["getPermissions"]> = (
  payload
) => {
  return Array.isArray(payload.permissions)
    ? payload.permissions.filter((p): p is string => typeof p === "string")
    : [];
};
