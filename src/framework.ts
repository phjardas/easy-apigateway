import type { LambdaFramework, LambdaFrameworkOptions } from "./types";

export function createLambdaFramework(
  options: LambdaFrameworkOptions = {},
  id: string = createFrameworkId()
): LambdaFramework {
  return { id, options };
}

function createFrameworkId() {
  return Math.random().toString().substring(2);
}
