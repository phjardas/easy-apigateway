/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it } from "@jest/globals";
import { Context } from "aws-lambda";
import { InternationalizableError } from "./error";
import { notFoundError } from "./errors";
import { LambdaFramework } from "./framework";
import { HTTPLambdaHandler } from "./types";

describe("framework", () => {
  describe("unauthorized()", () => {
    it("should work without JWT settings", () => {
      new LambdaFramework({ stage: "test" }).unauthorized(async () => null);
    });
  });

  describe("authorized()", () => {
    it("should work without JWT settings", () => {
      new LambdaFramework({ stage: "test" }).authorized(async () => null);
    });
  });

  describe("createErrorResponse", () => {
    const execute = async (handler: HTTPLambdaHandler) => {
      const framework = new LambdaFramework({
        stage: "test",
      });

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

      return framework.unauthorized(handler)(event, context, callback);
    };

    it("should parse response code from StatusError", async () => {
      const response = await execute(async () => {
        throw notFoundError();
      });

      expect(response).toBeTruthy();
      expect(response!.body).toEqual(
        JSON.stringify({ message: "Not Found", messageKey: "errors.http.404" }),
      );
      expect(response!.statusCode).toEqual(404);
    });

    it("should parse response code from InternationalizableError", async () => {
      const response = await execute(async () => {
        throw new InternationalizableError({
          messageKey: "errors.test",
          messageArgs: ["arg1", "arg2"],
          message: "Test Error",
        });
      });

      expect(response).toBeTruthy();
      expect(response!.body).toEqual(
        JSON.stringify({
          message: "Test Error",
          messageKey: "errors.test",
          messageArgs: ["arg1", "arg2"],
        }),
      );
      expect(response!.statusCode).toEqual(500);
    });
  });
});
