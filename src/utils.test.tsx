
jest.mock('scheduler', () => require('scheduler/unstable_mock'));
jest.useFakeTimers();

import React, { Suspense } from 'react';
import { futureObject, futureArray } from './index';
import {isEffect, LazyArray, LazyObject} from './internal'
import waitForSuspense from './test-utils/waitForSuspense';
import { act } from 'react-dom/test-utils';
import { render } from './test-utils/rtl-renderer';
import { waitFor, wait } from '@testing-library/dom';
import { unwrapProxy, toPromise, lazyObject, lazyArray } from './utils';
import extractValue from './test-utils/extractValue';
expect.extend(require('./test-utils/renderer-extended-expect'));

// TODO: test error handling
const expectedJSON = value => ({
  foo: 'futon',
  bar: 'barcandy',
  bazz: 'bazzerita',
  value,
});
// TODO: test obj instance methods
// TODO: assert return values of Object/FutureObj static methods
const fetchJson = val =>
  new Promise((res, rej) => {
    setTimeout(() => {
      try {
        Scheduler.unstable_yieldValue('Promise Resolved');
        res(expectedJSON(val));
      } catch (err) {
        rej(err);
      }
    }, 100);
  }).catch(err => {
    throw err;
  });
const fetchArray = val =>
  new Promise((res, rej) => {
    setTimeout(() => {
      Scheduler.unstable_yieldValue('Promise Resolved');
      res([2, 3, 4, val]);
    }, 100);
  });

const App = ({ inRender }) => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LogSuspense action={inRender}>
        <div>foo</div>
      </LogSuspense>
    </Suspense>
  );
};

const LogSuspense = ({ action, children }) => {
  try {
    action();
    Scheduler.unstable_yieldValue('No Suspense');

    return children;
  } catch (promise) {
    if (typeof promise.then === 'function') {
      Scheduler.unstable_yieldValue(`Suspend!`);
    }
    throw promise;
  }
};
let FutureObj;
let container;
let Scheduler;
let FutureArr
beforeEach(() => {
  jest.resetModules();
  jest.useFakeTimers();
  Scheduler = require('scheduler/unstable_mock');
  container = document.createElement('div');
  document.body.appendChild(container);
  FutureObj = futureObject(fetchJson);
  FutureArr = futureArray(fetchArray)
});

afterEach(() => {
  document.body.removeChild(container);
  container = null;
  FutureObj.reset();
  FutureObj = null;
  Scheduler.unstable_clearYields();
  Scheduler = null;
  FutureArr = null;
});


describe('getRaw',  () => {
  test('extractValue', async () => {
    let futureObj
    const inRender = () => {
      futureObj = new FutureObj(3);
    }
    let renderer;
    act(() => {
      renderer = render(<App inRender={inRender} />, container);
    });
    const { getByText } = renderer;
    await waitForSuspense(150);
    await waitFor(() => getByText('foo'))
    expect(Scheduler).toHaveYielded(['No Suspense', 'Promise Resolved'])
    expect(unwrapProxy(futureObj)).toBeInstanceOf(LazyObject);
    const result = await extractValue(futureObj);
    expect(result).toEqual(expectedJSON(3))
  })

})
const invert = obj => Object.fromEntries(Object.entries(obj).map(([key, value]) => [value, key]));

describe('toPromise', () => {
  test('outside render', async () => {
    jest.useRealTimers();
    const makeFuture = val => new FutureObj(val);

    const futureObj = makeFuture(4)
    const expected = expectedJSON(4)
    const result = await toPromise(futureObj);
    expect(result).toEqual(expected);
    //test that it returns same result 
    const secondTime = await toPromise(futureObj);
    expect(secondTime).toEqual(expected);
    const transformed = FutureObj.entries(makeFuture(5))
    const transformedExpected = Object.entries(expectedJSON(5));
    
    const transformedResult = await toPromise(transformed);

    expect(transformedResult).toEqual(transformedExpected);

  })

  test('outside render multiple', async () => {
    jest.useRealTimers();
    const makeFuture = val => new FutureObj(val);


    const transformed = FutureObj.assign(makeFuture(5), lazyObject(() => invert(makeFuture(4))));
                          
    const transformedExpected = Object.assign(expectedJSON(5), invert(expectedJSON(4)))
    const transformedResult = await toPromise(transformed);

    expect(transformedResult).toEqual(transformedExpected);
  })
  
  test('inside render', async () => {
    expect.assertions(1)    
    const inRender = async () => {
      const futureObj = new FutureObj(3);
      const result = await toPromise(futureObj);
      expect(result).toEqual(expectedJSON(3));
    }
    let renderer;
    act(() => {
      renderer = render(<App inRender={inRender} />, container);
    });
    const {getByText} = renderer;
    await waitForSuspense(150);
    await waitFor(() => getByText('foo'))
  })  
  test('inside render multiple', async () => {
    expect.assertions(1)    
    const inRender = async () => {
      const makeFuture = val => new FutureObj(val);


      const transformed = FutureObj.assign(makeFuture(5), lazyObject(() => invert(makeFuture(4))));
                            
      const transformedExpected = Object.assign(expectedJSON(5), invert(expectedJSON(4)))
      const transformedResult = await toPromise(transformed);

      expect(transformedResult).toEqual(transformedExpected);
    }
    let renderer;
    act(() => {
      renderer = render(<App inRender={inRender} />, container);
    });
    const {getByText} = renderer;
    await waitForSuspense(150);
    await waitFor(() => getByText('foo'))
  })
})

test('lazyObject should defer ', async () => {
  const futureObj = new FutureObj(1);
  const lazified = lazyObject(() => invert(futureObj))
  const value = extractValue(lazified);
  await waitForSuspense(150);
  expect(await value).toEqual(invert(expectedJSON(1)));

  const lazified2 = lazyObject(() => invert(expectedJSON(2)));

  const value2 = extractValue(lazified2);
  await waitForSuspense(150);
  expect(await value2).toEqual(invert(expectedJSON(2)));
});
test('lazyArray should defer ', async () => {

  const futureArr = new FutureArr(2);
  const lazified = lazyArray(() => futureArr.reverse());  
  const value = extractValue(lazified);

  await waitForSuspense(150)
  expect(await value).toEqual([2,3,4,2].reverse());
  const lazified2 = lazyArray(() => [2,3,4,2].reverse());
  const value2 = extractValue(lazified2);
  await waitForSuspense(150);

  expect(await value2).toEqual([2,3,4,2].reverse());
});