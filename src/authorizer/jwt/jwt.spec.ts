import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import { JwtTestFramework } from "./jwt-test";

describe("jwt", () => {
  describe("createJwtVerifyer", () => {
    const jwt = new JwtTestFramework();

    beforeAll(async () => {
      await jwt.setUp();
    });

    afterAll(async () => {
      await jwt.tearDown();
    });

    it("should verify JWT with public key from well-known JWKS URL", async () => {
      const token = await jwt.createToken({ sub: "subject", aud: "audience" });
      const verifyer = jwt.createJwtVerifyer({ audience: "audience" });

      const payload = await verifyer(token);
      expect(payload.iss).toBe(jwt.issuer);
      expect(payload.sub).toBe("subject");
    });
  });
});
