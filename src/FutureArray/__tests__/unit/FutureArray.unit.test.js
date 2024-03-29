jest.mock('scheduler', () => require('scheduler/unstable_mock'));
jest.useFakeTimers();
import  { Suspense, unstable_Cache as Cache } from 'react';
import {  createArrayResource,  createObjectResource, toPromise, futureArray } from '../../../internal';
import { act } from '@testing-library/react';
import { MutableOperationInRenderError } from '../../../Effect/Effect';
import { FutureArray, FutureIterator } from '../../FutureArray';
import { render } from '../../../test-utils/rtl-renderer';
import waitForSuspense from '../../../test-utils/waitForSuspense';
import { waitFor } from '@testing-library/dom';

import { unwrapProxy } from '../../../utils';
import extractValue from '../../../test-utils/extractValue';
import delay from 'delay';
import { ThrowablePromise } from '../../../ThrowablePromise/ThrowablePromise';
expect.extend(require('../../../test-utils/renderer-extended-expect'));

// TODO: setter should not suspend
// TODO: future before suspense, eager after suspense <=== does this still apply???????
// TODO: should entries, values, and keys throw, or return an iterator of FutureArrays?
// TODO: should push and unshift suspend since they require knowledge of length?
// TODO: all subsequently created arrays should all share the same promise
// TODO: test freeze, seal, delete
// TODO: test error handling
// TODO: imm methods
// TODO: future value shouldn't be accessible from outside render ( add get raw value function )
let Scheduler;
let fetchArray = val =>
  new Promise((res, rej) => {
    setTimeout(() => {
      Scheduler.unstable_yieldValue('Promise Resolved');
      res([2, 3, 4, val]);
    }, 100);
  });

let container;
let FutureArr;
let renderer;
beforeEach(() => {
  jest.useFakeTimers();

  jest.resetModules();
  FutureArr = createArrayResource(fetchArray);
  Scheduler = require('scheduler/unstable_mock');
  container = document.createElement('div');
  document.body.appendChild(container);
});
afterEach(() => {
  FutureArr = null;
  jest.useRealTimers()
  document.body.removeChild(container);
  container = null;
  Scheduler.unstable_clearYields();
  Scheduler = null;
  // renderer && renderer.unmount()
});
const LogSuspense = ({ action, children }) => {
  try {
    action();
    Scheduler.unstable_yieldValue('No Suspense');
    return children;
  } catch (promise) {
    if (typeof promise.then === 'function') {
      Scheduler.unstable_yieldValue(`Suspend!`);
    } else {
      Scheduler.unstable_yieldValue(`Error!`);
    }
    throw promise;
  }
};
describe('In only render context', () => {
  it('should render properly', async () => {
    let App = () => <div></div>;
    act(() => {
      render(<App />, container);
    });
    await act(async () => {
      await waitForSuspense(0);
    })
    expect(container.innerHTML).toEqual(`<div></div>`);
  });

  it('should suspend when rendering', async () => {
    const MiniApp = () => new FutureArr(5);

    const App = () => (
      <Suspense fallback={<div>Loading...</div>}>
        <div>
          <MiniApp />
        </div>
      </Suspense>
    );

      
    
    act(() => {
      renderer = render(<App />, container);
    });
    
    const { getByText } = renderer;
    
    act(() => {
      jest.runOnlyPendingTimers();
    })

    await waitFor(() => getByText('Loading...'));

    act(() => {
      jest.runTimersToTime(150);
    })

    expect(Scheduler).toHaveYielded(['Promise Resolved']);
    act(() => {Scheduler.unstable_flushAll()})

     await waitForSuspense(0);
    await waitFor(() => getByText('2345'));
  });

  test.each(['1', 2, '3', 4])(
    `should suspend on %i index access`,
    async index => {
      const resources = new FutureArr(5);
      let resolvedValue;
      const App = () => {
        return (
          <Suspense fallback={<div>Loading...</div>}>
            <LogSuspense action={() => (resolvedValue = resources[index])}>
              <div>foo</div>
            </LogSuspense>
          </Suspense>
        );
      };
        
      act(() => {
        renderer = render(<App />, container);
      });
      const { getByText } = renderer;
      jest.runTimersToTime(0);
      await waitFor(() => getByText('Loading...'));
      expect(Scheduler).toHaveYielded(['Suspend!']);
      jest.runTimersToTime(150);

      expect(Scheduler).toHaveYielded(['Promise Resolved']);
      await waitForSuspense(0);
      await waitFor(() => getByText('foo'));

      expect(resolvedValue).toEqual([2, 3, 4, 5][index]);
    }
  );
  test.each(['bar', Symbol('foo'), 'baz'])(
    `should suspend on %s property access`,
    async index => {
      const resources = new FutureArr(5);
      let resolvedValue;
      let App = () => {
        return (
          <Suspense fallback={<div>Loading...</div>}>
            <LogSuspense action={() => (resolvedValue = resources[index])}>
              <div>foo</div>
            </LogSuspense>
          </Suspense>
        );
      };
        
      act(() => {
        renderer = render(<App />, container);
      });
      const { getByText } = renderer;
      jest.runTimersToTime(0)
      await waitFor(() => getByText('Loading...'));
      expect(Scheduler).toHaveYielded(['Suspend!']);
      jest.runTimersToTime(150);
      expect(Scheduler).toHaveYielded(['Promise Resolved']);
      await waitForSuspense(0);
      await waitFor(() => getByText('foo'));

      expect(resolvedValue).toEqual(undefined);
    }
  );
});

