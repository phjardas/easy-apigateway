import type {
  APIGatewayEventIdentity,
  APIGatewayProxyEventBase,
  APIGatewayProxyResult,
  Context,
  Handler,
} from "aws-lambda";
import * as express from "express";
import type { AuthorizerContext } from "../types";

export function expressLambda(
  name: string,
  handler: Handler<
    APIGatewayProxyEventBase<AuthorizerContext>,
    APIGatewayProxyResult | undefined
  >
): express.RequestHandler {
  return async (req, res, next) => {
    try {
      const event = createEvent(req);
      const context = createContext({ name });

      const response = await handler(event, context, () => {
        throw new Error("Lambda handler with callback is not supported");
      });

      sendResponse(response, res);
    } catch (error) {
      next(error);
    }
  };
}

function createEvent(
  req: express.Request
): APIGatewayProxyEventBase<AuthorizerContext> {
  const queryStringParameters = Object.fromEntries(
    Object.entries(req.query)
      .map(([key, value]) => typeof value === "string" && [key, value])
      .filter((e) => Boolean(e)) as Array<[string, string]>
  );

  const multiValueQueryStringParameters = Object.fromEntries(
    Object.entries(req.query)
      .map(([key, value]) => Array.isArray(value) && [key, value])
      .filter((e) => Boolean(e)) as Array<[string, Array<string>]>
  );

  const headers = Object.entries(req.headers).reduce(
    (acc, [key, value]) => ({ ...acc, [key]: value }),
    {}
  );

  return {
    pathParameters: req.params,
    queryStringParameters,
    multiValueQueryStringParameters,
    headers,
    multiValueHeaders: {},
    httpMethod: req.method,
    path: req.path,
    body: req.body,
    isBase64Encoded: false,
    stageVariables: {},
    resource: "?",
    requestContext: {
      accountId: "local",
      apiId: "local",
      httpMethod: req.method,
      protocol: req.protocol,
      path: req.path,
      stage: "local",
      identity: {} as APIGatewayEventIdentity,
      requestId: "test",
      requestTimeEpoch: Date.now(),
      resourceId: "?",
      resourcePath: "?",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      authorizer: (req as any).authContext as AuthorizerContext,
    },
  };
}

function createContext({
  name,
  timeout = 5000,
}: {
  name: string;
  timeout?: number;
}): Context {
  const start = Date.now();

  return {
    callbackWaitsForEmptyEventLoop: true,
    awsRequestId: "test",
    functionName: name,
    functionVersion: "local",
    getRemainingTimeInMillis: () => timeout - (Date.now() - start),
    invokedFunctionArn: "local",
    logGroupName: "local",
    logStreamName: "local",
    memoryLimitInMB: "128",
    done: () => {
      throw new Error("context.done() is not supported");
    },
    fail: () => {
      throw new Error("context.fail() is not supported");
    },
    succeed: () => {
      throw new Error("context.succeed() is not supported");
    },
  };
}

function sendResponse(
  response: APIGatewayProxyResult | undefined | void,
  res: express.Response<unknown, Record<string, unknown>>
) {
  if (response) {
    res.status(response.statusCode || 200);
    if (response.headers) {
      Object.entries(response.headers).forEach(([key, value]) =>
        res.set(key, value.toString())
      );
    }

    if (response.body) {
      res.send(
        response.isBase64Encoded
          ? Buffer.from(response.body, "base64")
          : response.body
      );
    } else {
      res.end();
    }
  } else {
    res.status(204).end();
  }
}
