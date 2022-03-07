import type {
  APIGatewayAuthorizerResult,
  APIGatewayRequestAuthorizerHandler,
  APIGatewayTokenAuthorizerHandler,
} from "aws-lambda";
import type { AuthorizerContext } from "../types";
import type {
  AuthorizerContextCreator,
  RequestAuthorizerContextCreator,
} from "./types";

/**
 * Create a lambda handler that acts as an API Gateway authorizer.
 */
export function createTokenAuthorizerLambda(
  createAuthorizerContext: AuthorizerContextCreator
): APIGatewayTokenAuthorizerHandler {
  return async ({ authorizationToken, methodArn }) => {
    try {
      const context = await createAuthorizerContext(authorizationToken);
      return createPolicy(context, methodArn);
    } catch (error) {
      console.error("Error:", error);
      throw "Unauthorized";
    }
  };
}

export function createRequestAuthorizerLambda(
  createAuthorizerContext: RequestAuthorizerContextCreator
): APIGatewayRequestAuthorizerHandler {
  return async (event) => {
    try {
      const context = await createAuthorizerContext(event);
      return createPolicy(context, event.methodArn);
    } catch (error) {
      console.error("Error:", error);
      throw "Unauthorized";
    }
  };
}

function createPolicy(
  context: AuthorizerContext,
  methodArn: string
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
