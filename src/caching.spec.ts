import { describe, expect, it } from "@jest/globals";
import { extractLastModifiedFromProperty } from ".";
import { applyCacheConfig } from "./caching";

describe("caching", () => {
  describe("applyCacheConfig", () => {
    it("should add `last-modified` and `expires` headers if modification timestamp is found and no request headers present", () => {
      const body = { updatedAt: 1638867335122 };

      const result = applyCacheConfig({
        result: { statusCode: 200, body: JSON.stringify(body) },
        body,
        options: { getLastModified: (b) => b.updatedAt, maxAge: 3600000 },
        requestHeaders: {},
      });

      expect(result.statusCode).toBe(200);
      expect(result.body).toBe('{"updatedAt":1638867335122}');
      expect(result.headers).toEqual({
        etag: 'W/"1b-Kvl7j3Cm9OBjq13jSIprFOJ30JA"',
        expires: "Tue, 07 Dec 2021 09:55:35 GMT",
        "last-modified": "Tue, 07 Dec 2021 08:55:35 GMT",
      });
    });

    it("should not add `last-modified` and `expires` headers if modification timestamp is not found and no request headers present", () => {
      const body = {};

      const result = applyCacheConfig({
        result: { statusCode: 200, body: JSON.stringify(body) },
        body,
        options: { maxAge: 3600000 },
        requestHeaders: {},
      });

      expect(result.statusCode).toBe(200);
      expect(result.body).toBe("{}");
      expect(result.headers).toEqual({
        etag: 'W/"2-vyGp6PvFo4RvsFtPoIWeCReyIC8"',
      });
    });

    it("should return 304 response if request header `if-modified-since` is after the last modification", () => {
      const body = { updatedAt: 1638867335122 };

      const result = applyCacheConfig({
        result: { statusCode: 200, body: JSON.stringify(body) },
        body,
        options: { getLastModified: (b) => b.updatedAt, maxAge: 3600000 },
        requestHeaders: {
          "if-modified-since": "Tue, 07 Dec 2021 08:55:36 GMT",
        },
      });

      expect(result.statusCode).toBe(304);
      expect(result.body).toBe("");
      expect(result.headers).toEqual({
        etag: 'W/"1b-Kvl7j3Cm9OBjq13jSIprFOJ30JA"',
        expires: "Tue, 07 Dec 2021 09:55:35 GMT",
        "last-modified": "Tue, 07 Dec 2021 08:55:35 GMT",
      });
    });

    it("should return 304 response if request header `if-modified-since` is at the last modification", () => {
      const body = { updatedAt: 1638867335122 };

      const result = applyCacheConfig({
        result: { statusCode: 200, body: JSON.stringify(body) },
        body,
        options: { getLastModified: (b) => b.updatedAt, maxAge: 3600000 },
        requestHeaders: {
          "if-modified-since": "Tue, 07 Dec 2021 08:55:35 GMT",
        },
      });

      expect(result.statusCode).toBe(304);
      expect(result.body).toBe("");
      expect(result.headers).toEqual({
        etag: 'W/"1b-Kvl7j3Cm9OBjq13jSIprFOJ30JA"',
        expires: "Tue, 07 Dec 2021 09:55:35 GMT",
        "last-modified": "Tue, 07 Dec 2021 08:55:35 GMT",
      });
    });

    it("should return normal response if request header `if-modified-since` is before the last modification", () => {
      const body = { updatedAt: 1638867335122 };

      const result = applyCacheConfig({
        result: { statusCode: 200, body: JSON.stringify(body) },
        body,
        options: { getLastModified: (b) => b.updatedAt, maxAge: 3600000 },
        requestHeaders: {
          "if-modified-since": "Tue, 07 Dec 2021 08:55:34 GMT",
        },
      });

      expect(result.statusCode).toBe(200);
      expect(result.body).toBe('{"updatedAt":1638867335122}');
      expect(result.headers).toEqual({
        etag: 'W/"1b-Kvl7j3Cm9OBjq13jSIprFOJ30JA"',
        expires: "Tue, 07 Dec 2021 09:55:35 GMT",
        "last-modified": "Tue, 07 Dec 2021 08:55:35 GMT",
      });
    });

    it("should return 304 response if request header `if-none-match` matches the ETag", () => {
      const body = {};

      const result = applyCacheConfig({
        result: { statusCode: 200, body: JSON.stringify(body) },
        body,
        options: {},
        requestHeaders: {
          "if-none-match": 'W/"2-vyGp6PvFo4RvsFtPoIWeCReyIC8"',
        },
      });

      expect(result.statusCode).toBe(304);
      expect(result.body).toBe("");
      expect(result.headers).toEqual({
        etag: 'W/"2-vyGp6PvFo4RvsFtPoIWeCReyIC8"',
      });
    });

    it("should return normal response if request header `if-none-match` does not match the ETag", () => {
      const body = {};

      const result = applyCacheConfig({
        result: { statusCode: 200, body: JSON.stringify(body) },
        body,
        options: {},
        requestHeaders: { "if-none-match": 'W/"this-does-not-match"' },
      });

      expect(result.statusCode).toBe(200);
      expect(result.body).toBe("{}");
      expect(result.headers).toEqual({
        etag: 'W/"2-vyGp6PvFo4RvsFtPoIWeCReyIC8"',
      });
    });

    it("should apply custom `cache-control` header", () => {
      const body = {};

      const result = applyCacheConfig({
        result: { statusCode: 200, body: JSON.stringify(body) },
        body,
        options: { cacheControl: "private" },
        requestHeaders: {},
      });

      expect(result.statusCode).toBe(200);
      expect(result.body).toBe("{}");
      expect(result.headers).toEqual({
        etag: 'W/"2-vyGp6PvFo4RvsFtPoIWeCReyIC8"',
        "cache-control": "private",
      });
    });
  });

  describe("extractLastModifiedFromProperty", () => {
    it("should extract property from an object body", () => {
      expect(
        extractLastModifiedFromProperty("updatedAt")({ updatedAt: 1 }),
      ).toBe(1);
    });

    it("should not extract property from a string body", () => {
      expect(extractLastModifiedFromProperty("updatedAt")("x")).toBeUndefined();
    });

    it("should extract largest property from an array of objects", () => {
      expect(
        extractLastModifiedFromProperty("updatedAt")([
          { updatedAt: 2 },
          {},
          { updatedAt: 3 },
          { updatedAt: 1 },
        ]),
      ).toBe(3);
    });

    it("should not extract property from an array of objects with no matching property", () => {
      expect(
        extractLastModifiedFromProperty("updatedAt")([{}, {}]),
      ).toBeUndefined();
    });
  });
});