describe('Array operations', () => {
  // mutable operations not supported. replace with immutable helpers once stage 4 is reached
  test.skip.each`
    name                   | method                         
    ${'fill'}       | ${arr => arr.fill(1)}                             
    ${'reverse'}    | ${arr => arr.reverse()}                   
    ${'sort'}       | ${arr => arr.sort((a, b) => b - a)}                    
    ${'splice'}     | ${arr => arr.splice(2)}                   
    ${'copyWithin'} | ${arr => arr.copyWithin(0, 2)}  
          
  `(
    `Mutator method $name should defer outside render and throw in render`,
    async ({ method }) => {
      const futrArr = new FutureArr(5);
      const inRender = () => expect(() => {
        method(futrArr)
      }).toThrowError(MutableOperationInRenderError);

      let created;
      const outsideRender = () => {
        created = method(futrArr)
        expect(unwrapProxy(created)).toBeInstanceOf(FutureArray);
      };

      outsideRender();
      
        
      act(() => {
        renderer = render(
          <Suspense fallback={<div>Loading...</div>}>
            <LogSuspense action={inRender}>foo</LogSuspense>
          </Suspense>,
          container
        );
      });
      const {getByText} = renderer;

      expect(Scheduler).toHaveYielded(['No Suspense']);

      await waitForSuspense(150);
      expect(Scheduler).toHaveYielded(['Promise Resolved']);
      await waitFor(() => getByText('foo'));

      const orig = await extractValue(futrArr);
      const result = await extractValue(created);
      const expected = [2,3,4,5];
      expect(result).toEqual(method(expected))
      expect(orig).toEqual(expected)
    }
  );

  test.each`
    name             | method
    ${'concat'}      | ${arr => arr.concat([6, 7])}
    ${'filter'}      | ${arr => arr.filter(num => num % 2)}
    ${'slice'}       | ${arr => arr.slice(0, 1)}
    ${'map'}         | ${arr => arr.map(i => i + 3)}
    ${'flat'}        | ${arr => arr.map(num => [num + 3]).flat()}
    ${'flatMap'}     | ${arr => arr.flatMap(i => [i + 3])}
  `(
    `Applies defers native immutable method $name both in and outside render `,
    async ({ method }) => {
      let created;
      const futrArr = new FutureArr(5);
      expect(() => {
        expect(unwrapProxy(method(futrArr))).toBeInstanceOf(FutureArray);
      }).not.toThrow();
        
      act(() => {
        renderer = render(
          <Suspense fallback={<div>Loading...</div>}>
            <LogSuspense
              action={() => {
                created = method(futrArr);
              }}
            >
              foo
            </LogSuspense>
          </Suspense>,
          container
        );
      });
      const { getByText } = renderer;

      expect(Scheduler).toHaveYielded(['No Suspense']);

      await waitForSuspense(150);
      expect(Scheduler).toHaveYielded(['Promise Resolved']);
      await waitFor(() => getByText('foo'));

      expect(unwrapProxy(created)).toBeInstanceOf(FutureArray);
      const result = await extractValue(created)
      expect(result).toEqual(method([2, 3, 4, 5]));
    }
  );
  test.each`
    name         | method
    ${'entries'} | ${arr => arr.entries()}
    ${'values'}  | ${arr => arr.values()}
    ${'keys'}    | ${arr => arr.keys()}
  `(
    `Applies defers native iterator-returning immutable method $name both in and outside render`,
    async ({ method }) => {
      let created;
      const futrArr = new FutureArr(5);
      expect(() => {
        expect(unwrapProxy(method(futrArr))).toBeInstanceOf(FutureIterator);
      }).not.toThrow();
        
      act(() => {
        renderer = render(
          <Suspense fallback={<div>Loading...</div>}>
            <LogSuspense
              action={() => {
                created = method(futrArr);
              }}
            >
              foo
            </LogSuspense>
          </Suspense>,
          container
        );
      });
      const { getByText } = renderer;

      expect(Scheduler).toHaveYielded(['No Suspense']);
    
      await waitForSuspense(150);
      expect(Scheduler).toHaveYielded(['Promise Resolved']);

      await waitFor(() => getByText('foo'));
      expect(unwrapProxy(created)).toBeInstanceOf(FutureIterator);
      const result = await extractValue(created)
      expect([...result]).toEqual([...method([2, 3, 4, 5])]);
    }
  );

  //indexOf, includes, join, lastIndexOf, toString, toSource, toLocaleString, pop, shift, every, find, findIndex, forEach, some, Symbol.iterator

  test.each`
    name                | method                                                      | expected
    ${'indexOf'}        | ${arr => arr.indexOf(2)}                                    | ${0}
    ${'reduce'}         | ${arr => arr.reduce((coll, i) => [...coll, i + 3], [])}     | ${[ 5, 6, 7, 8 ]}
    ${'reduceRight'}    | ${arr => arr.reduceRight((coll, i) => [...coll, i + 3], [])}| ${[ 8, 7, 6, 5 ]}
    ${'includes'}       | ${arr => arr.includes(3)}                                   | ${true}
    ${'join'}           | ${arr => arr.join(' ')}                                     | ${'2 3 4 5'}
    ${'lastIndexOf'}    | ${arr => arr.lastIndexOf(4)}                                | ${2}
    ${'toString'}       | ${arr => arr.toString()}                                    | ${'2,3,4,5'}
    ${'toLocaleString'} | ${arr => arr.toLocaleString()}                              | ${'2,3,4,5'}
    ${'every'}          | ${arr => arr.every(a => a % 2 === 0)}                       | ${false}
    ${'find'}           | ${arr => arr.find(a => a === 5)}                            | ${5}
    ${'findIndex'}      | ${arr => arr.findIndex(a => a === 5)}                       | ${3}
    ${'some'}           | ${arr => arr.some(a => a % 2 === 0)}                        | ${true}
    ${Symbol.iterator}  | ${arr => [...arr, ...arr]}                                  | ${[2, 3, 4, 5, 2, 3, 4, 5]}
  `(
    `suspends on $name inside render and throws outside render`,
    async ({ method, expected }) => {
      const futureArr = new FutureArr(5);

      const inRender = () => method(futureArr);
      const outsideRender = () =>
        expect(() =>
          method(futureArr)
        ).toThrowError(ThrowablePromise);

      outsideRender();

        
      let created;
      expect(() => method(futureArr)).toThrow(); //TODO: specify error
      act(() => {
        renderer = render(
          <Suspense fallback={<div>Loading...</div>}>
            <LogSuspense
              action={() => {
                created = inRender();
              }}
            >
              foo
            </LogSuspense>
          </Suspense>,
          container
        );
      });
      const { getByText } = renderer;
      expect(Scheduler).toHaveYielded(['Suspend!']);

      jest.runTimersToTime(150);
      expect(Scheduler).toHaveYielded(['Promise Resolved']);
      await waitForSuspense(0);
      await waitFor(() => getByText('foo'));
      expect(Scheduler).toHaveYielded(['No Suspense']);
      expect(created).toEqual(expected);
      //TODO: test created
    }
  );
  //TODO: invalid methods pop shift and push

  test('subclasses Array', async () => {
    let resources = new FutureArr(5);
    //suspends on Array.from, Array.isArray, have Array.of static method
    expect(unwrapProxy(resources)).toBeInstanceOf(Array);
    expect(Array.isArray(resources)).toEqual(true);
    expect(() => Array.from(resources)).toThrowError(); //TODO: specify error

    let created;
      
    act(() => {
      renderer = render(
        <Suspense fallback={<div>Loading...</div>}>
          <LogSuspense
            action={() => {
              created = Array.from(resources);
            }}
          >
            foo
          </LogSuspense>
        </Suspense>,
        container
      );
    });

    const { getByText } = renderer;

    expect(Scheduler).toHaveYielded(['Suspend!']);

    await waitForSuspense(150);
    expect(Scheduler).toHaveYielded(['Promise Resolved', 'No Suspense']);

    await waitFor(() => getByText('foo'));
    expect(created).toBeInstanceOf(Array);
    expect(created).not.toBeInstanceOf(FutureArr);
    expect(created).toEqual([2, 3, 4, 5]);

    expect(unwrapProxy(FutureArray.of(() => [2, 3, 4]))).toBeInstanceOf(FutureArray);
  });
  test('forEach should return undefined, throw inside render, and defer outside render', async () => {
    const futrArr = new FutureArr(5);
    let final;
    const inRender = () => expect(() => {
      futrArr.forEach(() => {})
    }).toThrowError();

    const outsideRender = () => {
      futrArr.forEach(val => {
        final = val
      })      
    };

    outsideRender();

    act(() => {
      renderer = render(
        <Suspense fallback={<div>Loading...</div>}>
          <LogSuspense action={inRender}>foo</LogSuspense>
        </Suspense>,
        container
      );
    });

    expect(final).toBeUndefined();

    await waitForSuspense(150);

    expect(final).toEqual(5)
  })

  test.skip('should have debug method', () => {});
});

