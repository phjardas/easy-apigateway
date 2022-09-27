export default {
  coverageProvider: "v8",
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/*.(test|spec).ts"],
  transform: {
    ".ts$": ["ts-jest"],
  },
};
