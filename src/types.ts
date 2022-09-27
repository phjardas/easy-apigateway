/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  APIGatewayProxyEventBase,
  APIGatewayProxyResult,
  Handler,
} from "aws-lambda";
import type { CacheOptions } from "./caching";
import type { PermissionsEvaluator } from "./permissions";

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

export type DataStore = {
  set: <T>(key: string, value: T | undefined) => void;
  get: <T>(key: string) => T | undefined;
  getOrCreate: <T>(key: string, factory: () => T) => T;
};

/**
 * Every authorized lambda handler receives this context to
 * perform permission evaluations.
 */
export type AuthContext = {
  authToken: string;
  principalId: string;
  permissions: ReadonlySet<string>;
  data: DataStore;
} & PermissionsEvaluator;

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

export type HandlerMiddleware = {
  id: string;
  wrapHandler<TEvent, TResult>(
    framework: LambdaFramework,
    handler: Handler<TEvent, TResult>
  ): Handler<TEvent, TResult>;
};

export type LambdaFrameworkOptions = {
  handlerMiddleware?: Array<HandlerMiddleware>;
  includeStackTrace?: boolean;
};

export type LambdaFramework = {
  readonly id: string;
  readonly options: Readonly<LambdaFrameworkOptions>;
};
