import { describe, expect, it } from "@jest/globals";
import { APIGatewayProxyEvent } from "aws-lambda";
import { StatusError } from "./error";
import { parseBody } from "./utils";

describe("utils", () => {
  it("parse a string body", () => {
    const result = parseBody({
      body: '{ "data": ["value"] }',
      isBase64Encoded: false,
    } as APIGatewayProxyEvent);

    expect(result).toEqual({ data: ["value"] });
  });

  it("parse a base64-encoded body", () => {
    const result = parseBody({
      body: "eyAiZGF0YSI6IFsidmFsdWUiXSB9",
      isBase64Encoded: true,
    } as APIGatewayProxyEvent);

    expect(result).toEqual({ data: ["value"] });
  });

  it("throw 400 if request body is required but not provided", () => {
    const action = () =>
      parseBody({ body: "", isBase64Encoded: false } as APIGatewayProxyEvent);

    expect(action).toThrowError("Missing request body");

    try {
      action();
    } catch (error) {
      if (!(error instanceof StatusError) || error.code !== 400) throw error;
    }
  });

  it("throw 400 if request body is not a valid JSON", () => {
    const action = () =>
      parseBody({
        body: "{ hello }",
        isBase64Encoded: false,
      } as APIGatewayProxyEvent);

    expect(action).toThrowError("Unexpected token h in JSON at position 2");

    try {
      action();
    } catch (error) {
      if (!(error instanceof StatusError) || error.code !== 400) throw error;
    }
  });
});
