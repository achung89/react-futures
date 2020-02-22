
import React from 'react';
import ReactDOM from 'react-dom';
import { createFutureObject } from '../index';
import { act } from 'react-dom/test-utils';
import {objectStatic} from './FutureObj-statics';

let Scheduler;
const fetchJson = val => new Promise((res, rej) => {
  setTimeout(() => {
    res({
      foo: "futon",
      bar: "barcandy",
      bazz: "bazzerita",
      value: val
    })
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
    } else {
      Scheduler.unstable_yieldValue(`Error!`);
    }
    throw promise;
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
  (({staticMethod, inRender, outRender}) => {
    test(`${typeof staticMethod === 'string' ? staticMethod : staticMethod.toString()} should ${inRender} inside render and ${outRender} outside render`, () => {
      const futureObj = new FutureObj;
      const method = typeof staticMethod === 'string' ? Object[staticMethod] : staticMethod;
      const assertions = {
        autothrow: () => expect(() => method(futureObj)).toThrowError(/** TODO: outofrender error */),
        throw: () => expect(() => method(futureObj)).toThrowError(/** TODO: outofrender error */),
        defer: () => expect(method(futureObj)).toBeInstanceOf(FutureObj),
        defermutate: () => expect(method(futureObj)).toBeInstanceOf(FutureObj),
        none: () => expect(() => method(futureObj)).not.toThrow(), 
        suspend: () => {
          method(futureObj)
          expect(Scheduler).toFlushAndYieldThrough([
           'Suspend!'
          ])

        },

      }

      assertions[outRender]();
      
      let App = () => {
        return <LogSuspense action={() => assertions[inRender]()}>
          <div>
            foo
        </div>
        </LogSuspense>
      };

      act(() => {
        ReactDOM.createRoot(container).render(<App />)
      });
    })
  })
})

