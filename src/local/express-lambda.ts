import type {
  APIGatewayEventIdentity,
  APIGatewayProxyEventBase,
  APIGatewayProxyResult,
  Context,
  Handler,
} from "aws-lambda";
import * as express from "express";
import type { AuthorizedLambdaEvent, AuthorizerContext } from "../types";

function createQueryStringParameters(
  req: express.Request
): Pick<
  AuthorizedLambdaEvent,
  "queryStringParameters" | "multiValueQueryStringParameters"
> {
  const entries = Object.entries(req.query).map(
    ([key, value]): [string, string[] | undefined] =>
      typeof value === "string"
        ? [key, [value] as string[]]
        : [
            key,
            Array.isArray(value) ? value.map((v) => v.toString()) : undefined,
          ]
  );

  return {
    queryStringParameters: Object.fromEntries(
      entries.map(([key, value]) => [key, value?.slice(-1)?.[0]])
    ),
    multiValueQueryStringParameters: Object.fromEntries(entries),
  };
}

export function expressLambda(
  name: string,
  handler: Handler<
    APIGatewayProxyEventBase<AuthorizerContext>,
    APIGatewayProxyResult | undefined
  >
): express.RequestHandler {
  return async (req, res, next) => {
    try {
      const timeout = 5000;
      const start = Date.now();

      const event: APIGatewayProxyEventBase<AuthorizerContext> = {
        ...createQueryStringParameters(req),
        pathParameters: req.params,
        headers: Object.entries(req.headers).reduce(
          (acc, [key, value]) => ({ ...acc, [key]: value }),
          {}
        ),
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
          requestTimeEpoch: start,
          resourceId: "?",
          resourcePath: "?",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          authorizer: (req as any).authContext as AuthorizerContext,
        },
      };

      const context: Context = {
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

      const response = await handler(event, context, () => {
        throw new Error("Lambda handler with callback is not supported");
      });

      res.status(response ? response.statusCode ?? 200 : 204);

      if (response?.headers) {
        Object.entries(response.headers).forEach(([key, value]) =>
          res.set(key, value.toString())
        );
      }

      if (response?.body) {
        res.send(
          response.isBase64Encoded
            ? Buffer.from(response.body, "base64")
            : response.body
        );
      } else {
        res.end();
      }
    } catch (error) {
      next(error);
    }
  };
}
