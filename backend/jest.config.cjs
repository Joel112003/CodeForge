module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/test"],
  testMatch: ["**/api.test.js", "**/*.jest.test.js"],
  clearMocks: true,
  collectCoverageFrom: [
    "app.js",
    "src/**/*.js",
    "!src/config/migrate.js",
  ],
};
