import type {
  APIGatewayAuthorizerResult,
  APIGatewayRequestAuthorizerHandler,
  APIGatewayTokenAuthorizerHandler,
} from "aws-lambda";
import { LoggerImpl } from "../logging";
import type { AuthorizerContext } from "../types";
import type {
  AuthorizerContextCreator,
  RequestAuthorizerContextCreator,
} from "./types";

/**
 * Create a lambda handler that acts as an API Gateway authorizer.
 */
export function createTokenAuthorizerLambda(
  createAuthorizerContext: AuthorizerContextCreator,
): APIGatewayTokenAuthorizerHandler {
  return async ({ authorizationToken, methodArn }) => {
    const logger = new LoggerImpl({ authorizationToken, methodArn });

    try {
      const context = await createAuthorizerContext(authorizationToken, logger);
      return createPolicy(context, methodArn);
    } catch (error) {
      logger.error("Error authorizing request", { error });
      throw "Unauthorized";
    }
  };
}

export function createRequestAuthorizerLambda(
  createAuthorizerContext: RequestAuthorizerContextCreator,
): APIGatewayRequestAuthorizerHandler {
  return async (event) => {
    const logger = new LoggerImpl({
      requestId: event.requestContext.requestId,
      resourceId: event.requestContext.resourceId,
      resourcePath: event.requestContext.resourcePath,
    });

    try {
      const context = await createAuthorizerContext(event, logger);
      return createPolicy(context, event.methodArn);
    } catch (error) {
      logger.error("Error authorizing request", { error });
      throw "Unauthorized";
    }
  };
}

function createPolicy(
  context: AuthorizerContext,
  methodArn: string,
): APIGatewayAuthorizerResult {
  return {
    principalId: context.principalId,
    policyDocument: {
      Version: "2012-10-17",
      Statement: [
        {
          Action: "execute-api:Invoke",
          Effect: "Allow",
          Resource: methodArn,
        },
      ],
    },
    context,
  };
}
