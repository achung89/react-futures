jest.useFakeTimers();
jest.mock('scheduler', () => require('scheduler/unstable_mock'));
const {  performance } = require('perf_hooks')
import { Suspense } from 'react';
import ReactDOM from 'react-dom';
import { FetchArray, useFetchArray, futureObject, toPromise, FetchObject } from '../../../futures';
import { act } from 'react-dom/test-utils';
import { LazyArray, LazyIterator } from '../../LazyArray';
import { render } from '../../../test-utils/rtl-renderer';
import waitForSuspense from '../../../test-utils/waitForSuspense';
import { waitFor } from '@testing-library/dom';
import { unwrapProxy, lazyArray } from '../../../utils';
import extractValue from '../../../test-utils/extractValue';
import delay from 'delay';
expect.extend(require('../../../test-utils/renderer-extended-expect'));

// TODO: setter should not suspend
// TODO: lazy before suspense, eager after suspense <=== does this still apply???????
// TODO: should entries, values, and keys throw, or return an iterator of futureArrays?
// TODO: should push and unshift suspend since they require knowledge of length?
// TODO: all subsequently created arrays should all share the same promise
// TODO: test freeze, seal, delete
// TODO: test error handling
// TODO: imm methods
// TODO: future value shouldn't be accessible from outside render ( add get raw value function )
let Scheduler;
let fetchArrayPromise = val => () =>
  new Promise((res, rej) => {
    setTimeout(() => {
      Scheduler.unstable_yieldValue('Promise Resolved');
      res([2, 3, 4, val]);
    }, 100);
  });

  const objectProm = value => () => new Promise( (res, rej) => {
    value = Number(value)
    try {
      setTimeout(() => {
        res({value})
      }, 200)
    } catch(err) {
      throw err;
    }
  })
let container;

