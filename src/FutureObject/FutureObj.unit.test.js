
import React, { Suspense } from 'react';
import { createFutureObject } from '../index';
import { eachObjectStatic, eachFutureObjectStatic } from './FutureObj-statics';
import waitForSuspense from '../test-utils/waitForSuspense';
import FutureObject from './FutureObject';
import Effect from '../Effect/Effect';
import TestRenderer, { _Scheduler as Scheduler, act } from 'react-test-renderer';
import waitForLoading from '../test-utils/waitForLoading';

expect.extend(require('../test-utils/renderer-extended-expect'));	  


jest.useFakeTimers();
// TODO: test error handling
const expectedJSON = (val) => ({
  foo: "futon",
  bar: "barcandy",
  bazz: "bazzerita",
  value: val
})
// TODO: test obj instance methods
// TODO: assert return values of Object/FutureObj static methods
const fetchJson = val => new Promise((res, rej) => {
  setTimeout(() => {
    res(expectedJSON(val))
  }, 1000);
});

let renderer;
let FutureObj;
const LogSuspense = ({ action }) => {
  try {
    const val = action();
    Scheduler.unstable_yieldValue('No Suspense');
    if(typeof val !== 'undefined') {
      Scheduler.unstable_yieldValue(val);
    }
    return <div />;
  } catch (promise) {
    if (typeof promise.then === 'function') {
      Scheduler.unstable_yieldValue(`Suspend!`);
      throw promise
    } else {
      console.error(promise);
      Scheduler.unstable_yieldValue(`Error!`);
    }
  }
  return <div></div>
}

beforeEach(() => {

  jest.resetModules();
  FutureObj = createFutureObject(fetchJson);
});
afterEach(() => {
  FutureObj.reset();
  renderer.unmount()
  FutureObj = null;

  // document.body.removeChild(container);
  renderer = null
});

describe("Object static methods behaviour", () => {
  eachObjectStatic('Expect sync object static method $staticMethod to $inRender in render and $outRender outside render', async ({ staticMethod, inRender, outRender }) => {
    const futureObj = new FutureObj(1);
    const method = typeof staticMethod === 'string' ? Object[staticMethod] : staticMethod;
    const assertions = {
      autothrow: () => expect(() => method(futureObj)).toThrowError(/** TODO: create error */),
      throw: () => expect(() => method(futureObj)).toThrowError(/** TODO: outofrender error */),
      defer: () => expect(method(futureObj)).toBeInstanceOf(FutureObj),
      defermutate: () => expect(method(futureObj)).toBeInstanceOf(FutureObj),
      none: () => expect(() => method(futureObj)).not.toThrow(),
      suspend: () => method(futureObj)
    }

    act(() => {
      assertions[outRender]();
    })
    let resolved;

    const App = () => {
      return <Suspense fallback={<div>Loading...</div>}>
        <LogSuspense action={() => assertions[inRender]()}>
          <div>
            foo
        </div>
        </LogSuspense>
      </Suspense>

    };

    await act(async () => {
      renderer = TestRenderer.create(<App />, {
        unstable_isConcurrent: true,
      })
    });

    switch (inRender) {
      case "suspend":
        jest.runOnlyPendingTimers();
        expect(Scheduler).toClearYields([
          'Suspend!'
        ]);
        expect(Scheduler).toFlushAll()

        console.log("before rofl");
        await waitForSuspense(1500)
        expect(Scheduler).toClearYields([
          'No Suspense',
          method(expectedJSON(1))
        ]);
        break;
      case "throw":
        expect(Scheduler.unstable_clearYields()).toEqual([
          'Error!'
        ])
        break;
      case "defer":
        expect(renderer).toFlushAll([
          'No Suspense'
        ])
        expect(resolved).toBeInstanceOf(Effect);
        const resolved = await FutureObject.toPromise(resolved);
        expect(resolved).toEqual(Object[staticMethod](expectedJSON(1)))
        break;
      default:
        throw new Error(`Invalid value for inRender "${inRender}"`)
    }

  })

  eachFutureObjectStatic('Expect future object static method $staticMethod to $inRender in render and $outRender outside render', async ({ staticMethod, inRender, outRender }) => {
    const futureObj = new FutureObj;
    const method = typeof staticMethod === 'string' ? FutureObj[staticMethod] : staticMethod;
    const assertions = {
      renderThrow: () => expect(() => method(futureObj)).toThrowError(/** TODO: outofrender error */),
      throw: () => expect(() => method(futureObj)).toThrowError(/** TODO: outofrender error */),
      defer: () => expect(method(futureObj)).toBeInstanceOf(FutureObj),
      defermutate: () => expect(method(futureObj)).toBeInstanceOf(FutureObj),
      none: () => expect(() => method(futureObj)).not.toThrow(),
      suspend: () => method(futureObj),
    }

    assertions[outRender]();
    let resolved;
    let App = () => {
      return <Suspense fallback={<div>Loading...</div>}>
        <LogSuspense action={() => resolved = assertions[inRender]()}>
          <div>
            foo
          </div>
        </LogSuspense>
      </Suspense>
    };

    act(() => {
      renderer = TestRenderer.create(<App />, {
        unstable_isConcurrent: true,
      })
    });
    switch (inRender) {
      case "suspend":
        expect(Scheduler.unstable_clearYields()).toEqual([
          'Suspend!'
        ])

        await waitForSuspense(1500);
        expect(resolved).toEqual(expectedJSON(1))
        break;
      case "throw":
        expect(Scheduler.unstable_clearYields()).toEqual([
          'Error!'
        ])
        break;
      case "defer":
        expect(TestRenderer).toFlushAll([
          'No Suspense'
        ])
        expect(resolved).toBeInstanceOf(Effect);
        const resolved = await FutureObject.toPromise(resolved);
        expect(resolved).toEqual(Object[staticMethod](expectedJSON(1)))
        break;
      default:
        throw new Error(`Invalid value for inRender "${inRender}"`)
    }

  })
});

