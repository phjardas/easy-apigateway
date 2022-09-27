import { verify } from "jsonwebtoken";
import { createGetPublicKey } from "./jwks";
import type { JwtOptions, JwtVerifyer } from "./types";

export function createJwtVerifyer(options: JwtOptions): JwtVerifyer {
  const { algorithms } = options;
  const issuers = toArray(options.issuer);
  const audience = toArray(options.audience);
  const getPublicKey = createGetPublicKey(issuers);

  return (authToken) =>
    new Promise((resolve, reject) =>
      verify(
        authToken,
        getPublicKey,
        { algorithms, issuer: issuers, audience },
        (err, payload) => {
          if (err) return reject(err);
          if (!payload) return reject(new Error("No JWT payload"));

          if (typeof payload === "string") {
            return reject(
              new Error("JWT verification result should be an object")
            );
          }

          resolve(payload);
        }
      )
    );
}

function toArray<T>(value: T | Array<T>): Array<T> {
  return Array.isArray(value) ? value : [value];
}
