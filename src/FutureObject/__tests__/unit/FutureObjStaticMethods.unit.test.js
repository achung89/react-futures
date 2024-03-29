jest.mock('scheduler', () => require('scheduler/unstable_mock'));
jest.useFakeTimers();

import { waitFor } from '@testing-library/dom';
import { Suspense } from 'react';
import { act } from 'react-dom/test-utils';
import { createObjectResource, FutureArray, FutureObject, NotSupportedError, unwrapProxy } from '../../../internal';
import extractValue from '../../../test-utils/extractValue';
import { render } from '../../../test-utils/rtl-renderer';
import waitForSuspense from '../../../test-utils/waitForSuspense';
import { ThrowablePromise } from '../../../ThrowablePromise/ThrowablePromise';
import { assign_firstParam, assign_secondParam, defineProperties, defineProperty, getOwnPropertyDescriptor, setPrototypeOf } from './ObjStaticMethods.unit.test';

expect.extend(require('../../../test-utils/renderer-extended-expect'));

const getOwnPropertyDescriptorFuture = obj =>
  FutureObject.getOwnPropertyDescriptor(obj, 'foo');
const assign_secondParamFuture = obj => FutureObject.assign({}, obj);
const assign_firstParamFuture = obj => FutureObject.assign(obj, { bar: 'bar' });
const definePropertyFuture = obj =>
  FutureObject.defineProperty(obj, 'foo', { writable: false });
const definePropertiesFuture = obj =>
  FutureObject.defineProperties(obj, { foo: { writable: false } });
const setPrototypeOfFuture = obj =>
  FutureObject.setPrototypeOf(obj, FutureArray);

const mutableAssign_firstParamFuture = obj => FutureObject.mutableAssign(obj, { bar: 'bar' });
const mutableSetPrototypeOfFuture = obj =>
  FutureObject.mutableSetPrototypeOf(obj, FutureArray);
const mutableAssign_secondParamFuture = obj => FutureObject.mutableAssign({}, obj);
const mutableDefinePropertiesFuture = obj =>
  FutureObject.mutableDefineProperties(obj, { foo: { writable: false } });
const mutableDefinePropertyFuture = obj =>
  FutureObject.mutableDefineProperty(obj, 'foo', { writable: false });

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
    const val = action();
    Scheduler.unstable_yieldValue('No Suspense');

    return <div>foo</div>;
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
  FutureObj = createObjectResource(fetchJson);
});

afterEach(() => {
  document.body.removeChild(container);
  container = null;
  FutureObj = null;
  Scheduler.unstable_clearYields();
  Scheduler = null;
});

describe('FutureObject static methods', () => {
  test.each`
      staticMethod       
      ${'isExtensible'}
      ${'isFrozen'}    
      ${'isSealed'}    
    `('Expect static getter $staticMethod to suspend in render and throw outside render',
    async ({ staticMethod }) => {
      const futureObj = new FutureObj(1);
      const method =
        typeof staticMethod === 'string'
          ? FutureObj[staticMethod]
          : staticMethod;
      let created;
      const inRender = () => {
        created = method(futureObj);
      }
      const outsideRender = () => {
        expect(() =>
          method(futureObj)
        ).toThrowError(ThrowablePromise);
      }

      outsideRender();

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
      const expected = Object[staticMethod](expectedJSON(1));
      const result = await extractValue(created)
      expect(result).toEqual(expected);
    }
  );
  test.each`
    staticMethod                      | returnType     |   expected
    ${getOwnPropertyDescriptorFuture} | ${'object'}     | ${getOwnPropertyDescriptor}
    ${'getOwnPropertyDescriptors'}    | ${'object'}     | ${'getOwnPropertyDescriptors'}   
    ${'getOwnPropertyNames'}          | ${'array'}     |  ${'getOwnPropertyNames'}         
    ${'getOwnPropertySymbols'}        | ${'array'}     |  ${'getOwnPropertySymbols'}       
    ${'getPrototypeOf'}               | ${'object'}     | ${'getPrototypeOf'}              
    ${'keys'}                         | ${'array'}     |  ${'keys'}                        
    ${'entries'}                      | ${'array'}     |  ${'entries'}                     
    ${'values'}                       | ${'array'}     |  ${'values'}                      
    ${assign_firstParamFuture}        | ${'object'}     | ${assign_firstParam}       
    ${'preventExtensions'}            | ${'object'}     | ${'preventExtensions'}           
    ${setPrototypeOfFuture}           | ${'object'}     | ${setPrototypeOf}          
    ${'seal'}                         | ${'object'}     | ${'seal'}                        
    ${assign_secondParamFuture}       | ${'object'}     | ${assign_secondParam}      
    ${definePropertiesFuture}         | ${'object'}     | ${defineProperties}        
    ${definePropertyFuture}           | ${'object'}     | ${defineProperty}          
    ${'freeze'}                       | ${'object'}     | ${'freeze'}                      
  `('Expect immutable method $staticMethod to defer inside and outside render',
    async ({ staticMethod, returnType, expected }) => {
      const futureObj = new FutureObj(1);
      const method =
        typeof staticMethod === 'string'
          ? FutureObj[staticMethod]
          : staticMethod;
      const expectedMethod = 
        typeof staticMethod === 'string'
          ? Object[staticMethod]
          : expected;
      const outsideRender = () => {
        let Constructor;
        if (returnType === 'object') {
          Constructor = FutureObject;
        }
        if (returnType === 'array') {
          Constructor = FutureArray;
        }
        expect(unwrapProxy(method(futureObj))).toBeInstanceOf(Constructor);
      };
      let created;
      const inRender = () => {
        let Constructor;
        if (returnType === 'object') {
          Constructor = FutureObject;
        }
        if (returnType === 'array') {
          Constructor = FutureArray;
        }
        const val = method(futureObj);
        expect(unwrapProxy(val)).toBeInstanceOf(Constructor);
        created =  val;
      };
      outsideRender();

      let renderer;
      act(() => {
        renderer = render(<App inRender={inRender} />, container);
      });
      const { getByText } = renderer;
      expect(Scheduler).toHaveYielded(['No Suspense']);
      jest.runTimersToTime(150);
      expect(Scheduler).toHaveYielded(['Promise Resolved']);
      await waitForSuspense(0);
      await waitFor(() => getByText('foo'));
      const result = await extractValue(created);
      expect(result).toEqual(expectedMethod(expectedJSON(1)));
      expect(Object.getOwnPropertyDescriptors(result)).toEqual(
        Object.getOwnPropertyDescriptors(expectedMethod(expectedJSON(1)))
      );
    }
  );
  test.each`
    staticMethod
    ${'create'} 
    ${'is'}
  `(
    'Expect invalid method $staticMethod to error both in and out of render',
    ({ staticMethod }) => {
      const futureObj = new FutureObj(1);
      const method =
        typeof staticMethod === 'string'
          ? FutureObj[staticMethod]
          : staticMethod;

      const inRender = () =>
        expect(() =>
          method(futureObj)
        ).toThrowError(NotSupportedError);
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
