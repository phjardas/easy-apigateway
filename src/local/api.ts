import * as bodyParser from "body-parser";
import { Router } from "express";
import type { HTTPLambdaHandler } from "../types";
import { expressLambda } from "./express-lambda";
import type { APIOptions, HandlerMap, Route } from "./types";

class LocalExpressAPI {
  readonly router = Router();
  private readonly handlers: HandlerMap;

  constructor({ handlers }: { handlers: HandlerMap }) {
    this.handlers = handlers;
  }

  route({
    method,
    path,
    handlerId,
    handler,
  }: Route & { handler?: HTTPLambdaHandler }) {
    if (!handler) {
      handler = this.handlers[handlerId];
      if (!handler) throw new Error(`No handler defined: ${handlerId}`);
    }

    const routeHandlers = [expressLambda(handlerId, handler)];

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
  optionsHandler,
}: APIOptions): Router {
  const api = new LocalExpressAPI({ handlers });

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
