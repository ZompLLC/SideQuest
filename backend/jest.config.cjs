module.exports = {
  testEnvironment: "node",
  transform: {
    "^.+\\.tsx?$": "babel-jest",
  },
  // Source uses NodeNext-style relative imports ending in ".js" even though
  // the files are ".ts" -- strip the suffix so Jest's resolver can find them.
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  testMatch: ["**/__tests__/**/*.test.ts"],
  testTimeout: 15000,
};
