import type { APIGatewayTokenAuthorizerHandler } from "aws-lambda";
import type { HTTPLambdaHandler } from "../types";

export type HandlerMap = Record<string, HTTPLambdaHandler>;

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
};

export type APIOptions = {
  handlers: HandlerMap;
  routes: Array<Route>;
  authorizers?: Record<string, APIGatewayTokenAuthorizerHandler>;
  optionsHandler?: HTTPLambdaHandler;
};
