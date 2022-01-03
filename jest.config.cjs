module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ["<rootDir>src/setupTests.ts"],
  "testRegex": "src/.*\\.test\\.(ts|tsx|js|jsx)$",
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
};
