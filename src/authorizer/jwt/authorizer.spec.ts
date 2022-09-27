import { afterAll, beforeAll, describe, expect, it, jest } from "@jest/globals";
import type { APIGatewayTokenAuthorizerEvent, Context } from "aws-lambda";
import { createLambdaFramework } from "../../framework";
import { createAuthorizerPolicy } from "../utils";
import { createJwtAuthorizer } from "./authorizer";
import { JwtTestFramework } from "./jwt-test";
import type { JwtOptions } from "./types";

describe("jwt", () => {
  describe("createJwtAuthorizer", () => {
    const oldConsoleError = console.error;
    const jwt = new JwtTestFramework();

    beforeAll(async () => {
      console.error = jest.fn();
      await jwt.setUp();
    });

    afterAll(async () => {
      console.error = oldConsoleError;
      await jwt.tearDown();
    });

    const audience = "http://localhost:9876";

    const authorize = async (event: APIGatewayTokenAuthorizerEvent) => {
      const jwtOptions: JwtOptions = { issuer: jwt.issuer, audience };
      const framework = createLambdaFramework();
      const authorizer = createJwtAuthorizer(framework, jwtOptions);
      const callback = jest.fn(() => undefined);
      const context = {} as Context;
      const result = await authorizer(event, context, callback);
      expect(callback).not.toBeCalled();
      return result;
    };

    it("should accept a valid access token", async () => {
      const token = await jwt.createToken({ sub: "some-user", aud: audience });

      await expect(
        authorize({
          type: "TOKEN",
          authorizationToken: `Bearer ${token}`,
          methodArn: "some-method-arn",
        })
      ).resolves.toEqual({
        principalId: "some-user",
        policyDocument: createAuthorizerPolicy("some-method-arn"),
        context: {
          authToken: token,
          permissions: "[]",
        },
      });
    });

    it("should take user id from a custom claim", async () => {
      const token = await jwt.createToken({
        sub: "some-user",
        aud: audience,
        [`${jwt.issuer}userId`]: "custom-user-id",
      });

      await expect(
        authorize({
          type: "TOKEN",
          authorizationToken: `Bearer ${token}`,
          methodArn: "some-method-arn",
        })
      ).resolves.toEqual({
        principalId: "custom-user-id",
        policyDocument: createAuthorizerPolicy("some-method-arn"),
        context: {
          authToken: token,
          permissions: "[]",
        },
      });
    });

    it("should fail if the token does not have a subject", async () => {
      const token = await jwt.createToken({ aud: audience });

      await expect(
        authorize({
          type: "TOKEN",
          authorizationToken: `Bearer ${token}`,
          methodArn: "some-method-arn",
        })
      ).rejects.toEqual("Unauthorized");
    });

    it("should take permissions from the access token", async () => {
      const token = await jwt.createToken({
        sub: "some-user",
        aud: audience,
        permissions: ["some-permission", "another-permission"],
      });

      await expect(
        authorize({
          type: "TOKEN",
          authorizationToken: `Bearer ${token}`,
          methodArn: "some-method-arn",
        })
      ).resolves.toEqual({
        principalId: "some-user",
        policyDocument: createAuthorizerPolicy("some-method-arn"),
        context: {
          authToken: token,
          permissions: '["some-permission","another-permission"]',
        },
      });
    });

    it("should ignore permissions if the claim is invalid", async () => {
      const token = await jwt.createToken({
        sub: "some-user",
        aud: audience,
        permissions: "this-should-be-an-array",
      });

      await expect(
        authorize({
          type: "TOKEN",
          authorizationToken: `Bearer ${token}`,
          methodArn: "some-method-arn",
        })
      ).resolves.toEqual({
        principalId: "some-user",
        policyDocument: createAuthorizerPolicy("some-method-arn"),
        context: {
          authToken: token,
          permissions: "[]",
        },
      });
    });

    it("should fail if the token does not have an issuer", async () => {
      const token = await jwt.createToken({
        sub: "userId",
        aud: audience,
        iss: undefined,
      });

      await expect(
        authorize({
          type: "TOKEN",
          authorizationToken: `Bearer ${token}`,
          methodArn: "some-method-arn",
        })
      ).rejects.toEqual("Unauthorized");
    });

    it("should fail if the token is not of type Bearer", async () => {
      const token = await jwt.createToken({ sub: "userId", aud: audience });

      await expect(
        authorize({
          type: "TOKEN",
          authorizationToken: token,
          methodArn: "some-method-arn",
        })
      ).rejects.toEqual("Unauthorized");
    });
  });
});
