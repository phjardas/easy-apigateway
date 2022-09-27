import type { DataStore } from "./types";

export function createDataStore(): DataStore {
  const data: Record<string, unknown> = {};

  return {
    get: <T>(key: string) => data[key] as T,

    getOrCreate: <T>(key: string, factory: () => T) => {
      let value = data[key];
      if (value === undefined) {
        value = factory();
        data[key] = value;
      }
      return value as T;
    },

    set: (key: string, value: unknown) => {
      data[key] = value;
    },
  };
}
