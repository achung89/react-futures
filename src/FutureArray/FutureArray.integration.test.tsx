import React, {Suspense} from 'react';
import { createFutureArray } from '../index';
import waitForSuspense from "../test-utils/waitForSuspense";
import ReactDOM from 'react-dom';
import {act} from 'react-dom/test-utils'
jest.mock('scheduler', () => require('scheduler/unstable_mock'));
jest.useFakeTimers()

// test resetting value array prop with future array 
/** obj.foo = new Array(() => obj.foo).map() EDIT: will be taken cae of by oblique types*/
// test suspending in same function as instantiation
// test suspending in child 
// testing iterating in parent and in child and accessing in child or subchild


let container;
beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
});
afterEach(() => {
  document.body.removeChild(container);
  container = null;
});

describe("integration scenarios", () => {
  test("should render ", async () => {
    const FutureArr = createFutureArray(val => new Promise((res,rej) => {
      setTimeout(() => {
        res([1,2,3,val]);
      }, 1000)
    }));
    let App = () => {
      const numbers = new FutureArr(4)
                       .map(val => val + 1) // [2,3,4,5]
                       .concat([6,7,8]) // [2,3,4,5,6,7,8]
                       .filter( val => val % 2 === 0) // [3,5,7]
                       .immReverse() // [7,5,3]

      return <div>
        {numbers}
      </div>
    }
    await act(async () => {
      ReactDOM.createRoot(container).render(
        <Suspense fallback={<div>Loading...</div>}>
          <App />
        </Suspense>
      )
      await Promise.resolve()
    })
    jest.runOnlyPendingTimers();
    await Promise.resolve();
    await Promise.resolve();

    act(() => {
      expect(container.innerHTML).toEqual(`<div>Loading...</div>`);
    })
    
    await waitForSuspense(2000);
    expect(container.innerHTML).toEqual(`<div>753</div>`)
  })

});