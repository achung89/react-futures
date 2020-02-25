
import React, {Suspense} from 'react';
import ReactDOM from 'react-dom';
import { createFutureObject } from '../index';
import { act } from 'react-dom/test-utils';
import {objectStatic, futureObjectStatic} from './FutureObj-statics';
import waitForSuspense from '../test-utils/waitForSuspense';
import FutureObject from './FutureObject';
import Effect from '../Effect/Effect';

// TODO: test error handling

let Scheduler;
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
  }, 1000)
})

let container;
const LogSuspense = ({ action }) => {
  try {
    action();
    Scheduler.unstable_yieldValue('No Suspense');
    return <span prop={text} />;
  } catch (promise) {
    if (typeof promise.then === 'function') {
      Scheduler.unstable_yieldValue(`Suspend!`);
      throw promise
    } else {
      Scheduler.unstable_yieldValue(`Error!`);
    }
  }
}

beforeEach(() => {
  FutureObj = createFutureObject(fetchJson);
  Scheduler = require('scheduler')
  container = document.createElement('div');
  document.body.appendChild(container);
});
afterEach(() => {
  FutureObj = null;
  document.body.removeChild(container);
  container = null;
});

describe("Object static methods behaviour", () => {
  test.each`${objectStatic}`
  (async ({staticMethod, inRender, outRender}) => {
    test(`${typeof staticMethod === 'string' ? staticMethod : staticMethod.toString()} should ${inRender} inside render and ${outRender} outside render`, () => {
      const futureObj = new FutureObj(1);
      const method = typeof staticMethod === 'string' ? Object[staticMethod] : staticMethod;
      const assertions = {
        autothrow: () => expect(() => method(futureObj)).toThrowError(/** TODO: outofrender error */),
        throw: () => expect(() => method(futureObj)).toThrowError(/** TODO: outofrender error */),
        defer: () => expect(method(futureObj)).toBeInstanceOf(FutureObj),
        defermutate: () => expect(method(futureObj)).toBeInstanceOf(FutureObj),
        none: () => expect(() => method(futureObj)).not.toThrow(), 
        suspend: () => {
          method(futureObj)
        },
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

      act(() => { ReactDOM.createRoot(container).render(<App />) });

      switch(inRender) {
        case "suspend":
          expect(Scheduler).toFlushAndYieldThrough([
            'Suspend!'
           ]);
           await waitForSuspense();
          expect(resolved).toEqual(expectedJSON(1))
          break;
        case "throw":
          expect(Scheduler).toFlushAndYieldThrough([
            'Error!'
           ])
          break;
        case "defer":
          expect(Scheduler).toFlushAndYieldThrough([
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
  })
  test.each`${futureObjectStatic}`
  (async ({staticMethod, inRender, outRender}) => {
    test(`${typeof staticMethod === 'string' ? staticMethod : staticMethod.toString()} should ${inRender} inside render and ${outRender} outside render`, () => {
      const futureObj = new FutureObj;
      const method = typeof staticMethod === 'string' ? FutureObj[staticMethod] : staticMethod;
      const assertions = {
        autothrow: () => expect(() => method(futureObj)).toThrowError(/** TODO: outofrender error */),
        throw: () => expect(() => method(futureObj)).toThrowError(/** TODO: outofrender error */),
        defer: () => expect(method(futureObj)).toBeInstanceOf(FutureObj),
        defermutate: () => expect(method(futureObj)).toBeInstanceOf(FutureObj),
        none: () => expect(() => method(futureObj)).not.toThrow(), 
        suspend: () => {
          method(futureObj)
        },
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
        ReactDOM.createRoot(container).render(<App />)
      });
      switch(inRender) {
        case "suspend":
          expect(Scheduler).toFlushAndYieldThrough([
            'Suspend!'
           ])
          await waitForSuspense();
          expect(resolved).toEqual(expectedJSON(1))
          break;
        case "throw":
          expect(Scheduler).toFlushAndYieldThrough([
            'Error!'
           ])
          break;
        case "defer":
          expect(Scheduler).toFlushAndYieldThrough([
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
  })
});

