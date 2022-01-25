jest.mock('scheduler', () => require('scheduler/unstable_mock'));
jest.useFakeTimers();

import { waitFor } from '@testing-library/dom';
import { Suspense } from 'react';
import { act } from 'react-dom/test-utils';
import { createObjectResource, FutureArray, FutureObject, unwrapProxy } from '../../../internal';
import extractValue from '../../../test-utils/extractValue';
import { render } from '../../../test-utils/rtl-renderer';
import waitForSuspense from '../../../test-utils/waitForSuspense';
import { getRaw } from '../../../utils';


// TODO: test assign with array as first argument
export const getOwnPropertyDescriptor = obj =>
  Object.getOwnPropertyDescriptor(obj, 'foo');
export const assign_secondParam = obj => Object.assign({}, obj);
export const defineProperty = obj =>
  Object.defineProperty(obj, 'foo', { writable: false });
export const defineProperties = obj =>
  Object.defineProperties(obj, { foo: { writable: false } });
export const setPrototypeOf = obj => Object.setPrototypeOf(obj, FutureArray);
export const assign_firstParam = obj => Object.assign(obj, { bar: 'bar' });

expect.extend(require('../../../test-utils/renderer-extended-expect'));

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
  Scheduler = require('scheduler/unstable_mock');
  container = document.createElement('div');
  document.body.appendChild(container);
  FutureObj = createObjectResource(fetchJson)
});

afterEach(() => {
  document.body.removeChild(container);
  container = null;
  FutureObj = null;
  Scheduler.unstable_clearYields();
  Scheduler = null;
});

describe('Object static methods', () => {
  test.each`
    staticMethod
    ${assign_secondParam}
    ${getOwnPropertyDescriptor}
    ${'getOwnPropertyDescriptors'}
    ${'getOwnPropertyNames'}
    ${'getOwnPropertySymbols'}
    ${'keys'}
    ${'entries'}
    ${'values'}
    ${'getPrototypeOf'}
  `('Expect static getter $staticMethod to suspend in render and throw outside render',
    async ({ staticMethod }) => {
      const futureObj = new FutureObj(1);
      const method =
        typeof staticMethod === 'string' ? Object[staticMethod] : staticMethod;
      let created;
      const inRender = () => {
        created = getRaw(method(futureObj));
      }
      const outsideRender = () =>
        expect(() =>
          method(futureObj)
        ).toThrowError(/** TODO: outofrender error */);

      act(() => {
        outsideRender();
      });

      let renderer;
      act(() => {
        renderer = render(<App inRender={inRender} />, container);
      });
      const { getByText } = renderer;
      expect(Scheduler).toHaveYielded(['Suspend!']);

      jest.runTimersToTime(150);
      expect(Scheduler).toHaveYielded(['Promise Resolved']);
      await waitForSuspense(0);
      await waitFor(() => getByText('foo'));
      expect(Scheduler).toHaveYielded(['No Suspense']);
      const expected = method(expectedJSON(1));
      
      expect(created).toEqual(expected);
    }
  );

  test.each`
    staticMethod
    ${'is'}
    ${'create'}
  `(
    'Expect noop method $staticMethod to do nothing',
    async ({ staticMethod }) => {
      const futureObj = new FutureObj(1);
      const method =
        typeof staticMethod === 'string' ? Object[staticMethod] : staticMethod;

      const inRender = () => {
        expect(() => method(futureObj)).not.toThrow(Promise);
        //TODO: add more error types
        expect(() => method(futureObj)).not.toThrow(Error);

        expect(unwrapProxy(method(futureObj))).toBe(undefined);
        expect(unwrapProxy(method(futureObj))).toBe(undefined);
      };
      const outsideRender = inRender;

      act(() => {
        outsideRender();
      });

      let renderer;
      act(() => {
        renderer = render(<App inRender={inRender} />, container);
      });
      const { getByText } = renderer;

      expect(Scheduler).toHaveYielded(['No Suspense']);
      await waitForSuspense(150);
      await waitFor(() => getByText('foo'));
      expect(Scheduler).toHaveYielded(['Promise Resolved']);
    }
  );
  test.skip.each`
    staticMethod           | returnType
    ${defineProperties}    | ${'object'}
    ${defineProperty}      | ${'object'}
    ${assign_firstParam}   | ${'object'}
  `(
    'Expect mutable method $staticMethod to throw in render and defer outside render',
    async ({ staticMethod, returnType }) => {
      const futureObj = new FutureObj(1);
      const method =
        typeof staticMethod === 'string' ? Object[staticMethod] : staticMethod;
      // TODO: specify error
      const inRender = () => expect(() => method(futureObj)).toThrowError();
      let created;
      const outsideRender = () => {
        let Constructor;
        if (returnType === 'object') {
          Constructor = FutureObject;
        }
        if (returnType === 'array') {
          Constructor = FutureArray;
        }
        created = method(futureObj)
        expect(unwrapProxy(created)).toBeInstanceOf(Constructor);
      };

      
      outsideRender();


      let renderer;
      act(() => {
        renderer = render(<App inRender={inRender} />, container);
      });
      await waitForSuspense(150);

      const result = await extractValue(created);
      expect(result).toEqual(method(expectedJSON(1)))
      expect(Object.getOwnPropertyDescriptors(result)).toEqual(
        Object.getOwnPropertyDescriptors(method(expectedJSON(1)))
      );    }
  );
  test.each`
    staticMethod               
    ${'seal'}
    ${'freeze'}
    ${'isExtensible'}
    ${'isFrozen'}
    ${'isSealed'}
    ${'preventExtensions'}
    ${setPrototypeOf}
  `(
    'Expect method $staticMethod to error both in and out of render',
    ({ staticMethod }) => {
      const futureObj = new FutureObj(1);
      const method =
        typeof staticMethod === 'string' ? Object[staticMethod] : staticMethod;

      const inRender = () =>
        expect(() =>
          method(futureObj)
        ).toThrowError(/** TODO: outofrender error */);
      const outsideRender = inRender;

        outsideRender();

      let renderer;
      act(() => {
        renderer = render(<App inRender={inRender} />, container);
      });
      jest.runTimersToTime(150);
    }
  );
});
