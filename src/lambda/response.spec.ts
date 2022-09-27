import {
  jest,
  beforeEach,
  afterEach,
  describe,
  expect,
  it,
} from "@jest/globals";
import type { Context } from "aws-lambda";
import { InternationalizableError } from "../error";
import { notFoundError } from "../errors";
import { createLambdaFramework } from "../framework";
import type { HTTPLambdaHandler } from "../types";
import { unauthorized } from "./unauthorized";

describe("lambda", () => {
  describe("response", () => {
    const oldConsoleError = console.error;

    beforeEach(async () => {
      console.error = jest.fn();
    });

    afterEach(async () => {
      console.error = oldConsoleError;
    });

    const execute = async (handler: HTTPLambdaHandler) => {
      const framework = createLambdaFramework();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const event: any = {
        headers: {},
        requestContext: {
          authorizer: {
            principalId: "test",
            authToken: "token",
            permissions: "[]",
          },
        },
      };

      const context = {} as Context;

      const callback = () => {
        throw new Error("Callback should never be called!");
      };

      return unauthorized(framework, handler)(event, context, callback);
    };

    it("should parse response code from StatusError", async () => {
      const response = await execute(async () => {
        throw notFoundError();
      });

      expect(response.body).toEqual(
        JSON.stringify({
          message: "Not Found",
          messageKey: "errors.http.404",
          messageArgs: [],
        })
      );
      expect(response.statusCode).toEqual(404);
    });

    it("should parse response code from StatusError with custom i18n", async () => {
      const response = await execute(async () => {
        throw notFoundError("Custom message", "errors.custom", "arg1", "arg2");
      });

      expect(response.body).toEqual(
        JSON.stringify({
          message: "Custom message",
          messageKey: "errors.custom",
          messageArgs: ["arg1", "arg2"],
        })
      );
      expect(response.statusCode).toEqual(404);
    });

    it("should parse response code from InternationalizableError", async () => {
      const response = await execute(async () => {
        throw new InternationalizableError({
          messageKey: "errors.test",
          messageArgs: ["arg1", "arg2"],
          message: "Test Error",
        });
      });

      expect(response.body).toEqual(
        JSON.stringify({
          message: "Test Error",
          messageKey: "errors.test",
          messageArgs: ["arg1", "arg2"],
        })
      );
      expect(response.statusCode).toEqual(500);
    });
  });
});