beforeEach(() => {
  global.Request = class Request {
    [Symbol.hasInstance]() {
      return false;
    }
  }
  global.fetch = jest.fn().mockImplementation(async (path) => {
    const url = new URL(path, 'http://about.com');
    const value = url.searchParams.get('value')
    console.log(url.pathname, value)
    switch(url.pathname) {
      case '/blogs': 
        return ({ json() { return fetchArrayPromise(value ?? 5)() } })
      case '/person': 
        return ({ json() { return objectProm(value)() } })
      default:
        throw new Error("Invalid Route:" + path)
    }
  });
  jest.useFakeTimers();
  jest.resetModules();
  Scheduler = require('scheduler/unstable_mock');
  container = document.createElement('div');
  document.body.appendChild(container);
});
afterEach(() => {
  global.fetch.mockRestore();
  delete global.Request
  delete global.fetch;
  document.body.removeChild(container);
  container = null;
  Scheduler.unstable_clearYields();
  Scheduler = null;
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
    await waitForSuspense(0);
    expect(container.innerHTML).toEqual(`<div></div>`);
  });

  it('should suspend when rendering', async () => {
    const MiniApp = () => {
      const futureArray = useFetchArray('/blogs')
      return <>{futureArray}</>
    };

    const App = () => (
      <Suspense fallback={<div>Loading...</div>}>
        <div>
          <MiniApp />
        </div>
      </Suspense>
    );
    let renderer;
    act(() => {
      renderer = render(<App />, container);
    });
    const { getByText } = renderer;
    jest.runOnlyPendingTimers();
    await waitFor(() => getByText('Loading...'));

    jest.runTimersToTime(150);
    expect(Scheduler).toHaveYielded(['Promise Resolved']);
    await waitForSuspense(0);
    await waitFor(() => getByText('2345'));
  });

  test.each(['1', 2, '3', 4])(
    `should suspend on %i index access`,
    async index => {
      const resources = fetchArray('/blogs');
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
      let renderer;
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
      const resources = fetchArray('/blogs');
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
      let renderer;
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
  test.only.each`
    name            | method                         
    ${'fill'}       | ${arr => arr.fill(1)}                             
    ${'reverse'}    | ${arr => arr.reverse()}                   
    ${'sort'}       | ${arr => arr.sort((a, b) => b - a)}                    
    ${'splice'}     | ${arr => arr.splice(2)}                   
    ${'copyWithin'} | ${arr => arr.copyWithin(0, 2)}  
  `(
    `Mutator method $name should defer outside render and throw in render`,
    async ({ method }) => {
      const futArr = fetchArray('/blogs');
      const inRender = () => expect(() => {
        method(futArr)
      }).toThrowError();

      let created;
      const outsideRender = () => {
        created = method(futArr)
        expect(unwrapProxy(created)).toBeInstanceOf(LazyArray);
        
      };
      act(() => {
        outsideRender();
      });
      let renderer;
      act(() => {
        renderer = render(
          <Suspense fallback={<div>Loading...</div>}>
            <LogSuspense action={inRender}>foo</LogSuspense>
          </Suspense>,
          container
        );
      });

      await waitForSuspense(150);

      const orig = await extractValue(futArr);
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
       ${'flat'}     | ${arr => arr.map(num => [num + 3]).flat()}
    ${'flatMap'}     | ${arr => arr.flatMap(i => [i + 3])}
  `(
    `Applies defers native immutable method $name both in and outside render `,
    async ({ method }) => {
      let created;
      const futrArr = fetchArray('/blogs');
      expect(() => {
        expect(unwrapProxy(method(futrArr))).toBeInstanceOf(LazyArray);
      }).not.toThrow();
      let renderer;
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

      expect(unwrapProxy(created)).toBeInstanceOf(LazyArray);
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
      const futrArr = fetchArray('/blogs');
      expect(() => {
        expect(unwrapProxy(method(futrArr))).toBeInstanceOf(LazyIterator);
      }).not.toThrow();
      let renderer;
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
      expect(unwrapProxy(created)).toBeInstanceOf(LazyIterator);
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
      const futureArray = fetchArray('/blogs');

      const inRender = () => method(futureArray);
      const outsideRender = () =>
        expect(() =>
          method(futureArray)
        ).toThrowError(/** TODO: outofrender error */);

      act(() => {
        outsideRender();
      });

      let renderer;
      let created;
      expect(() => method(resource)).toThrow(); //TODO: specify error
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
    const resources = fetchArray('/blogs');
    //suspends on Array.from, Array.isArray, have Array.of static method
    expect(unwrapProxy(resources)).toBeInstanceOf(Array);
    expect(Array.isArray(resources)).toEqual(true);
    expect(() => Array.from(resources)).toThrow();

    let created;
    expect(() => Array.from(resources)).toThrowError(); //TODO: specify error
    let renderer;
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
    await waitFor(() => getByText('foo'));
    expect(created).toBeInstanceOf(Array);
    expect(created).not.toBeInstanceOf(FutureArray);
    expect(created).toEqual([2, 3, 4, 5]);

    expect(unwrapProxy(LazyArray.of(() => [2, 3, 4]))).toBeInstanceOf(LazyArray);
  });
  test.skip('forEach should return undefined, throw inside render, and defer outside render', async () => {
    const futArr = fetchArray('/blogs');
    let final;
    const inRender = () => expect(() => {
      futArr.forEach(val => {
        final = val
      })
    }).toThrowError();

    const outsideRender = () => {
      futArr.forEach(val => {
        final = val
      })      
    };
    act(() => {
      outsideRender();
    });
    let renderer;
    act(() => {
      renderer = render(
        <Suspense fallback={<div>Loading...</div>}>
          <LogSuspense action={inRender}>foo</LogSuspense>
        </Suspense>,
        container
      );
    });
    await waitForSuspense(150);

    expect(final).toEqual(5)
  })
  // it('has immutable static @@species', () => {
  //   let clss = ArrayResource[Symbol.species];
  //   ArrayResource[Symbol.species] = class {};
  //   expect(Object.is(clss, ArrayResource[Symbol.species])).toEqual(true);
  // });
  test.skip('should have debug method', () => {});
});

describe('Running iteration callbacks in parallel', () => {
  beforeEach(() => {
    jest.useRealTimers()
  })

  test('filter outside render', async () => {
    const futureArray = fetchArray('/blogs');

    const without3 = futureArray
                       .filter( num => num +  new FetchObject('/person?value='+num).value !== 6)

    const without3Res = await toPromise(without3);

    // timeout of futureArray + timeout of FutureVal
    expect( without3Res ).toEqual([2,4,5])
  }, 400)

  test('map outside render', async () => {
    const futureArray = fetchArray('/blogs');
    let double = futureArray
                  .map(num =>  num + new FetchObject('/person?value='+num).value);
    const doubleRes = await toPromise(double);
    expect(doubleRes).toEqual([4,6,8,10])
  }, 400);

  test('sort outside render', async () => {
    const sorted = fetchArray('/blogs')
                        .sort((a, b) => {
                          return b -  new FetchObject('/person?value='+num).value
                        })
    const resolved = await toPromise(sorted);
    expect(resolved).toEqual([5,4,3,2])
  }, 600)

  test('flatMap outside render', async () => {
    const futureArray = fetchArray('/blogs');

    let flatted = futureArray.flatMap(num => fetchArray('/blogs?value=' + num));

    const flattedRes = await toPromise(flatted);
    expect(flattedRes).toEqual([
      2, 3, 4, 2, 2, 3,
      4, 3, 2, 3, 4, 4,
      2, 3, 4, 5
    ])
  }, 400);

  test('find', async () => {
    const futureArray = fetchArray('/blogs');
    let val;
    const arr = lazyArray(() => {
      val = futureArray.find( num => num + new FetchObject('/person?value='+num).value === 6 );
      return []
    })
    await toPromise(arr);
    expect(val).toEqual(3);
  }, 400);

  test('every', async () => {
    const futureArray = fetchArray('/blogs');
    let val;
    const arr = lazyArray(() => {
      val = futureArray.every( num => num === new FetchObject('/person?value='+num).value );
      return [];
    })
    await toPromise(arr);
    expect(val).toEqual(true);
  }, 400);

  test('some', async () => {
    const futureArray = fetchArray('/blogs');
    let val;
    const arr = lazyArray(() => {
      val = futureArray.some( num => num !== new FetchObject('/person?value='+num).value);
      return [];
    });
    await toPromise(arr);
    console.log("HOLLAA")
    expect(val).toEqual(true);
  }, 400);
  test('findIndex', async () => {
    const futureArray = fetchArray('/blogs');
    let val;
    const arr = lazyArray(() => {
      val = futureArray.findIndex( num => num + new FetchObject('/person?value='+num).value === 6);
      return [];
    });

    await toPromise(arr);
    expect(val).toEqual(1);
  }, 400);
});