/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  APIGatewayProxyEventBase,
  APIGatewayProxyHandler,
  APIGatewayProxyResult,
  Handler,
} from "aws-lambda";
import { ValidationError } from "yup";
import { applyCacheConfig } from "./caching";
import { createOptionsLambda } from "./cors";
import { InternationalizableError, StatusError } from "./error";
import { LoggerImpl, type Logger } from "./logging";
import {
  PermissionEvaluatorFactory,
  defaultPermissionEvaluators,
} from "./permissions";
import {
  captureErrorWithSentry,
  createSentryWrapper,
  setSentryUser,
  type SentryWrapper,
} from "./sentry";
import type {
  AuthContext,
  AuthorizedLambdaHandler,
  AuthorizerContext,
  HTTPLambdaHandler,
  LambdaFrameworkOptions,
  LambdaOptions,
} from "./types";
import { createYupValidationErrorResponse } from "./yup";

/**
 * A framework to create lambda handlers for REST APIs.
 */
export class LambdaFramework {
  private readonly sentryWrapper: SentryWrapper;
  private readonly permissionEvaluatorFactory: PermissionEvaluatorFactory;

  constructor(private readonly options: LambdaFrameworkOptions) {
    this.sentryWrapper = createSentryWrapper(
      options.sentry
        ? { ...options.sentry, environment: options.stage }
        : undefined,
    );

    this.permissionEvaluatorFactory = new PermissionEvaluatorFactory({
      ...defaultPermissionEvaluators,
      ...options.permissionEvaluators,
    });
  }

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
   * export const handler = lambda.authorized(async (event, context) => {
   *   ...
   * });
   * ```
   */
  authorized(
    handler: AuthorizedLambdaHandler,
    lambdaOptions?: LambdaOptions,
  ): Handler<
    APIGatewayProxyEventBase<AuthorizerContext>,
    APIGatewayProxyResult | undefined
  > {
    return this.unauthorized((event, _, logger) => {
      const context = this.createAuthContext(event, logger);
      setSentryUser({ id: context.principalId });
      return handler(event, context, logger);
    }, lambdaOptions);
  }

  /**
   * Create a lambda handler that does not require authorization.
   *
   * You can return a multitude of things from this handler:
   * * A full API Gateway response, like `{ statusCode: 200, headers: {}, body: '...' }`
   * * Any object, which will be serialized as JSON and returned with a `200` response code.
   * * Nothing (`undefined` or `null`), which will result in a `204 - No Content` response with no body.
   *
   * Usage:
   * ```
   * export const handler = lambda.authorized(async (event) => {
   *   ...
   * });
   * ```
   */
  unauthorized(
    handler: HTTPLambdaHandler,
    lambdaOptions?: LambdaOptions,
  ): APIGatewayProxyHandler {
    return this.sentryWrapper(async (event, context) => {
      try {
        const logger = new LoggerImpl({
          requestId: event.requestContext.requestId,
          resourceId: event.requestContext.resourceId,
          resourcePath: event.requestContext.resourcePath,
        });

        const result = await handler(
          event as APIGatewayProxyEventBase<AuthorizerContext>,
          context,
          logger,
        );

        // Guess the API Gateway result from the return type
        const resultObject = result
          ? "statusCode" in result
            ? result
            : { statusCode: 200, body: result }
          : { statusCode: 204, body: "" };

        return this.createResponse(resultObject, event, lambdaOptions);
      } catch (error) {
        return this.createErrorResponse(error, event);
      }
    });
  }

  /**
   * Create a lambda handler that always returns the exact same response.
   */
  createStaticLambda(response: APIGatewayProxyResult): APIGatewayProxyHandler {
    return this.unauthorized(async () => response);
  }

  /**
   * Create a lambda handler that answers `OPTIONS` requests to enable CORS.
   *
   * Usage:
   * ```
   * export const handler = lambda.createOptionsLambda();
   * ```
   */
  createOptionsLambda(): APIGatewayProxyHandler {
    return createOptionsLambda(this, this.options.cors);
  }

  private createAuthContext(
    {
      requestContext: { authorizer },
    }: APIGatewayProxyEventBase<AuthorizerContext>,
    logger: Logger,
  ): AuthContext {
    const permissions = new Set<string>(JSON.parse(authorizer.permissions));
    const permissionsEvaluator =
      this.permissionEvaluatorFactory.createPermissionsEvaluator({
        principalId: authorizer.principalId,
        permissions,
        logger,
      });

    return {
      authToken: authorizer.authToken,
      principalId: authorizer.principalId,
      permissions,
      ...permissionsEvaluator,
    };
  }

  private createResponse(
    response: Omit<APIGatewayProxyResult, "body"> & { body: any },
    event: APIGatewayProxyEventBase<any>,
    lambdaOptions?: LambdaOptions,
  ): APIGatewayProxyResult {
    const headers: APIGatewayProxyResult["headers"] = {
      "content-type": "application/json;charset=utf-8",
      "cache-control": "no-cache",
      vary: "authorization,origin",
      ...response.headers,
    };

    // TODO: allow fine-grained CORS control with allowed origins.
    const origin = event.headers.origin || event.headers.Origin;
    if (origin) headers["access-control-allow-origin"] = origin;

    let result: APIGatewayProxyResult = {
      ...response,
      // if the body already is a string, send it as it is, otherwise serialize
      body:
        typeof response.body === "string"
          ? response.body
          : JSON.stringify(response.body),
      headers,
    };

    if (lambdaOptions?.caching) {
      result = applyCacheConfig({
        result,
        body: response.body,
        options: lambdaOptions?.caching,
        requestHeaders: event.headers,
      });
    }

    return result;
  }

  // public for tests
  createErrorResponse(
    error: unknown,
    event: APIGatewayProxyEventBase<any>,
  ): APIGatewayProxyResult {
    // special handling for `yup` validation errors
    if (error instanceof ValidationError) {
      return this.createResponse(
        createYupValidationErrorResponse(error),
        event,
      );
    }

    const statusCode = this.getErrorStatusCode(error);

    if (statusCode >= 500) {
      console.warn("Error in lambda handler:", error);
      captureErrorWithSentry(error);
    }

    // TODO: can we somehow elegantly propagate properties from the error?
    const body: any = {};

    if (error instanceof Error) {
      body.message = error.message;
      if (this.options.includeStackTrace) body.stack = error.stack;
    }

    if (error instanceof InternationalizableError) {
      body.messageKey = error.messageKey;
      body.messageArgs = error.messageArgs;
    }

    return this.createResponse({ statusCode, body }, event);
  }

  private getErrorStatusCode(error: any) {
    try {
      if (error instanceof StatusError) return error.code;

      return parseInt(
        (error.code ?? error.status ?? error.StatusCode ?? 500).toString(),
        10,
      );
    } catch (e) {
      console.error("Error getting status code from error:", e);
      return 500;
    }
  }
}
