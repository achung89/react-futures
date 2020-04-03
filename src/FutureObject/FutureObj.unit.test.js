
    jest.mock('scheduler', () => require('scheduler/unstable_mock'));
    jest.useFakeTimers();

import React, { Suspense } from 'react';
import { createFutureObject } from '../index';
import { eachObjectStatic, eachFutureObjectStatic } from './FutureObj-statics';
import waitForSuspense from '../test-utils/waitForSuspense';
import FutureObject from './FutureObject';
import { act } from 'react-dom/test-utils';
import  {render} from '../test-utils/rtl-renderer';
import {waitFor} from '@testing-library/dom';
import TransparentObjectEffect, {isEffect} from './TransparentObjectEffect';
import {isFuture, unwrapProxy, suspend} from '../utils';
import TransparentArrayEffect from '../FutureArray/TransparentArrayEffect';
expect.extend(require('../test-utils/renderer-extended-expect'));	  


// TODO: test error handling
const expectedJSON = value => ({
  foo: "futon",
  bar: "barcandy",
  bazz: "bazzerita",
  value,
});
// TODO: test obj instance methods
// TODO: assert return values of Object/FutureObj static methods
let resolved = undefined;
const fetchJson = val => new Promise((res, rej) => {
  setTimeout(() => {
    try {
      Scheduler.unstable_yieldValue('Promise Resolved')
      res(expectedJSON(val))
    } catch (err) {
      rej(err)
    }

  }, 100);
}).catch(err => {throw err});


const LogSuspense = ({ action }) => {
  try {
    const val = action();
    Scheduler.unstable_yieldValue('No Suspense');
    if(isEffect(val)) {
      suspend(val);
    }
    if(typeof val !== 'undefined') {
      resolved = val;
    }
    return 'foo';
  } catch (promise) {
    if (typeof promise.then === 'function') {
      Scheduler.unstable_yieldValue(`Suspend!`);
    } 
    throw promise
  }

}
let FutureObj;
let container;
let Scheduler;
beforeEach(() => {
  jest.resetModules();
  Scheduler = require('scheduler/unstable_mock');
  container = document.createElement('div');
  document.body.appendChild(container);
  FutureObj = createFutureObject(fetchJson);
});

afterEach(() => {
  document.body.removeChild(container);
  container = null;
  FutureObj.reset();
  FutureObj = null;
  Scheduler.unstable_clearYields();
  Scheduler = null;
  resolved = null;
});

describe("Object and FutureObject static methods behaviour", () => {
  eachObjectStatic('Expect sync object static method $staticMethod to $inRender in render and $outRender outside render', inRenderOutRenderTests);
  eachFutureObjectStatic('Expect $constructor object static method $staticMethod to $inRender in render and $outRender outside render', inRenderOutRenderTests);
});

async function inRenderOutRenderTests ({ constructor, staticMethod, inRender, outRender, returnType })  {
  const futureObj = new FutureObj(1);
  const method = typeof staticMethod === 'string' 
                  ? constructor === 'Object' 
                    ? Object[staticMethod] : FutureObj[staticMethod]
                  : staticMethod;
  const assertionsOutsideRender = {
    throw: () => expect(() => method(futureObj)).toThrowError(/** TODO: outofrender error */),
    defer: () => {
      let Constructor;
      if(returnType === 'object') {
        Constructor = TransparentObjectEffect;
      }
      if(returnType === 'array') {
        Constructor = TransparentArrayEffect;
      }
      expect(unwrapProxy(method(futureObj))).toBeInstanceOf(Constructor)
    },
    none: () => expect(() => method(futureObj)).not.toThrow(),
    suspend: () => method(futureObj)
  }

  const assertionsInsideRender = {
    none: () => expect(() => method(futureObj)).not.toThrow(),
    suspend: () => method(futureObj),
    defer: () => {
      let Constructor;
      if(returnType === 'object') {
        Constructor = TransparentObjectEffect;
      }
      if(returnType === 'array') {
        Constructor = TransparentArrayEffect;
      }
      const val = method(futureObj)
      expect(unwrapProxy(val)).toBeInstanceOf(Constructor)
      return val;
    },
    throw: () => {
      expect(() => method(futureObj)).toThrowError();
    }
  }
  
  act(() => {
    assertionsOutsideRender[outRender]();
  })

  const App = ({ render }) => {
    return <Suspense fallback={<div>Loading...</div>}>
      {render ? <LogSuspense action={() => assertionsInsideRender[inRender]()}>
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
      ])
      expect(resolved).toEqual(method(expectedJSON(1)))
      break;
    case "throw":
      jest.runTimersToTime(150);

      break;
    case "defer":
      expect(Scheduler).toHaveYielded([
        'No Suspense',
        'Suspend!'
      ]);
      jest.runTimersToTime(150);
      expect(Scheduler).toHaveYielded([
        'Promise Resolved',
      ]);
      await waitForSuspense(0);
      await waitFor(() => getByText('foo'))
      expect(resolved).toEqual(method(expectedJSON(1)))
      expect(Object.getOwnPropertyDescriptors(resolved)).toEqual(Object.getOwnPropertyDescriptors(method(expectedJSON(1))))
      break;
    case "none":
      expect(Scheduler).toHaveYielded(['No Suspense']);
      await waitForSuspense(150);
      await waitFor(() => getByText('foo'))
      expect(Scheduler).toHaveYielded([          
        "Promise Resolved"
      ])
      break;
    default:
      throw new Error(`Invalid value for inRender "${inRender}"`)
  }
}