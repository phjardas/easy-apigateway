import type { APIGatewayRequestAuthorizerEvent } from "aws-lambda";
import type { AuthorizerContext } from "../types";

export type AuthorizerContextCreator = (
  authorizationToken: string
) => AuthorizerContext | Promise<AuthorizerContext>;

export type RequestAuthorizerContextCreator = (
  request: APIGatewayRequestAuthorizerEvent
) => AuthorizerContext | Promise<AuthorizerContext>;
