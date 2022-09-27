export type Algorithm =
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
  issuer: string | Array<string>;

  /**
   * The expected audience(s) of incoming JWT tokens.
   */
  audience: string | Array<string>;

  /**
   * The accepted algorithm(s) of incoming JWT tokens. Defaults to `HS256`.
   */
  algorithms?: Array<Algorithm>;

  getPrincipalId?(payload: JwtPayload): string;

  getPermissions?(payload: JwtPayload): Array<string>;
};
