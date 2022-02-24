import type { AuthorizerContext } from "../types";

export type AuthorizerContextCreator = (
  authorizationToken: string
) => AuthorizerContext | Promise<AuthorizerContext>;