describe('parallel iteration', () => {
  let FutureVal;

  const objectProm = value => new Promise( (res, rej) => {
    try {
      setTimeout(() => {
        res({value})
      }, 200)
    } catch(err) {
      throw err;
    }
  })

  beforeEach(() => {
    jest.useRealTimers()
    FutureVal = createObjectResource(objectProm);
  })
  afterEach(() => {
    FutureVal = null;
  })

  test('filter outside render', async () => {
    const futureArr = new FutureArr(5);

    const without3 = futureArr
                       .filter( num => num + new FutureVal(num).value !== 6)

    const without3Res = await toPromise(without3);

    // timeout of FutureArr + timeout of FutureVal
    expect( without3Res).toEqual([2,4,5])
  }, 400)

  test('map outside render', async () => {
    const futureArr = new FutureArr(5);
    let double = futureArr
                  .map(num =>  num + new FutureVal(num).value);
    const doubleRes = await toPromise(double);
    expect(doubleRes).toEqual([4,6,8,10])
  }, 400);

  test.skip('sort outside render', async () => {
    const sorted = new FutureArr(5)
                        .sort((a, b) => {
                          return b - new FutureVal(a).value
                        })
    const resolved = await toPromise(sorted);
    expect(resolved).toEqual([5,4,3,2])
  }, 600)

  test('flatMap outside render', async () => {
    const futureArr = new FutureArr(5);
    FutureArr = createArrayResource(fetchArray);
    let flatted = futureArr.flatMap(num => new FutureArr(num));

    const flattedRes = await toPromise(flatted);
    expect(flattedRes).toEqual([
      2, 3, 4, 2, 2, 3,
      4, 3, 2, 3, 4, 4,
      2, 3, 4, 5
    ])
  }, 400);

  test('find', async () => {
    const futureArr = new FutureArr(5);
    let val;
    const arr = futureArray(() => {
      val = futureArr.find( num => num + new FutureVal(num).value === 6);
      return []
    })
    await toPromise(arr);
    expect(val).toEqual(3);
  }, 400);

  test('every', async () => {
    const futureArr = new FutureArr(5);
    let val;
    const arr = futureArray(() => {
      val = futureArr.every( num => num === new FutureVal(num).value);
      return [];
    })
    await toPromise(arr);
    expect(val).toEqual(true);
  }, 400);

  test('some', async () => {
    const futureArr = new FutureArr(5);
    let val;
    const arr = futureArray(() => {
      val = futureArr.some( num => num !== new FutureVal(num).value);
      return [];
    });

    await toPromise(arr);
    expect(val).toEqual(false);
  }, 400);
  test('findIndex', async () => {
    const futureArr = new FutureArr(5);
    let val;
    const arr = futureArray(() => {
      val = futureArr.findIndex( num => num + new FutureVal(num).value === 6);
      return [];
    });

    await toPromise(arr);
    expect(val).toEqual(1);
  }, 400);
});