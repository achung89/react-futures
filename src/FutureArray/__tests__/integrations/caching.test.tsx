jest.mock("scheduler", () => require("scheduler/unstable_mock"));
import { createFutureArray } from "../../../index";

import React from "react";
import { testSuspenseWithLoader, testRenderWithoutSuspense } from "../../../test-utils/testSuspense";

jest.useFakeTimers();

let StubFutureArray;

beforeEach(() => {
  StubFutureArray = createFutureArray(
    val =>
      new Promise((res, rej) => {
        setTimeout(() => {
          try {
            res([1, 2, 3, val]);
          } catch (err) {
            console.error(err);
            rej(err);
          }
        }, 1000);
      })
  );
});

afterEach(() => {
  StubFutureArray.reset();
  StubFutureArray = null;
});

describe('Caching arrays instantiated in render',  () => {
  test("should cache shallow renders", async () => {

    const App = ({ nestedFuture = false }) => {
      let numbers = new StubFutureArray(4)
        .map(val => val + 1) // [2,3,4,5]
        .concat([6, 7, 8]) // [2,3,4,5,6,7,8]
        .filter(val => val % 2 === 0) // [2,4,6,8]
        .immReverse(); // [8,6,4,2]

      const nums  = nestedFuture ? createNestedFuture(numbers) : numbers // [9,9]

      return <div>{nums}</div>;
    };

    await testSuspenseWithLoader(<App />, `<div>8642</div>`);
    await testRenderWithoutSuspense(<App />, `<div>8642</div>`);
    await testRenderWithoutSuspense(<App nestedFuture />, `<div>99</div>`);

    StubFutureArray.reset();
  });

});


const createNestedFuture = numbers =>{
  let numbers2 = new StubFutureArray(7); //[1,2,3,7];
  return numbers
    .map((num, ind) => num + numbers2[ind]) // [9,8,7,9]
    .filter(num =>
      new StubFutureArray(8) // [1,2,3,8]
        .map(num => num * 3) // [3,6,9,24]
        .includes(num)
    ); //[9,9]
}
