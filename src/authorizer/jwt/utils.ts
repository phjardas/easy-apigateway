export function scrubUrl(url: string): string {
  return url.replace(/\/$/, "");
}

export function notEmpty<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}
