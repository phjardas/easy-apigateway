import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
} from "@jest/globals";
import { rest } from "msw";
import { setupServer, SetupServerApi } from "msw/node";
import { JWK, JWS } from "node-jose";
import { createJwtVerifyer, JwtAlgorithm } from "./jwt";

describe("jwt", () => {
  let server: SetupServerApi;

  beforeAll(() => {
    server = setupServer();
    server.listen();
  });
  afterAll(() => server?.close());
  afterEach(() => server?.resetHandlers());

  const algorithms: Array<JwtAlgorithm> = [
    "RS256",
    "RS384",
    "RS512",
    "ES256",
    "ES384",
    "ES512",
    "PS256",
    "PS384",
    "PS512",
  ];

  algorithms.map((algorithm) =>
    it(`should verify token using JWKS from issuer with algorithm ${algorithm}`, async () => {
      const { issuer, audience, createToken } = await createIssuer(
        algorithm,
        "https://issuer.com",
        "https://audience.com",
        server
      );

      const verifyer = createJwtVerifyer({
        issuer,
        audience,
        algorithm,
      });

      const token = await createToken("test");

      await expect(verifyer(token)).resolves.toEqual({
        sub: "test",
        iss: issuer,
        aud: audience,
      });
    })
  );
});

async function createIssuer(
  algorithm: JwtAlgorithm,
  issuer: string,
  audience: string,
  server: SetupServerApi
) {
  const keystore = JWK.createKeyStore();
  const { kty, size } = getKeyOptions(algorithm);
  const key = await keystore.generate(kty, size, {
    alg: algorithm,
    use: "sig",
  });

  server.use(
    rest.get(`${issuer}/.well-known/jwks.json`, (_, res, ctx) =>
      res(ctx.json(keystore.toJSON()))
    )
  );

  return {
    issuer,
    audience,
    async createToken(sub: string) {
      const result = await JWS.createSign(
        { format: "compact", fields: { typ: "jwt" } },
        key
      )
        .update(JSON.stringify({ sub, iss: issuer, aud: audience }))
        .final();
      return result.toString();
    },
  };
}

function getKeyOptions(algorithm: JwtAlgorithm): {
  kty: string;
  size: string | number;
} {
  if (algorithm.startsWith("RS") || algorithm.startsWith("PS")) {
    return { kty: "RSA", size: 2048 };
  }

  if (algorithm.startsWith("ES")) {
    const curves: Record<string, string> = {
      ES256: "P-256",
      ES384: "P-384",
      ES512: "P-521",
    };
    return { kty: "EC", size: curves[algorithm as string] };
  }

  throw new Error(`Don't know how to create key for algorithm: ${algorithm}`);
}
