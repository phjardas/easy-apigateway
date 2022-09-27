import type {
  APIGatewayAuthorizerResult,
  APIGatewayAuthorizerResultContext,
  PolicyDocument,
} from "aws-lambda";
import type { AuthorizerContext } from "../types";

export function createAuthorizerResponse(
  { principalId, authToken, permissions }: AuthorizerContext,
  methodArn: string
): APIGatewayAuthorizerResult {
  const context: APIGatewayAuthorizerResultContext = { authToken, permissions };

  return {
    principalId,
    policyDocument: createAuthorizerPolicy(methodArn),
    context,
  };
}

export function createAuthorizerPolicy(methodArn: string): PolicyDocument {
  return {
    Version: "2012-10-17",
    Statement: [
      {
        Action: "execute-api:Invoke",
        Effect: "Allow",
        Resource: methodArn,
      },
    ],
  };
}
