import type { APIGatewayTokenAuthorizerHandler } from "aws-lambda";
import * as bodyParser from "body-parser";
import { Router, type RequestHandler } from "express";
import type { HTTPLambdaHandler } from "../types";
import { createAuthorizers } from "./authorizer";
import { expressLambda } from "./express-lambda";
import type { APIOptions, HandlerMap, Route } from "./types";

class LocalExpressAPI {
  readonly router = Router();
  private readonly handlers: HandlerMap;
  private readonly authorizerMiddlewares: Record<string, RequestHandler>;

  constructor({
    handlers,
    authorizers,
  }: {
    handlers: HandlerMap;
    authorizers: Record<string, APIGatewayTokenAuthorizerHandler>;
  }) {
    this.handlers = handlers;
    this.authorizerMiddlewares = createAuthorizers(authorizers);
  }

  route({
    method,
    path,
    handlerId,
    authorizerId,
    handler,
  }: Route & {
    handler?: HTTPLambdaHandler;
  }) {
    if (!handler) {
      handler = this.handlers[handlerId];
      if (!handler) throw new Error(`No handler defined: ${handlerId}`);
    }

    const routeHandlers = [expressLambda(handlerId, handler)];

    if (authorizerId) {
      const authorizer = this.authorizerMiddlewares[authorizerId];
      if (!authorizer) {
        throw new Error(`Authorized routes require an authorizer`);
      }

      routeHandlers.unshift(authorizer);
    }

    if (["post", "put", "patch"].includes(method)) {
      routeHandlers.unshift(bodyParser.text({ type: "application/json" }));
    }

    // replace `{pathVariable}` with `:pathVariable`
    const expressPath = path.replace(/\{([^}]+)\}/g, ":$1");
    const routerMethod = method.toLowerCase() as RouterMethod;
    this.router[routerMethod](expressPath, ...routeHandlers);
  }
}

type RouterMethod =
  | "get"
  | "post"
  | "put"
  | "delete"
  | "patch"
  | "options"
  | "head";

export function createLocalExpressAPI({
  handlers,
  routes,
  authorizers,
  optionsHandler,
}: APIOptions): Router {
  const api = new LocalExpressAPI({
    handlers,
    authorizers: authorizers ?? {},
  });

  // register routes
  routes.forEach((route) => api.route(route));

  // register OPTIONS route for every path
  if (optionsHandler) {
    routes
      .map((route) => route.path)
      .filter((val, index, arr) => arr.indexOf(val) === index)
      .forEach((path) =>
        api.route({
          method: "options",
          path,
          handlerId: "cors",
          handler: optionsHandler,
        })
      );
  }

  return api.router;
}
