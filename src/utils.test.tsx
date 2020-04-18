
jest.mock('scheduler', () => require('scheduler/unstable_mock'));
jest.useFakeTimers();
import {lazyObject, lazyArray} from 'react-futures';

import React, { Suspense } from 'react';
import { objectType } from './index';
import {isEffect, LazyArray, LazyObject} from './internal'
import waitForSuspense from './test-utils/waitForSuspense';
import { act } from 'react-dom/test-utils';
import { render } from './test-utils/rtl-renderer';
import { waitFor, wait } from '@testing-library/dom';
import { unwrapProxy } from './utils';
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
const App = ({ inRender }) => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LogSuspense action={inRender}>
        <div>foo</div>
      </LogSuspense>
    </Suspense>
  );
};

const LogSuspense = ({ action }) => {
  try {
    action();
    Scheduler.unstable_yieldValue('No Suspense');

    return 'foo';
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
beforeEach(() => {
  jest.resetModules();
  Scheduler = require('scheduler/unstable_mock');
  container = document.createElement('div');
  document.body.appendChild(container);
  FutureObj = objectType(fetchJson);
});

afterEach(() => {
  document.body.removeChild(container);
  container = null;
  FutureObj.reset();
  FutureObj = null;
  Scheduler.unstable_clearYields();
  Scheduler = null;
});


test('getRaw', async () => {
  let futureObj
  const inRender = () => {
    futureObj = new FutureObj(3);
  }
  let renderer;
  act(() => {
    renderer = render(<App inRender={inRender} />, container);
  });
  const { getByText } = renderer;
  jest.runTimersToTime(150);
  await waitFor(() => getByText('foo'))
  expect(Scheduler).toHaveYielded(['No Suspense', 'No Suspense', 'Promise Resolved'])
  expect(unwrapProxy(futureObj)).toBeInstanceOf(LazyObject);
  const result = await extractValue(futureObj);
  console.log('RAWW')
  expect(result).toEqual(expectedJSON(3))
})

// test('lazyObject should defer ', async () => {
//   const futureObj = new FutureObj(1);
//   const method = 

//   const outsideRender = () => {

//     expect(unwrapProxy(method(futureObj))).toBeInstanceOf(LazyArray);
//   };
//   const inRender = () => {

//     const val = method(futureObj);
//     expect(unwrapProxy(val)).toBeInstanceOf(LazyArray);
//     return val;
//   };
//   act(outsideRender);

//   let renderer;
//   act(() => {
//     renderer = render(<App inRender={inRender} />, container);
//   });
//   const { getByText } = renderer;
//   expect(Scheduler).toHaveYielded(['No Suspense', 'Suspend!']);
//   jest.runTimersToTime(150);
//   expect(Scheduler).toHaveYielded(['Promise Resolved']);
//   await waitForSuspense(0);
//   await waitFor(() => getByText('foo'));

//   expect(resolved).toEqual(method(expectedJSON(1)));
//   expect(Object.getOwnPropertyDescriptors(resolved)).toEqual(
//     Object.getOwnPropertyDescriptors(method(expectedJSON(1)))
//   );
// });
// test('lazyArray should defer ', async () => {
  
// });