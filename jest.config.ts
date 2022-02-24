export default {
  coverageProvider: "v8",
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/*.(test|spec).ts"],
  globals: {
    "ts-jest": {
      diagnostics: {
        ignoreCodes: ["TS151001"],
      },
    },
  },
};
