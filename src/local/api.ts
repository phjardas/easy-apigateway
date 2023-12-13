import * as bodyParser from "body-parser";
import { Router, type RequestHandler } from "express";
import type { HTTPLambdaHandler } from "../types";
import { createAuthorizers } from "./authorizer";
import { expressLambda } from "./express-lambda";
import type {
  APIOptions,
  AuthorizerRegistration,
  HandlerResolver,
  Route,
} from "./types";

class LocalExpressAPI {
  readonly router = Router();
  private readonly handlerResolver: HandlerResolver;
  private readonly authorizerMiddlewares: Record<string, RequestHandler>;

  constructor({
    handlerResolver,
    authorizers,
  }: {
    handlerResolver: HandlerResolver;
    authorizers?: Array<AuthorizerRegistration>;
  }) {
    this.handlerResolver = handlerResolver;
    this.authorizerMiddlewares = createAuthorizers(authorizers ?? []);
  }

  async route({
    method,
    path,
    handlerId,
    authorizerId,
    requestBody,
    handler,
  }: Route & {
    handler?: HTTPLambdaHandler;
  }) {
    if (!handler) {
      handler = await this.handlerResolver(handlerId);
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

    if (requestBody) {
      switch (requestBody.type) {
        case "binary": {
          routeHandlers.unshift(
            bodyParser.raw({
              type: requestBody.mimeTypes ?? "*/*",
              limit: requestBody.limit,
            }),
          );
          break;
        }
        default: {
          routeHandlers.unshift(bodyParser.text({ type: "application/json" }));
        }
      }
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

export async function createLocalExpressAPI({
  handlerResolver,
  routes,
  authorizers,
  optionsHandler,
}: APIOptions): Promise<Router> {
  const api = new LocalExpressAPI({ handlerResolver, authorizers });

  // register routes
  await Promise.all(routes.map((route) => api.route(route)));

  // register OPTIONS routes
  if (optionsHandler) {
    await Promise.all(
      routes
        .filter((route) => route.cors)
        .map((route) => route.path)
        .filter((val, index, arr) => arr.indexOf(val) === index)
        .map((path) =>
          api.route({ method: "options", path, handlerId: "cors" }),
        ),
    );
  }

  return api.router;
}
