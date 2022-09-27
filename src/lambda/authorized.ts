/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  APIGatewayProxyEventBase,
  APIGatewayProxyResult,
  Handler,
} from "aws-lambda";
import { createDataStore } from "../data";
import {
  defaultPermissionEvaluators,
  PermissionEvaluatorFactory,
  type PermissionEvaluators,
} from "../permissions";
import { setSentryUser } from "../sentry";
import type {
  AuthContext,
  AuthorizedLambdaHandler,
  AuthorizerContext,
  LambdaFramework,
  LambdaOptions,
} from "../types";
import { unauthorized } from "./unauthorized";

export type AuthorizedOptions = {
  permissionEvaluators?: PermissionEvaluators;
};

/**
 * Create a lambda handler that requires authorization.
 *
 * You can return a multitude of things from this handler:
 * * A full API Gateway response, like `{ statusCode: 200, headers: {}, body: '...' }`
 * * Any object, which will be serialized as JSON and returned with a `200` response code.
 * * Nothing (`undefined` or `null`), which will result in a `204 - No Content` response with no body.
 *
 * Usage:
 * ```
 * const lambda = createFramework({ ... });
 * const authorized = createAuthorized(lambda, { ... });
 *
 * export const handler = authorized(async (event, context) => {
 *   ...
 * });
 * ```
 */
export function authorized(
  framework: LambdaFramework,
  options: AuthorizedOptions = {}
): (
  handler: AuthorizedLambdaHandler,
  lambdaOptions?: LambdaOptions
) => Handler<
  APIGatewayProxyEventBase<AuthorizerContext>,
  APIGatewayProxyResult | undefined
> {
  const createAuthContext = createAuthContextFactory(options);

  return (handler, lambdaOptions) => {
    return unauthorized(
      framework,
      (event) => {
        const context = createAuthContext(event);
        setSentryUser(context.principalId);
        return handler(event, context);
      },
      lambdaOptions
    );
  };
}

function createAuthContextFactory(
  options: AuthorizedOptions
): (event: APIGatewayProxyEventBase<AuthorizerContext>) => AuthContext {
  const permissionEvaluatorFactory = new PermissionEvaluatorFactory({
    ...defaultPermissionEvaluators,
    ...options.permissionEvaluators,
  });

  return ({ requestContext: { authorizer } }) => {
    const permissions = new Set<string>(JSON.parse(authorizer.permissions));
    const data = createDataStore();

    const permissionsEvaluator =
      permissionEvaluatorFactory.createPermissionsEvaluator({
        principalId: authorizer.principalId,
        permissions,
        authToken: authorizer.authToken,
        data,
      });

    return {
      authToken: authorizer.authToken,
      principalId: authorizer.principalId,
      permissions,
      data,
      ...permissionsEvaluator,
    };
  };
}
