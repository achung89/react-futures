//setupTests.tsx
jest.mock("scheduler", () => require("scheduler/unstable_mock"));
import delay from "delay";

const cryptoNode = require("crypto");

Object.defineProperty(global.self, "crypto", {
  value: {
    getRandomValues: (arr) => cryptoNode.randomBytes(arr.length),
  },
});

global.Request = class Request {
  [Symbol.hasInstance]() {
    return false;
  }
};

global.fetch = jest.fn().mockImplementation(async (path) => {
  try {
    await delay(100);
    const url = new URL(path);
    const value = url.searchParams.get("value");

    switch (url.pathname) {
      case "/blogs":

        return {
          json: async () => {
            require("scheduler/unstable_mock").unstable_yieldValue("Promise Resolved");

            try {
              return [2, 3, 4, Number(value ?? 5)];
            } catch (err) {
              console.error(err);

              throw err;
            }
          },
        };
      case "/person":

        return {
          json: async () => {
            require("scheduler/unstable_mock").unstable_yieldValue("Promise Resolved");

            try {
              return { value: Number(value ?? 20) };
            } catch (err) {
              console.error(err);

              throw err;
            }
          },
        };
      default:
        throw new Error("Invalid Route:" + path);
    }
  } catch (err) {
    console.error(err);
    throw err;
  }
});
