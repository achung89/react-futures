
    jest.mock('scheduler', () => require('scheduler/unstable_mock'));
    jest.useFakeTimers();

import React, { Suspense } from 'react';
import ReactDOM from 'react-dom';

import { createFutureObject } from '../index';
import { eachObjectStatic, eachFutureObjectStatic } from './FutureObj-statics';
import waitForSuspense from '../test-utils/waitForSuspense';
import FutureObject from './FutureObject';
import Effect from '../Effect/Effect';
import { act } from 'react-dom/test-utils';
import Scheduler from 'scheduler/unstable_mock';
import  {render} from '../test-utils/rtl-renderer';
import {waitFor} from '@testing-library/dom';

expect.extend(require('../test-utils/renderer-extended-expect'));	  


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
    try {
      Scheduler.unstable_yieldValue('Promise Resolved')
      res(expectedJSON(val))
    }catch(err) {
      rej(err)
    }

  }, 100);
});


const LogSuspense = ({ action }) => {
  try {
    const val = action();
    Scheduler.unstable_yieldValue('No Suspense');
    if(typeof val !== 'undefined') {
      Scheduler.unstable_yieldValue(val);
    }
    return 'foo';
  } catch (promise) {
    if (typeof promise.then === 'function') {
      Scheduler.unstable_yieldValue(`Suspend!`);
    } else {
      Scheduler.unstable_yieldValue(`Error!`);
    }
    throw promise

  }

}
let FutureObj;
let container
beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  jest.resetModules();
  FutureObj = createFutureObject(fetchJson);
});
afterEach(() => {
  document.body.removeChild(container);
  container = null;
  FutureObj.reset();
  FutureObj = null;
});

describe("Object static methods behaviour", () => {
  eachObjectStatic('Expect sync object static method $staticMethod to $inRender in render and $outRender outside render', async ({ staticMethod, inRender, outRender }) => {
    const futureObj = new FutureObj(1);
    const method = typeof staticMethod === 'string' ? Object[staticMethod] : staticMethod;
    const assertionsOutsideRender = {
      throw: () => expect(() => method(futureObj)).toThrowError(/** TODO: outofrender error */),
      defer: () => expect(method(futureObj)).toBeInstanceOf(FutureObj),
      defermutate: () => expect(method(futureObj)).toBeInstanceOf(FutureObj),
      none: () => expect(() => method(futureObj)).not.toThrow(),
      suspend: () => method(futureObj)
    }
    const assertionsInsideRender = {
      none: () => expect(() => method(futureObj)).not.toThrow(),
      suspend: () => method(futureObj),
      defer: () => expect(method(futureObj)).toBeInstanceOf(FutureObj),
      throw: () => {
        method(futureObj)
      }
    }

    act(() => {

      assertionsOutsideRender[outRender]();
    })


    const App = ({render}) => {
      return <Suspense fallback={<div>Loading...</div>}>
        {render ? <LogSuspense action={() => console.log('inrender', staticMethod) || assertionsInsideRender[inRender]()}>
          <div>
            foo
        </div> 
        </LogSuspense> : null}
      </Suspense>

    };

    let renderer;
    act(() => {
      renderer = render(<App render />, container)  
    });
    let {getByText} = renderer;

    switch (inRender) {
      case "suspend":
        expect(Scheduler).toHaveYielded([
          'Suspend!'
        ]);

        jest.runTimersToTime(150);
        expect(Scheduler).toHaveYielded([
          'Promise Resolved',
        ]);
        await waitForSuspense(0);
        await waitFor(() => getByText('foo'))
        expect(Scheduler).toHaveYielded([          
          'No Suspense',
          method(expectedJSON(1))])
        break;
      case "throw":
        await waitForSuspense(0);
        expect(Scheduler).toHaveYielded([
          'Error!'
        ]);

        break;
      case "defer":

        expect(Scheduler).toClearYields([
          'No Suspense'
        ])
        const resolved = await FutureObject.toPromise(resolved);
        expect(resolved).toEqual(method(expectedJSON(1)))
        break;
      case "none":
        expect(Scheduler).toHaveYielded(['No Suspense']);
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

