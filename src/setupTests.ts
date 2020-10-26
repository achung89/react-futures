//setupTests.tsx
const cryptoNode = require('crypto');

Object.defineProperty(global.self, 'crypto', {
  value: {
    getRandomValues: arr => cryptoNode.randomBytes(arr.length)
  }
});