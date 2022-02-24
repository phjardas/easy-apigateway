import { JwtHeader, SigningKeyCallback, verify } from "jsonwebtoken";
import { JwksClient } from "jwks-rsa";
import { AuthorizerContext } from "../types";
import { AuthorizerContextCreator } from "./types";

export type JwtAlgorithm =
  | "HS256"
  | "HS384"
  | "HS512"
  | "RS256"
  | "RS384"
  | "RS512"
  | "ES256"
  | "ES384"
  | "ES512"
  | "PS256"
  | "PS384"
  | "PS512";

export interface JwtPayload {
  iss?: string;
  sub?: string;
  aud?: string | Array<string>;
  exp?: number;
  nbf?: number;
  iat?: number;
  jti?: string;
  [key: string]:
    | string
    | number
    | boolean
    | Array<string | number | boolean>
    | undefined;
}

export type JwtVerifyer = (authToken: string) => Promise<JwtPayload>;

export type JwtOptions = {
  /**
   * The expected issuer of incoming JWT tokens.
   */
  issuer: string;

  /**
   * The expected audience(s) of incoming JWT tokens.
   */
  audience?: string | Array<string>;

  /**
   * The accepted algorithm(s) of incoming JWT tokens.
   */
  algorithm?: JwtAlgorithm | Array<JwtAlgorithm>;
};

export function createJwtVerifyer(options: JwtOptions): JwtVerifyer {
  const { algorithm, issuer, audience } = options;
  const algorithms = algorithm
    ? Array.isArray(algorithm)
      ? algorithm
      : [algorithm]
    : undefined;

  const jwksUri = `${scrubUrl(issuer)}/.well-known/jwks.json`;
  const jwksClient = new JwksClient({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 10,
    jwksUri,
  });

  function getPublicKey(header: JwtHeader, callback: SigningKeyCallback) {
    jwksClient
      .getSigningKey(header.kid)
      .then((key) => callback(null, key.getPublicKey()))
      .catch(callback);
  }

  return (authToken) =>
    new Promise((resolve, reject) =>
      verify(
        authToken,
        getPublicKey,
        { algorithms, issuer, audience },
        (err, payload) => {
          if (err) return reject(err);
          if (!payload) return reject(new Error("No JWT payload"));
          resolve(payload as JwtPayload);
        }
      )
    );
}

function scrubUrl(url: string): string {
  return url.replace(/\/$/, "");
}

export function createJwtAuthorizer({
  parsePayload,
  ...options
}: JwtOptions & {
  parsePayload: (
    payload: JwtPayload
  ) =>
    | Omit<AuthorizerContext, "authToken">
    | Promise<Omit<AuthorizerContext, "authToken">>;
}): AuthorizerContextCreator {
  const verifyer = createJwtVerifyer(options);

  return async (authorizationToken) => {
    const [type, token] = authorizationToken.split(/\s+/, 2);
    if (type !== "Bearer") {
      throw new Error(`Invalid authorization token type: ${type}`);
    }

    const payload = await verifyer(token);
    const context = await parsePayload(payload);
    return { authToken: token, ...context };
  };
}
