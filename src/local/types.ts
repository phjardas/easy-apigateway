import type { APIGatewayTokenAuthorizerHandler } from "aws-lambda";
import type { HTTPLambdaHandler } from "../types";

export type AuthorizerRegistration = {
  id: string;
} & {
  type: "token";
  authorizer: APIGatewayTokenAuthorizerHandler;
};

export type HandlerResolver = (
  handlerId: string
) => HTTPLambdaHandler | Promise<HTTPLambdaHandler>;

export type Method =
  | "get"
  | "GET"
  | "post"
  | "POST"
  | "put"
  | "PUT"
  | "delete"
  | "DELETE"
  | "patch"
  | "PATCH"
  | "options"
  | "OPTIONS"
  | "head"
  | "HEAD";

export type Route = {
  method: Method;
  path: string;
  handlerId: string;
  authorizerId?: string;
  cors?: boolean;
};

export type APIOptions = {
  handlerResolver: HandlerResolver;
  routes: Array<Route>;
  optionsHandler?: HTTPLambdaHandler;
  authorizers?: Array<AuthorizerRegistration>;
};
