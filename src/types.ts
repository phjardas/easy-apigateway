/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  APIGatewayProxyEventBase,
  APIGatewayProxyResult,
  Handler,
} from "aws-lambda";
import type { CacheOptions } from "./caching";
import type { CorsOptions } from "./cors";
import type { PermissionEvaluators, PermissionsEvaluator } from "./permissions";
import type { SentryOptions } from "./sentry";

/**
 * The context returned from the API Gateway authorizer,
 * used as the input to create an `AuthContext`.
 */
export type AuthorizerContext = {
  authToken: string;
  principalId: string;
  /** JSON serialized array of permissions */
  permissions: string;
};

/**
 * Every authorized lambda handler receives this context to
 * perform permission evaluations.
 */
export type AuthContext = {
  authToken: string;
  principalId: string;
  permissions: Set<string>;
} & PermissionsEvaluator;

export type LambdaFrameworkOptions = {
  stage: string;
  permissionEvaluators?: PermissionEvaluators;
  includeStackTrace?: boolean;
  cors?: CorsOptions;
  sentry?: Omit<SentryOptions, "environment">;
};

export type HTTPLambdaHandler = Handler<
  APIGatewayProxyEventBase<AuthorizerContext>,
  APIGatewayProxyResult | any | undefined
>;

export type AnonymousLambdaHandler = Handler<
  APIGatewayProxyEventBase<unknown>,
  APIGatewayProxyResult | any | undefined
>;

export type AuthorizedLambdaEvent = Omit<
  APIGatewayProxyEventBase<unknown>,
  "authorizer"
>;

export type AuthorizedLambdaHandler = (
  event: AuthorizedLambdaEvent,
  context: AuthContext
) => Promise<APIGatewayProxyResult | any | undefined>;

export type LambdaOptions = {
  caching?: CacheOptions;
};
