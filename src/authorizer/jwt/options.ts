import { optionsParser } from "../../options";
import type { Algorithm, JwtOptions } from "./types";

export const parseJwtOptionsFromEnv = optionsParser<JwtOptions>((get) => {
  return {
    issuer: toArray("JWT_ISSUER"),
    audience: toArray(get("JWT_AUDIENCE")),
    algorithms: toArrayMaybe(get("JWT_ALGORITHM", "")) as Array<Algorithm>,
  };
});

function toArrayMaybe(input?: string): Array<string> | undefined {
  return input ? toArray(input) : undefined;
}

function toArray(input: string): Array<string> {
  return input.split(/\s*,\s*/);
}
