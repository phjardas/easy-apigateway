import {
  GetPublicKeyOrSecret,
  type JwtHeader,
  type Secret,
  type SigningKeyCallback,
} from "jsonwebtoken";
import { JwksClient } from "jwks-rsa";
import { lookupCache } from "../../utils";
import { notEmpty, scrubUrl } from "./utils";

export function createGetPublicKey(
  issuers: Array<string>
): GetPublicKeyOrSecret {
  return (header: JwtHeader, callback: SigningKeyCallback) =>
    Promise.all(issuers.map((issuer) => getIssuerSigningKey(issuer, header)))
      .then((keys) => {
        const key = keys.find(notEmpty);
        if (!key) throw new Error("Unable to find a signing key");
        return key;
      })
      .then((key) => callback(null, key))
      .catch(callback);
}

const getJwksClient = lookupCache(
  (issuer: string) =>
    new JwksClient({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 10,
      jwksUri: `${scrubUrl(issuer)}/.well-known/jwks.json`,
    }),
  (k) => k
);

async function getIssuerSigningKey(
  issuer: string,
  header: JwtHeader
): Promise<Secret | undefined> {
  if (!header.kid) return;
  const client = getJwksClient(issuer);
  const keys = await client.getSigningKeys();
  const key = keys.find((k) => k.kid === header.kid);
  return key?.getPublicKey();
}
