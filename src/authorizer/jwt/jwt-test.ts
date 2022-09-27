import nock from "nock";
import { JWK, JWS } from "node-jose";
import { createJwtVerifyer } from "./jwt";
import { JwtOptions, JwtVerifyer } from "./types";

export class JwtTestFramework {
  readonly algorithm = "RS256";
  readonly issuer = "https://issuer/";
  private key: JWK.Key | undefined;

  async setUp() {
    const keystore = JWK.createKeyStore();

    this.key = await keystore.generate("RSA", 512, {
      alg: this.algorithm,
      use: "sig",
    });

    nock(this.issuer)
      .persist()
      .get("/.well-known/jwks.json")
      .reply(200, JSON.stringify(keystore.toJSON(true)));
  }

  async tearDown() {
    nock.restore();
  }

  async createToken(payload: Record<string, unknown>): Promise<string> {
    if (!this.key) throw new Error("call setUp() first");

    const token = await JWS.createSign(
      {
        alg: this.algorithm,
        compact: true,
        fields: { typ: "jwt" },
      },
      this.key
    )
      .update(JSON.stringify({ iss: this.issuer, ...payload }))
      .final();

    return token.toString();
  }

  createJwtVerifyer(options: Pick<JwtOptions, "audience">): JwtVerifyer {
    return createJwtVerifyer({
      ...options,
      algorithms: [this.algorithm],
      issuer: this.issuer,
    });
  }
}
