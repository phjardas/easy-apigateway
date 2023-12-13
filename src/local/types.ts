import type {
  APIGatewayProxyHandler,
  APIGatewayRequestAuthorizerHandler,
  APIGatewayTokenAuthorizerHandler,
} from "aws-lambda";
import type { HTTPLambdaHandler } from "../types";

export type TokenAuthorizerRegistration = {
  type: "token";
  authorizer: APIGatewayTokenAuthorizerHandler;
};

export type RequestAuthorizerRegistration = {
  type: "request";
  authorizer: APIGatewayRequestAuthorizerHandler;
  queryParameters?: string[];
  headers?: string[];
};

export type AuthorizerRegistration = { id: string } & (
  | TokenAuthorizerRegistration
  | RequestAuthorizerRegistration
);

export type HandlerResolver = (
  handlerId: string,
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

export type RequestBodySpec =
  | { type: "json" }
  | { type: "binary"; mimeTypes?: string; limit?: string };

export type Route = {
  method: Method;
  path: string;
  handlerId: string;
  requestBody?: RequestBodySpec;
  authorizerId?: string;
  cors?: boolean;
};

export type APIOptions = {
  handlerResolver: HandlerResolver;
  routes: Array<Route>;
  optionsHandler?: APIGatewayProxyHandler;
  authorizers?: Array<AuthorizerRegistration>;
};
