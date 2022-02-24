# Easy API Gateway

Create REST APIs with AWS Lambda with grace.

## Features

This library provides the following functionality out of the box:

- Handle different return types of lambda implementations.
- Handle errors thrown by lambda implementations.
- A local development server using [express](https://www.npmjs.com/package/express).

## Basic usage

**lambda.ts**

```typescript
import {
  parseLambdaFrameworkOptionsFromEnv,
  LambdaFramework,
} from "easy-apigateway";

export const lambda = new LambdaFramework(
  // parse the options from well-known environment variables
  parseLambdaFrameworkOptionsFromEnv()
);
```

**some-lambda.ts**

```typescript
import { lambda } from "./lambda";
import { pathParams, required } from "easy-apigateway";
import { getOrganization } from "./service";

export const handler = lambda.authorized(async (event, context) => {
  const { workspaceId, organizationId } = pathParams(event, [
    "workspaceId",
    "organizationId",
  ]);
  return required(await getOrganization(workspaceId, organizationId, context));
});
```

**service.ts**

```typescript
import { organizationPermission, workspacePermission } from "./permissions";
import { AuthContext } from "easy-apigateway";

export async function getOrganization(
  workspaceId: string,
  orgId: string,
  context: AuthContext
): Promise<Organization | undefined> {
  await context.assertAnyPermission(
    organizationPermission(workspaceId, orgId, "READ"),
    workspacePermission(workspaceId, "organizations:read")
  );

  return loadOrganization(workspaceId, orgId);
}
```

## Permissions

The framework comes with a permission evaluation framework to ease authorization in your services.

You can register _permission evaluators_ when initializing the framework:

```typescript
import { LambdaFramework, PermissionEvaluator } from "easy-apigateway";

type SomePermissionSpec = {
  type: "permission";
  permission: string;
};

const somePermissionTypeEvaluator: PermissionEvaluator<SomePermissionSpec> = (
  spec,
  context
) => context.permissions.has(spec.permission);

const lambda = new LambdaFramework({
  permissionEvaluators: {
    // map from permission spec type to evaluator
    permission: somePermissionTypeEvaluator,
  },
});
```

In your service methods you can now authorize using that permission spec:

```typescript
import { AuthContext } from "easy-apigateway";

async function doSomething(context: AuthContext) {
  await context.assertPermissions({
    type: "permission",
    permission: "yaddayadda",
  });

  // now perform the actual service operation
}
```

## Configuration

The framework is configured with options provided to its constructor.

For convenience, the framework options can be parsed from environment variables with a single line. This way all applications built with this framework use the same set of environment variables for configuration.

```typescript
import {
  parseLambdaFrameworkOptionsFromEnv,
  LambdaFramework,
} from "easy-apigateway";

const options = parseLambdaFrameworkOptionsFromEnv();
export const lambda = new LambdaFramework(options);
```

### Configuration Options

| Environment variable | Description                                   | Default value |
| -------------------- | --------------------------------------------- | ------------- |
| `STAGE`              | The environment in which the code is running. | `development` |
| `JWT_ISSUER`         | The expected issuer of incoming JWT tokens.   | _required_    |

## Special Handlers

There's a few common special lambda handlers that you'll need in most of your applications:

### Authorizer

Use this handler as the authorizer in your API Gateway.

```typescript
import { createTokenAuthorizer } from "easy-apigateway";

export const handler = createTokenAuthorizer(async (authToken) => ({
  authToken,
  principalId: "test",
  permissions: ["a", "b"],
}));
```

### Options

Use this handler to allow `OPTIONS` request to enable CORS.

```typescript
import { lambda } from "../lambda";

export const handler = lambda.createOptionsLambda();
```

## Caching

The frameworks adds helpers to apply [standard HTTP caching behavior](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching) to your handlers.

```typescript
import { lambda } from "../lambda";
import { extractLastModifiedFromProperty } from "easy-apigateway";

export const handler = lambda.authorized(
  async () => {
    // return a simple object for demonstration
    return { updatedAt: Date.now() };
  },
  {
    caching: {
      cacheControl: "private",
      getLastModified: extractLastModifiedFromProperty("updatedAt"),
      maxAge: 3600000,
    },
  }
);
```

With this configuration the handler will apply the following additional operations on your response:

- Add the response header `Cache-Control: private`.
- Add the response header `ETag: ...` based on the response body.
- If the request contains a header `If-None-Match` and the value matches the ETag: Send a `304 Not Modified` response without a body.
- If the response object contains a field `updatedAt`:
  - Add a `Last-Modified` response header.
  - Add an `Expires` response header using the value provided as `maxAge`.
  - If the request contains a header `If-Modified-Since` and the resource was not modified after the requested time: Send a `304 Not Modified` response without a body.

## Local Development Server

This framework provides helpers to run your API locally in a fashion that tries to resemble API Gateway as closely as possible.

First, install additional dependencies:

```bash
npm i -D express body-parser ts-node
```

Then, create the local server, eg. in `src/local.ts`:

```typescript
import * as express from "express";
import { createLocalExpressAPI, HandlerMap, Route } from "easy-apigateway";

// Import your lambdas created by the framework.
import { handler as optionsHandler } from "../lambdas/options";
import { handler as getOrganization } from "../lambdas/getOrganization";

const app = express();

// Important: disable automatic generation of ETag headers, because we add them ourselves.
app.set("etag", false);

// Map from `handlerId` to actual lambda handler.
const handlers: HandlerMap = {
  getOrganization,
};

const routes: Array<Route> = [
  {
    method: "GET",
    // Use API Gateway path variables with curly braces.
    // They will automatically be converted to the express
    // way with a leading colon.
    path: "/organizations/{orgId}",
    // There needs to be a corresponding entry in the hanlder map.
    handlerId: "getOrganization",
  },
];

// Mount the API at the root.
app.use(
  createLocalExpressAPI({
    handlers,
    routes,
    // If an `optionsHandler` is provided, every route will automatically
    // get an additional `OPTIONS` route with this handler.
    optionsHandler,
  })
);

// Start the server.
const port = process.env.PORT || 3001;
app.listen(port, () => console.log("listening on port %d", port));
```

You can now start the server with `ts-node src/local.ts`.

**Hint:** If you store your route configuration in a JSON file, you can use the same file to configure your infrastructure deployment, eg. with Pulumi. This way the local server and your actual deployment are always in sync.

## Helpers

The library provides a few helper methods to ease your day-to-day life:

### Common Responses

There's helpers to return common successful HTTP responses.

```typescript
import { lambda } from "./lambda";
import { created } from "easy-apigateway";

export const handler = lambda.authorized(async () => {
  const resource = await createResource();
  const location = `/resource/${resource.id}`;
  return created(location);
});
```

### Common Error Responses

There's helpers to throw errors for all common non-success HTTP status codes.

```typescript
import { lambda } from "./lambda";
import { badRequestError } from "easy-apigateway";

export const handler = lambda.authorized(() => {
  if (validationFailed) throw badRequestError();
  return { message: "ok" };
});
```
