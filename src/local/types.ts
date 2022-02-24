import { HTTPLambdaHandler } from "../types";

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
};

export type APIOptions = {
  handlers: HandlerMap;
  routes: Array<Route>;
  optionsHandler?: HTTPLambdaHandler;
};
