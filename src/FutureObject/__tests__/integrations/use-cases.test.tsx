jest.mock('scheduler', () => require('scheduler/unstable_mock'));
import { futureObject } from '../../../index';

import React from 'react';
import { testSuspenseWithLoader } from '../../../test-utils/testSuspense';
import { lazyArray } from '../../../utils';
import extractValue from '../../../test-utils/extractValue';
import waitForSuspense from '../../../test-utils/waitForSuspense';

jest.useFakeTimers();
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
        res(expectedJSON(val));
      } catch (err) {
        rej(err);
      }
    }, 100);
  }).catch(err => {
    throw err;
  });
// test resetting value array prop with future array
/** obj.foo = new Array(() => obj.foo).map() EDIT: will be taken cae of by oblique types*/
// test suspending in same function as instantiation
// test suspending in child
// testing iterating in parent and in child and accessing in child or subchild

let StubFutureObject;


beforeEach(() => {
  StubFutureObject = futureObject(fetchJson);
});

afterEach(() => {
  StubFutureObject.reset();
  StubFutureObject = null;
});


describe('rhs', () => {
  test('outside render', async () => {
    const val = [1,2,3,4]
    let futureObj = new StubFutureObject(val);
    const op = arr => arr.map(ind => ind + 1)
    futureObj.value = op(
      lazyArray(() => futureObj.value)
    );
                        
    const result = extractValue(futureObj);
    await waitForSuspense(150);
    console.log(result);
    expect(await result).toEqual(expectedJSON(op(val)))
  });
  test('outside render, should evaluate in order', async () => {
    const val = [1,2,3,4]
    let futureObj = new StubFutureObject(val);
    const op = arr => arr.map(ind => ind + 1)
    futureObj.value = op(
      lazyArray(() => futureObj.value)
    );
    const mutated = StubFutureObject.mutableAssign(futureObj, { value: 'bar'} );
    
    const result = extractValue(futureObj);
    const mutatedResult = extractValue(mutated)
    await waitForSuspense(150);
    console.log(result);
    expect(await result).toEqual(expectedJSON('bar'));
    expect(await mutatedResult).toEqual(expectedJSON('bar'));
    
  });
  test('outside render, should handle multiple setters', async () => {
    const val = [1,2,3,4]
    let futureObj = new StubFutureObject(val);
    const op = arr => arr.map(ind => ind + 1)
    futureObj.value = op(
      lazyArray(() => futureObj.value)
    );
    
    futureObj = StubFutureObject.assign(futureObj, {value: [5,6,7,8]});

    futureObj.value =  op(
      lazyArray(() => futureObj.value)
    );

    const result = extractValue(futureObj);
    await waitForSuspense(150);

    expect(await result).toEqual(expectedJSON([6,7,8,9]));
  });
});