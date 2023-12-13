import type { APIGatewayRequestAuthorizerEvent } from "aws-lambda";
import type { Logger } from "../logging";
import type { AuthorizerContext } from "../types";

export type AuthorizerContextCreator = (
  authorizationToken: string,
  logger: Logger,
) => AuthorizerContext | Promise<AuthorizerContext>;

export type RequestAuthorizerContextCreator = (
  request: APIGatewayRequestAuthorizerEvent,
  logger: Logger,
) => AuthorizerContext | Promise<AuthorizerContext>;
