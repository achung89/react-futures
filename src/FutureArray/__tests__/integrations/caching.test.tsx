jest.mock('scheduler', () => require('scheduler/unstable_mock'));
import { futureArray } from '../../../internal';

import {
  testSuspenseWithLoader,
  testRenderWithoutSuspense,
} from '../../../test-utils/testSuspense';
import { reverseImm } from "../../../test-utils/reverseImm";
import waitForSuspense from '../../../test-utils/waitForSuspense';

jest.useFakeTimers();

let StubFutureArray;
// TODO: write more tests
beforeEach(() => {
  
  StubFutureArray = futureArray(
    val =>
      new Promise((res, rej) => {
        setTimeout(() => {
          try {
            res([1, 2, 3, val]);
          } catch (err) {
            console.error(err);
            rej(err);
          }
        }, 100);
      })
  );
});

afterEach(() => {
  StubFutureArray = null;
});

describe('Caching arrays instantiated in render', () => {
  const App = ({ nestedFuture = false }) => {
    let numbers = reverseImm(new StubFutureArray(4)
      .map(val => val + 1) // [2,3,4,5]
      .concat([6, 7, 8]) // [2,3,4,5,6,7,8]
      .filter(val => val % 2 === 0) // [2,4,6,8]
    ); // [8,6,4,2]

    const nums = nestedFuture ? createNestedFuture(numbers) : numbers; // [9,9]

    return <div>{nums}</div>;
  };

  test('should not cache shallow renders', async () => {
    await testSuspenseWithLoader(<App />, `<div>8642</div>`, async () => {
      await waitForSuspense(100);
    });
    await testRenderWithoutSuspense(<App />, `<div>Loading...</div>`);
  });

  test('should not cache deep renders', async () => {
    await testSuspenseWithLoader(<App nestedFuture />, `<div>99</div>`, async () => {
      await waitForSuspense(100);
      await waitForSuspense(100);
    });
    await testRenderWithoutSuspense(<App nestedFuture />, `<div>Loading...</div>`);
  });
});

const createNestedFuture = numbers => {
  let numbers2 = new StubFutureArray(7); //[1,2,3,7];
  return numbers
    .map((num, ind) => num + numbers2[ind]) // [9,8,7,9]
    .filter(num =>
      new StubFutureArray(8) // [1,2,3,8]
        .map(num => num * 3) // [3,6,9,24]
        .includes(num)
    ); //[9,9]
};
