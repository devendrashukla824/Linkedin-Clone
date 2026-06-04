export default {
  displayName: "api",
  extensionsToTreatAsEsm: [".ts"],
  moduleNameMapper: {
    "^#src/(.*)\\.js$": "<rootDir>/src/$1",
    "^#src/(.*)$": "<rootDir>/src/$1"
  },
  rootDir: ".",
  testEnvironment: "node",
  testMatch: ["<rootDir>/src/**/*.test.ts"],
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        tsconfig: "<rootDir>/tsconfig.json",
        useESM: true,
        diagnostics: {
          ignoreCodes: [151002]
        }
      }
    ]
  }
};
