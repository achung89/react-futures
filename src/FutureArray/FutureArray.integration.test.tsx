import React, {Suspense} from 'react';
import { createFutureArray } from '../index';
import waitForSuspense from "../test-utils/waitForSuspense";
import ReactDOM from 'react-dom';
import {act} from 'react-dom/test-utils'
import waitForLoading from '../test-utils/waitForLoading';

jest.mock('scheduler', () => require('scheduler/unstable_mock'));
jest.useFakeTimers()

// test resetting value array prop with future array 
/** obj.foo = new Array(() => obj.foo).map() EDIT: will be taken cae of by oblique types*/
// test suspending in same function as instantiation
// test suspending in child 
// testing iterating in parent and in child and accessing in child or subchild


let container;
let StubFutureArray;
let root;
beforeEach(() => {
  console.log('befoerEach')
  container = document.createElement('div');
  console.log(1)
  document.body.appendChild(container);
  root = ReactDOM.createRoot(container);
  StubFutureArray = createFutureArray(val => new Promise((res,rej) => {
    setTimeout(() => {
      res([1,2,3,val]);
    }, 1000)
  }));
  console.log("beforeeach stub", StubFutureArray)
});
afterEach(() => {
  console.log('afterEach')
  StubFutureArray = null;
  root.unmount();
  root = null;
  container.remove();  
  container = null;

});

describe("integration scenarios", () => {
  
  test("should render ", async () => {

    let App = () => {
      const numbers = new StubFutureArray(4)
                       .map(val => val + 1) // [2,3,4,5]
                       .concat([6,7,8]) // [2,3,4,5,6,7,8]
                       .filter( val => val % 2 === 0) // [2,4,6,8]
                       .immReverse() // [8,6,4,2]

      return <div>
        {numbers}
      </div>
    }
    act( () => {
      root.render(
        <Suspense fallback={<div>Loading...</div>}>
          <App />
        </Suspense>
      )
    })
    
    waitForLoading();

    act(() => {
      expect(container.innerHTML).toEqual(`<div>Loading...</div>`);
    })
    await act(async () => {
      await waitForSuspense(2000);
    })
    act(() => {
      expect(container.innerHTML).toEqual(`<div>8642</div>`)
    })

  });
  test("should render deeply", async () => {
    let Deep = ({ numbers }) => <div>{numbers}</div>
    let App = () => {
      console.log(StubFutureArray);
      const numbers = new StubFutureArray(4)
                       .map(val => val + 1) // [2,3,4,5]
                       .concat([6,7,8]) // [2,3,4,5,6,7,8]
                       .filter( val => val % 2 === 0) // [2,4,6,8]
                       .immReverse() // [8,6,4,2]

      return <div>
        <Deep numbers={numbers} />
      </div>
    }
    act( () => {
      root.render(
        <Suspense fallback={<div>Loading...</div>}>
          <App />
        </Suspense>
      )
    })
    
    waitForLoading();

    act(() => {
      expect(container.innerHTML).toEqual(`<div>Loading...</div>`);
    })
    
    await waitForSuspense(2000);
    expect(container.innerHTML).toEqual(`<div><div>8642</div></div>`)
  });

});